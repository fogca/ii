// About Institute — statement copy (agreed with the client 2026-09-30).
// Numbered section titles stay English in both languages; everything else
// is EN/JA and follows the display-language switch. Services and the Ethos
// lead derive from the Office site's copy (Dev/OTIF/src/routes/office/
// +page.svelte), summarised; Office's "Image Visualisation" is replaced by
// Research & Strategy. IV. Director is Office's director profile as is.
// A "\n" in a body is a line break. Static content: not in the CMS.

export type Bilingual = { en: string; ja: string };

/** A numbered item (Services / Ethos parts): its name in each language
    and a bilingual body; rendered run-in, one paragraph per section. */
export type AboutItem = { name: string; nameJa: string; body: Bilingual };

export type AboutSection = {
	/** e.g. "I. Introduction" — English in both languages. */
	title: string;
	heading?: Bilingual;
	body?: Bilingual;
	items?: AboutItem[];
};

export const ABOUT: AboutSection[] = [
	{
		title: 'I. Introduction',
		body: {
			en: 'II is a creative institute based in Tokyo discovering across crafts and design engineering — experience, brand, product, type, furniture, and digital communication. By blending culture and philosophy with design, we pursue creation that speaks to what makes us human — our physicality, our emotion.',
			ja: 'IIは東京を拠点に、デザインエンジニアリング——体験、ブランド、プロダクト、タイプ、家具、デジタルコミュニケーションを横断するクリエイティブインスティチュートです。文化と哲学にデザインを掛け合わせることで生まれる、わたしたちを人間たらしめる——身体性と情緒に語りかけるクリエイションを追求します。'
		}
	},
	{
		title: 'II. Services & Partners',
		heading: {
			en: 'Four practices and a network of partner studios',
			ja: '4つの領域とパートナーシップ'
		},
		items: [
			{
				name: 'Research & Strategy',
				nameJa: 'リサーチと戦略',
				body: {
					en: 'We begin by reading the age and where a brand stands in it — through research, dialogue and study — and translate what we find into a strategy and direction that every later decision can return to.',
					ja: '時代とブランドの立ち位置を、リサーチと対話、学びを通して読み解き、その後のあらゆる判断が立ち返ることのできる戦略とディレクションへと翻訳します。'
				}
			},
			{
				name: 'Product Engineering',
				nameJa: 'プロダクトと家具の設計・開発',
				body: {
					en: 'Returning to the materiality that meets the body, we design and develop products and furniture whose forms arise from material, structure and presence — objects that bring use and quiet joy to daily life.',
					ja: '身体に触れる物質性に立ち返り、素材・構造・佇まいの関係から必然のかたちを導き、日々の所作に添う用と喜びのあるプロダクトと家具を企画・開発します。'
				}
			},
			{
				name: 'V.I. & Typeface',
				nameJa: 'ビジュアルアイデンティティと書体の開発',
				body: {
					en: 'We shape identities through logo, graphic and package design, carrying the precision of our partner type foundry, Ōgast — which reinterprets history to draw new typefaces — into every brand.',
					ja: 'ロゴ、グラフィック、パッケージを通してブランドの造形言語をつくります。歴史を紐解き新たな書体を生み出すパートナーのタイプファウンダリ、Ōgastで培ったディテールへの眼差しを、すべてのアイデンティティに通わせます。'
				}
			},
			{
				name: 'Digital Infrastructure',
				nameJa: 'UXとデジタルコミュニケーションの設計',
				body: {
					en: 'With our partner engineering studio, Post Script, we design and build brand sites, e-commerce, reservation systems, web apps and AI / DX integration — giving a brand its form in the digital world.',
					ja: 'パートナーのエンジニアリングスタジオ、Post Scriptとともに、ブランドサイト、Eコマース、予約システム、Webアプリ、AI/DXインテグレーションまでを設計・実装し、ブランドのデジタル体験を形にします。'
				}
			}
		]
	},
	{
		title: 'III. Ethos',
		heading: {
			en: 'Humanism rooted in the body',
			ja: '身体性に根ざしたヒューマニズム'
		},
		body: {
			en: 'The 21st century we inhabit is driven by capitalism — the ceaseless cycle of production and consumption. Designers, too, are one of its gears: we give contour to the formless, spur consumption, and send things out into the world. As those who help accelerate that consumption, we feel we must look closely at this age and keep learning from it.',
			ja: 'わたしたちが生きる21世紀は、生産と消費の絶え間ない循環——資本主義によって駆動されています。デザイナーもまた、その歯車のひとつとして、形のないものに輪郭を与え、消費を促し、世に送り出すことを生業としています。その消費を促進させる身として、わたしたちはこの時代をよく捉え、学んでいく必要があると感じています。'
		},
		items: [
			{
				name: 'Acceleration and Attention Economy',
				nameJa: '加速主義とアテンション経済',
				body: {
					en: 'Technology, society and the very pace of life keep accelerating, and the margin to pause is lost (Rosa, 2005). Our attention and behaviour are mined as capital, and mechanisms engineered to trigger dopamine come to govern our habits (Zuboff, 2019), while each act of consumption stacks an unseen burden upon the future (Crutzen, 2000). What this acceleration has cost us is, we believe, corporeality itself.',
					ja: '技術も、社会も、生活のペースも加速し続け、立ち止まる余白は失われつつあります (Rosa, 2005)。人の注意や行動は資本として搾取され、ドーパミンを刺激する仕組みがわたしたちの習慣を支配していきます (Zuboff, 2019)。消費のひとつひとつは、見えないところで未来に負荷を積み重ねています (Crutzen, 2000)。この加速のなかでわたしたちが失ったのは、身体性なのではないかと考えています。'
				}
			},
			{
				name: 'Le corps vécu and Resonance',
				nameJa: '生きられた身体と共鳴',
				body: {
					en: 'We dwell in the world through the body before we understand it with the head — what Merleau-Ponty called le corps vécu, the lived body (Merleau-Ponty, 1945). It is precisely this experience that grows thin in an accelerating world (Bauman, 2000). At its opposite pole lies resonance: not owning the world, but calling out to it and being answered (Rosa, 2016). To move our focus toward corporeality and emotion is not nostalgia, but a return to resonating with the world once more.',
					ja: '人は頭より先に、身体を通して世界に住み込んでいる——メルロー＝ポンティはそれを「生きられた身体（le corps vécu）」と呼びました (Merleau-Ponty, 1945)。加速する世界で痩せていくのは、まさにこの身体を通した経験です (Bauman, 2000)。その対極にあるのが、世界を所有するのではなく、呼びかけ、応答される「共鳴」という関係です (Rosa, 2016)。身体性と情緒へ焦点を移すこと。それは懐古ではなく、世界と再び共鳴するための回帰です。'
				}
			},
			{
				name: 'Defuturing',
				nameJa: '脱未来化',
				body: {
					en: 'To keep making the unsustainable is to quietly rob the next generation of its choices — defuturing (Fry, 1999). The responsibility of those who give form to the formless was named half a century ago (Papanek, 1971), and we ourselves accelerate consumption while knowing astonishingly little of how the world is shaped. That is why, to leave something to hand on, we will not stop thinking, and will keep on learning.',
					ja: '持続不可能なものを作り続けることは、次の世代から選択肢を静かに奪う「脱未来化」にほかなりません (Fry, 1999)。形のないものに形を与えるデザイナーの責任は、半世紀前から問われてきました (Papanek, 1971)。わたしたち自身も消費を加速させる当事者であり、世界の成り立ちについて驚くほど知りません。だからこそ、次代に手渡せるものを残すために、思考を止めず、学びを続けてまいります。'
				}
			}
		]
	},
	{
		title: 'IV. Director',
		heading: {
			en: 'Takumi Isobe',
			ja: '磯部タクミ'
		},
		body: {
			en: 'Born in Japan in 2001.\nWhile attending the University of Westminster in the UK, exposed to a wide range of cultures and arts, I developed a strong interest in visual expression and entered the creative design industry. After returning to Japan during COVID-19 and working at several design studios in Tokyo, I established my own practice. Today, as creative director at Mirai Service Co., Ltd., I run a design office at the core of my work, alongside AUGUST — a type foundry designing original typefaces — and an image-making studio.',
			ja: '2001年日本生まれ。\n英国University of Westminster在学時、多様な文化と芸術に触れる中で、視覚表現に強く興味を抱きクリエイティブ・デザイン業界へ。COVID19の中で帰国し東京都内のデザインオフィス数社を経て、独立。現在は株式会社みらいサービスのクリエイティブ事業部ディレクターとして、デザインオフィスを基軸に独自の書体を開発設計するAUGUSTタイプファウンダリやイメージメークスタジオの運営を行っている。'
		}
	}
];
