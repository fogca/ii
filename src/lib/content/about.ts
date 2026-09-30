// About Institute — statement copy. EN verbatim from Figma (II_About,
// 79:204 / 123:115); JA from the Office site's Ethos section
// (Dev/OTIF/src/routes/office/+page.svelte, ethosParts), which carries the
// same three parts in both languages. Static content: not in the CMS.

export type AboutSection = {
	heading: string;
	/** JA subtitle shown after the EN heading in Japanese mode (as on Office). */
	headingJa: string;
	body: string;
	bodyJa: string;
};

export const ABOUT: AboutSection[] = [
	{
		heading: 'I. Acceleration and Attention Economy',
		headingJa: '/ 加速主義とアテンション経済',
		body: 'The present we live in sits amid a confusion faster and deeper than at the dawn of the Industrial Revolution, or even the Digital one. Technology accelerates, social change accelerates, and the very pace of life accelerates; the margin to pause is lost, and we are ceaselessly driven by something (Rosa, 2005). Upon this acceleration, human attention and behaviour themselves are treated as capital and mined; built on that data, mechanisms engineered to trigger dopamine come to govern our habits, and the inner life turns into a commodity (Zuboff, 2019). Easy happiness has become something taken instantly — and at the same time we are made to feel that it is not what we chose, but a consequence the structure has produced. Within that same acceleration, we keep transforming the planet irreversibly; each act of consumption stacks an unseen burden upon the future (Crutzen, 2000). What this acceleration, attention economy, and environmental burden have cost us is, we believe, corporeality itself.',
		bodyJa: 'わたしたちの生きる今は、産業革命が起きた時よりも、デジタル革命が起きた時よりも、なお速く、深い混乱のただ中にあります。技術が加速し、社会の変化が加速し、生活のペースそのものが加速していく。立ち止まるための余白は失われ、わたしたちは絶えず追い立てられています (Rosa, 2005)。加速の上では、人の注意や行動そのものが資本的価値とみなされ搾取され、それらを基にドーパミンを刺激するよう設計された仕組みがわたしたちの行動を支配していきます (Zuboff, 2019)。簡便な幸福がインスタントに摂取できるものになったと同時に、それはわたしたちが選び取ったものではなく、構造がもたらした結果にすぎないのだと思わされます。またその加速のなかで、わたしたちは地球環境を不可逆に変容させ続けています。消費のひとつひとつが、見えないところで未来に負荷を積み重ねています (Crutzen, 2000)。この加速と行動の搾取、そして環境への負荷によってわたしたちが真に失ったのは、身体性なのではないかと考えています。'
	},
	{
		heading: 'II. Le corps vécu and Resonance',
		headingJa: '/ 生きられた身体と共鳴',
		body: '“The human being does not first understand the world with the head, but dwells within it through the body; the lived body — le corps vécu — is the first site that binds the world and us.” So Merleau-Ponty wrote in his Phenomenology of Perception (Merleau-Ponty, 1945). What grows thin within the accelerating world is precisely this experience through the body (Bauman, 2000). To see, to touch, to feel with the skin — what remains in the body as substance has grown relatively faint, and that sensation is our point of departure. At the opposite pole of acceleration lies resonance: a relationship in which we do not own or dominate the world, but call out to it and are answered in turn (Rosa, 2016). What we would call “a more fundamental and certain interaction” feels close to this resonance. To move our focus toward corporeality, and toward emotion — this is not nostalgia, but a return for resonating with the world once more.',
		bodyJa: '「人間は、まず頭で世界を理解するのではなく、身体を通して世界のなかに住み込んでいる。『生きられた身体（le corps vécu）』こそが、世界とわたしたちを繋ぐ最初の場である」と、メルロー＝ポンティはその著書『知覚の現象学』で説いています (Merleau-Ponty, 1945)。加速していく世界のなかで痩せていくのは、まさにこの「身体を通した経験」なのだと思います (Bauman, 2000)。見て、触れて、その肌で感じること、実体として身体に残るものが、相対的に薄くなっている——その感覚が、わたしたちの出発点にあります。その加速の対極に位置するのが、「共鳴（Resonance）」と呼ばれる、世界を所有し支配するのではなく、世界に呼びかけ、世界から応答される関係です (Rosa, 2016)。わたしたちが「より根源的で確かな相互作用」と呼びたいものは、おそらくこの共鳴に近いものだと感じています。身体性、そして情緒へと焦点を移すこと。それは懐古ではなく、世界と共鳴するための回帰なのだと、わたしたちは捉えています。'
	},
	{
		heading: 'III. Defuturing',
		headingJa: '/ 脱未来化',
		body: 'To keep making the unsustainable is not to make a future; it is to quietly rob the next generation of its choices — a condition called defuturing (Fry, 1999). A designer can give physical form to the metaphysical, intervening across a wide span of human life: lifestyles, material values, modes of consumption. The weight of that responsibility was already pointed out half a century ago (Papanek, 1971), and we ourselves are among those who, day by day, accelerate consumption and add to its burden. How things act upon the world, and what in turn shapes it — we know astonishingly little. That is exactly why we must keep learning, day after day. So that when each of us reaches the end of our path we might leave even a little to hand on to the next generation, we will not stop thinking, and will keep on learning.',
		bodyJa: '持続不可能なものを作り続けるという行為は、未来を作っているのではありません。それは、次の世代から選択肢を静かに奪っている——「脱未来化（defuturing）」と呼ばれる事態です (Fry, 1999)。デザイナーは、形而上のものを形而下へと具象化できる職能です。生活様式や物的価値、消費の様態といった、人間の営みの広い範囲に介入し得る。その責任の重さは、すでに半世紀前から指摘されてきました (Papanek, 1971)。そしてわたしたち自身が、日々、消費を加速させ、負荷を積み重ねている当事者でもあります。何がどのように世界に作用しているのか、そして何が世界を形作っているのか、驚くほどわたしたちは知りません。だからこそ、日々学びを重ね続けなければならないのだと思います。わたしたちがそれぞれのキャリアを終えるその時に、わずかでも次代に手渡せるものを残すために、日々思考を止めず、学びを続けてまいります。'
	}
];
