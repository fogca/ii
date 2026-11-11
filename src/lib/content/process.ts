// Top — Process: how we work, as a loop (after Boyd's OODA loop:
// observe, orient, decide, act), then under each phase the work it holds,
// drawn from the works' scopes. Laid out like the Services list on
// et cetera's About page: numbered rows between hairlines.
// DRAFT copy (2026-11-11), not agreed yet.

import type { Bilingual } from './about';

export type ProcessPhase = {
	/** The phase's name, English in both languages (Observe …). */
	name: string;
	/** A short line under the name. */
	label: Bilingual;
	body: Bilingual;
	/** The work this phase holds. */
	tasks: Bilingual[];
};

export const PROCESS_HEADING: Bilingual = {
	en: 'A loop, not a line',
	ja: '直線ではなく、循環として'
};

export const PROCESS_LEAD: Bilingual = {
	en: 'Our work does not run one way, from brief to delivery. Taking the idea known as the OODA loop (Boyd, 1987) as its ground, it is a loop — observing, orienting, deciding, acting — travelled again and again, sharpening the question itself as we go. The weight falls on orientation: how what we see is read. Held against culture, history and the senses of the body, that reading is where we believe a form finds its necessity.',
	ja: 'わたしたちの仕事は、企画から納品へと一方向に進む工程ではありません。OODAループ (Boyd, 1987) と呼ばれる考え方を下敷きに、観る、読み解く、選び取る、世に出す——その四つを何度も巡りながら、問いそのものを磨いていく循環です。とりわけ重きを置くのは「読み解く」こと。見たものを文化や歴史、身体の感覚に照らして問い直すその時間が、かたちの必然を決めると考えています。'
};

export const PROCESS: ProcessPhase[] = [
	{
		name: 'Observe',
		label: { en: 'Looking before knowing', ja: '観る' },
		body: {
			en: 'Before knowing, we look. Setting assumptions aside, we observe not only markets and competitors but the air of a place, the gestures of those who use things, the feel of a material — taking in what is there before hurrying to an answer.',
			ja: '知る前に、まず観る。先入観をいったん脇に置き、市場や競合だけでなく、場の空気、使い手の所作、素材の手触りまでを観察します。答えを急がず、そこにあるものをそのまま受け取ることから始めます。'
		},
		tasks: [
			{ en: 'Market and competitor research', ja: '市場・競合リサーチ' },
			{ en: 'Interviews and workshops', ja: 'ヒアリング・ワークショップ' },
			{ en: 'Fieldwork', ja: 'フィールドワーク' },
			{ en: 'Brand audit', ja: '既存ブランドの棚卸し' }
		]
	},
	{
		name: 'Orient',
		label: { en: 'Reading what is seen', ja: '読み解く' },
		body: {
			en: 'What we see is given meaning by the culture, history and philosophy we stand on. We read where a brand stands in its age and what it should hand on, and put that into words — the axis every later decision returns to. This is the heart of the loop.',
			ja: '観たものに意味を与えるのは、わたしたちが拠って立つ文化や歴史、哲学です。ブランドが時代のどこに立ち、何を手渡すべきかを読み解き、その後のあらゆる判断が立ち返る軸として言語化します。この循環の要は、ここにあります。'
		},
		tasks: [
			{ en: 'Brand strategy and positioning', ja: 'ブランド戦略・ポジショニング' },
			{ en: 'Concept and statement', ja: 'コンセプト・ステートメント' },
			{ en: 'Naming', ja: 'ネーミング' },
			{ en: 'Creative direction', ja: 'クリエイティブディレクション' }
		]
	},
	{
		name: 'Decide',
		label: { en: 'Choosing by letting go', ja: '選び取る' },
		body: {
			en: 'To decide is also to let go. From countless possibilities we keep only the forms that feel necessary in their material, structure and presence, and fix them as identities, typefaces and objects.',
			ja: '決めることは、捨てることでもあります。無数の可能性のなかから、素材・構造・佇まいの関係において必然と呼べるかたちだけを選び取り、アイデンティティや書体、プロダクトとして定着させます。'
		},
		tasks: [
			{ en: 'Visual identity and logo', ja: 'VI・ロゴ' },
			{ en: 'Typeface design', ja: '書体開発' },
			{ en: 'Packaging', ja: 'パッケージ' },
			{ en: 'Product and furniture design', ja: 'プロダクト・家具の設計' },
			{ en: 'Art direction', ja: 'アートディレクション' }
		]
	},
	{
		name: 'Act',
		label: { en: 'Putting out, listening back', ja: '世に出す' },
		body: {
			en: 'A form is answered only once it is out in the world. We build it — as sites, e-commerce, film and imagery — watch how it is used, and return to the first question. Completion is not an end but the start of the next loop.',
			ja: 'かたちは世に出て、はじめて応答を得ます。Web、EC、映像、イメージとして実装し、使われ方を観察して、また最初の問いへ戻る。完成は終わりではなく、次の循環の始まりです。'
		},
		tasks: [
			{ en: 'Brand sites and e-commerce', ja: 'ブランドサイト・EC構築' },
			{ en: 'Reservation systems and web apps', ja: '予約・管理システム、Webアプリ' },
			{ en: 'UI / UX', ja: 'UI/UX設計' },
			{ en: 'Motion and film', ja: 'モーション・映像' },
			{ en: 'CG imaging and photography', ja: 'CG・撮影' },
			{ en: 'Running and improving', ja: '運用・改善' }
		]
	}
];
