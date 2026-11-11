// Top — Process: how we work, as a loop (after Boyd's OODA loop:
// observe, orient, decide, act — one phase each), then under each phase
// the work it holds, drawn from the works' scopes, with a 16:9 film above
// it. Laid out like the Services list on et cetera's About page: numbered
// rows between hairlines.
// Copy agreed 2026-11-11; the films are stand-ins from the works for now.

import type { Bilingual } from './about';

export type ProcessPhase = {
	name: Bilingual;
	/** The OODA phase it stands for (Observe …). */
	label: Bilingual;
	body: Bilingual;
	/** The work this phase holds. */
	tasks: Bilingual[];
	/** A 16:9 film shown above the phase (cropped to fill). */
	film: string;
};

export const PROCESS_HEADING: Bilingual = {
	en: 'A loop, not a line',
	ja: '直線ではない循環的創作'
};

export const PROCESS_LEAD: Bilingual = {
	en: 'Our work does not run one way, from brief to delivery. Taking the idea known as the OODA loop (Boyd, 1987) as its ground, it is a loop — observing, orienting, deciding, acting — travelled again and again, sharpening the question itself as we go. The weight falls on orientation: how what we see is read. Held against culture, history and the senses of the body, that reading is where we believe a form finds its necessity.',
	ja: 'わたしたちの仕事は、企画から納品へと一方向に進む工程ではありません。OODAループ (Boyd, 1987) と呼ばれる考え方を下敷きに、観る、読み解く、選び取る、世に出す——その四つを何度も巡りながら、問いそのものを磨いていく循環です。とりわけ重きを置くのは「読み解く」こと。見たものを文化や歴史、身体の感覚に照らして問い直すその時間が、かたちの必然を決めると考えています。'
};

export const PROCESS: ProcessPhase[] = [
	{
		name: { en: 'Research & Strategy', ja: 'リサーチと戦略' },
		label: { en: 'Observe', ja: '観る' },
		body: {
			en: 'Before thinking, we look. Setting assumptions aside, we observe not only markets and competitors but the air of a place, how things are used, their material, form and feel. We begin by taking in what is there as it is, then slowly look into what lies behind it.',
			ja: '考える前にまず観る。先入観をいったん脇に置き、市場や競合だけでなく、場の空気、使われ方、素材や造形・手触りまでを観察します。そこにあるものをそのまま受け取ることから始め、ゆっくりとその背景を観ていきます。'
		},
		tasks: [
			{ en: 'Market and competitor research', ja: '市場・競合リサーチ' },
			{ en: 'Interviews and workshops', ja: 'ヒアリング・ワークショップ' },
			{ en: 'Fieldwork', ja: 'フィールドワーク' },
			{ en: 'Brand audit', ja: '既存ブランドの棚卸し' },
			{ en: 'Brand strategy and positioning', ja: 'ブランド戦略・ポジショニング' }
		],
		film: 'https://cdn.takumiisobe.com/13_typography_statements_bk.mp4'
	},
	{
		name: { en: 'Identity', ja: 'アイデンティティの策定' },
		label: { en: 'Orient', ja: '読み解く' },
		body: {
			en: 'What we have seen, we read across the cultures and the spirit of the age we hold dear. Ours is a strange age, rich in information — and because it is, it opens new pleasures and new ways of use, even the most outlandish ideas. We pursue every possibility, unbound by convention.',
			ja: 'その観たものを、わたしたちが大事にする文化や時代性を横断し、読み解いていきます。わたしたちの生きるこの現代は情報に富む異質な時代。そんな現代だからこそ生まれる楽しみ方や使われ方、奇想天外なアイデアまで常識に囚われず可能性を追求します。'
		},
		tasks: [
			{ en: 'Concept and statement', ja: 'コンセプト・ステートメント' },
			{ en: 'Naming', ja: 'ネーミング' },
			{ en: 'Visual identity and logo', ja: 'VI・ロゴ' },
			{ en: 'Typeface design', ja: '書体開発' }
		],
		film: 'https://cdn.takumiisobe.com/13_miles158_brand_animation.mp4'
	},
	{
		name: { en: 'Design & Production', ja: 'デザインと制作' },
		label: { en: 'Decide', ja: '選び取る' },
		body: {
			en: 'To decide is also to let go. From the countless possibilities pursued without constraint, we choose only what can be called necessary — in its purpose, use, structure and message — and design it.',
			ja: '決めることは、捨てることでもあります。何事にも囚われず追求した無数の可能性のなかから、目的・用途構造・メッセージなどの関係において必然と呼べるものを選び取り、デザインしていきます。'
		},
		tasks: [
			{ en: 'Packaging', ja: 'パッケージ' },
			{ en: 'Product and furniture design', ja: 'プロダクト・家具の設計' },
			{ en: 'Brand sites and e-commerce', ja: 'ブランドサイト・EC構築' },
			{ en: 'Reservation systems and web apps', ja: '予約・管理システム、Webアプリ' },
			{ en: 'UI / UX', ja: 'UI/UX設計' }
		],
		film: 'https://cdn.takumiisobe.com/12_one_pv_slider.mp4'
	},
	{
		name: { en: 'Art Direction & Visualisation', ja: 'アートディレクションとビジュアライズ' },
		label: { en: 'Act', ja: '世に出す' },
		body: {
			en: 'A form receives its response only once it is out in the world. Making is an interaction: every response becomes a store for our work and leads on to further inspiration. We observe again, return to the question… and the next loop begins.',
			ja: 'かたちは世に出て、はじめてレスポンスを得ます。創作はインタラクション。全ての反応はわたしたちの創作における蓄えとなり、また更なるインスピレーションへとつながります。また観察し、問いへ戻り...次の循環が始まります。'
		},
		tasks: [
			{ en: 'Art direction', ja: 'アートディレクション' },
			{ en: 'Creative direction', ja: 'クリエイティブディレクション' },
			{ en: 'Motion and film', ja: 'モーション・映像' },
			{ en: 'CG imaging and photography', ja: 'CG・撮影' }
		],
		film: 'https://cdn.takumiisobe.com/OTIC_Thalassic_Fluid_02.mp4'
	}
];
