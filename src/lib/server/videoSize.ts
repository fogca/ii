// The CMS stores no size for a video, and a card box built on a guessed 16:9
// crops anything else. This reads the real pixel size from the file itself:
// the first track header ('tkhd') inside the MP4's 'moov' box, found with a
// couple of small Range requests (moov sits at the front of faststart files,
// else at the tail). Cached per isolate; any failure just means "unknown".

type Size = { width: number; height: number } | null;

const HEAD_BYTES = 262144;
const TIMEOUT_MS = 3500;
const cache = new Map<string, Promise<Size>>();

const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const i32 = (b: Uint8Array, o: number) => u32(b, o) | 0;
const type = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/** Child boxes of [start, end): their type and body range. */
const boxes = (b: Uint8Array, start: number, end: number) => {
	const out: { type: string; from: number; to: number; size: number }[] = [];
	let o = start;
	while (o + 8 <= end) {
		let size = u32(b, o);
		const t = type(b, o + 4);
		let head = 8;
		if (size === 1) {
			size = u32(b, o + 12); // 64-bit size: the low word is enough here
			head = 16;
		} else if (size === 0) size = end - o;
		if (size < head) break;
		out.push({ type: t, from: o + head, to: Math.min(o + size, end), size });
		o += size;
	}
	return out;
};

const fromMoov = (b: Uint8Array, from: number, to: number): Size => {
	for (const trak of boxes(b, from, to).filter((x) => x.type === 'trak')) {
		const tkhd = boxes(b, trak.from, trak.to).find((x) => x.type === 'tkhd');
		if (!tkhd) continue;
		const v1 = b[tkhd.from] === 1;
		const m = tkhd.from + (v1 ? 52 : 40); // the 3×3 matrix
		const w = u32(b, m + 36) / 65536;
		const h = u32(b, m + 40) / 65536;
		if (!w || !h) continue; // an audio track has no size
		const turned = i32(b, m) === 0 && i32(b, m + 4) !== 0; // rotated 90°/270°
		return turned ? { width: h, height: w } : { width: w, height: h };
	}
	return null;
};

const range = async (url: string, spec: string) => {
	const res = await fetch(url, { headers: { Range: `bytes=${spec}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
	if (!res.ok) throw new Error(String(res.status));
	return { bytes: new Uint8Array(await res.arrayBuffer()), total: Number(res.headers.get('content-range')?.split('/')[1] ?? 0) };
};

const probe = async (url: string): Promise<Size> => {
	try {
		const head = await range(url, `0-${HEAD_BYTES - 1}`);
		// Walk the top-level boxes by their sizes until 'moov'; a header
		// outside the first chunk costs one tiny Range request.
		let offset = 0;
		for (let guard = 0; guard < 16 && (!head.total || offset < head.total); guard++) {
			const h = offset + 16 <= head.bytes.length ? head.bytes.subarray(offset, offset + 16) : (await range(url, `${offset}-${offset + 15}`)).bytes;
			let size = u32(h, 0);
			if (size === 1) size = u32(h, 12);
			if (!size) return null;
			if (type(h, 4) === 'moov') {
				const body =
					offset + size <= head.bytes.length
						? head.bytes.subarray(offset, offset + size)
						: (await range(url, `${offset}-${offset + size - 1}`)).bytes;
				return fromMoov(body, 8, body.length);
			}
			offset += size;
		}
		return null;
	} catch {
		return null;
	}
};

export const videoSize = (url: string): Promise<Size> => {
	let hit = cache.get(url);
	if (!hit) {
		hit = probe(url);
		cache.set(url, hit);
	}
	return hit;
};
