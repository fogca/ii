import { fail } from '@sveltejs/kit';
// Dynamic (not static) so a not-yet-configured deploy still builds — the vars
// are read at request time from the Cloudflare env. Missing keys surface as a
// clean error below rather than a build failure.
import { env } from '$env/dynamic/private';
import { titleOf } from '$lib/js/site';
import { INQUIRY_TYPES, type InquiryType } from './inquiry';
import type { Actions, PageServerLoad } from './$types';

// /contact — after the Office site's (Dev/OTIF) form: Resend's REST API (HTTP
// only, so it runs on Cloudflare), a honeypot, server-side validation, the
// inquiry to the studio and an acknowledgement to the visitor.
// Env (Cloudflare Pages): RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
// — the from address on ii-ii.co, verified in Resend (DKIM/SPF).

const NAME_MAX = 200;
const COMPANY_MAX = 200;
const PHONE_MAX = 40;
const MSG_MIN = 10;
const MSG_MAX = 5000;
const FALLBACK_EMAIL = 'hi@takumiisobe.com';

/** Error codes; the page words each in both languages. */
export type FieldError = 'name' | 'company' | 'email' | 'phone' | 'message' | 'type';
export type FormError = 'unconfigured' | 'failed' | 'network';

export const load: PageServerLoad = () => ({
	seo: { title: titleOf('Contact') }
});

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');

// Also rejects CR/LF — header injection, since this goes into reply_to.
const isEmail = (v: string) => v.length <= 254 && !/[\r\n]/.test(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isType = (v: string): v is InquiryType => INQUIRY_TYPES.some((t) => t.value === v);

const send = (apiKey: string, body: Record<string, unknown>) =>
	fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		// Honeypot: `website` is hidden and off the tab order; only bots fill
		// it. Pretend success so they learn nothing.
		if (str(data.get('website'))) return { success: true };

		const values = {
			type: str(data.get('type')),
			name: str(data.get('name')),
			company: str(data.get('company')),
			email: str(data.get('email')),
			phone: str(data.get('phone')),
			message: str(data.get('message'))
		};

		// The browser's required/type=email are a convenience, not a guarantee.
		const errors: FieldError[] = [];
		if (!isType(values.type)) errors.push('type');
		if (values.name.length < 1 || values.name.length > NAME_MAX) errors.push('name');
		if (values.company.length > COMPANY_MAX) errors.push('company');
		if (!isEmail(values.email)) errors.push('email');
		if (values.phone.length > PHONE_MAX) errors.push('phone');
		if (values.message.length < MSG_MIN || values.message.length > MSG_MAX) errors.push('message');
		if (errors.length) return fail(400, { values, errors });

		const apiKey = env.RESEND_API_KEY;
		const to = env.CONTACT_TO_EMAIL;
		const from = env.CONTACT_FROM_EMAIL; // never the visitor's address
		if (!apiKey || !to || !from) {
			console.error('[contact] missing env: RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL');
			return fail(500, { values, formError: 'unconfigured' as FormError, fallback: FALLBACK_EMAIL });
		}

		const type = INQUIRY_TYPES.find((t) => t.value === values.type)!;
		const line = (label: string, v: string) => (v ? `${label}: ${v}\n` : '');
		const row = (label: string, v: string) => (v ? `<p><strong>${label}:</strong> ${escapeHtml(v)}</p>` : '');

		const text =
			line('Type', type.en) +
			line('Name', values.name) +
			line('Company', values.company) +
			line('Email', values.email) +
			line('Phone', values.phone) +
			`\n${values.message}`;
		const html =
			row('Type', type.en) +
			row('Name', values.name) +
			row('Company', values.company) +
			row('Email', values.email) +
			row('Phone', values.phone) +
			`<p style="white-space:pre-wrap">${escapeHtml(values.message)}</p>`;

		try {
			const res = await send(apiKey, {
				from,
				to: [to],
				reply_to: values.email,
				subject: `[II Contact / ${type.en}] ${values.name}${values.company ? ` — ${values.company}` : ''}`,
				text,
				html
			});
			if (!res.ok) {
				console.error('[contact] Resend responded', res.status, await res.text().catch(() => ''));
				return fail(502, { values, formError: 'failed' as FormError, fallback: FALLBACK_EMAIL });
			}
		} catch (err) {
			console.error('[contact] Resend request threw', err);
			return fail(502, { values, formError: 'network' as FormError, fallback: FALLBACK_EMAIL });
		}

		// Acknowledgement to the visitor: after the inquiry is safely delivered
		// and fire-and-forget — a failure here must never turn a received
		// message into an error the visitor then re-sends. Both languages (the
		// submission carries no language), JA first; replies reach the studio.
		try {
			const ackText =
				`${values.name} 様\n\n` +
				`このたびはお問い合わせいただき、ありがとうございます。\n` +
				`以下の内容で承りました。5営業日以内にご返信いたします。\n\n` +
				`----------------------------------------\n` +
				line('種別', type.ja) +
				line('お名前', values.name) +
				line('会社名', values.company) +
				line('メールアドレス', values.email) +
				line('電話番号', values.phone) +
				`\n${values.message}\n` +
				`----------------------------------------\n\n` +
				`本メールは自動送信ですが、このままご返信いただけます。\n\n` +
				`— — —\n\n` +
				`Dear ${values.name},\n\n` +
				`Thank you for reaching out. We have received your message as shown\n` +
				`above, and will reply within five business days.\n\n` +
				`This is an automated confirmation, but you can reply to it directly.\n\n` +
				`II — Isobe Institute\n` +
				`https://ii-ii.co`;
			const ackHtml =
				`<p>${escapeHtml(values.name)} 様</p>` +
				`<p>このたびはお問い合わせいただき、ありがとうございます。<br>` +
				`以下の内容で承りました。5営業日以内にご返信いたします。</p><hr>` +
				row('種別', type.ja) +
				row('お名前', values.name) +
				row('会社名', values.company) +
				row('メールアドレス', values.email) +
				row('電話番号', values.phone) +
				`<p style="white-space:pre-wrap">${escapeHtml(values.message)}</p><hr>` +
				`<p>本メールは自動送信ですが、このままご返信いただけます。</p>` +
				`<p>— — —</p>` +
				`<p>Dear ${escapeHtml(values.name)},</p>` +
				`<p>Thank you for reaching out. We have received your message as shown ` +
				`above, and will reply within five business days.</p>` +
				`<p>This is an automated confirmation, but you can reply to it directly.</p>` +
				`<p>II — Isobe Institute<br><a href="https://ii-ii.co">ii-ii.co</a></p>`;
			const ack = await send(apiKey, {
				from,
				to: [values.email],
				reply_to: to,
				subject: 'お問い合わせありがとうございます — II / Isobe Institute',
				text: ackText,
				html: ackHtml
			});
			if (!ack.ok) console.error('[contact] ack email failed', ack.status, await ack.text().catch(() => ''));
		} catch (err) {
			console.error('[contact] ack email threw', err);
		}

		return { success: true };
	}
};
