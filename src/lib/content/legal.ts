// Legal / Company / Cookies copy (drafted 2026-11-24). Static, bilingual:
// each page is a title, an optional lead, and sections of paragraphs.
// Only facts the site itself establishes are stated (what the contact form
// sends, which services load, what is stored). The operator's legal-entity
// details (registered name, address) are NOT here — add them to COMPANY
// below once confirmed. (Operator details added 2026-11-24.)

import { INSTAGRAM } from '$lib/js/site';

export type Bilingual = { en: string; ja: string };
export type LegalSection = { title: Bilingual; paragraphs: Bilingual[] };
export type LegalDoc = {
	title: Bilingual;
	description: string;
	updated: string;
	sections: LegalSection[];
};

const UPDATED = '2026-11-24';

export const LEGAL: LegalDoc = {
	title: { en: 'Legal', ja: '法的事項' },
	description: 'II — Isobe Institute: privacy policy and terms of use.',
	updated: UPDATED,
	sections: [
		{
			title: { en: 'Privacy Policy', ja: 'プライバシーポリシー' },
			paragraphs: [
				{
					en: 'Mirai Service Co., Ltd. ("we"), which operates Isobe Institute ("II"), respects your privacy and handles personal information in accordance with the Act on the Protection of Personal Information of Japan.',
					ja: '株式会社みらいサービス（以下「当社」）は、Isobe Institute（以下「II」）の運営にあたり、個人情報の保護に関する法律（個人情報保護法）に従い、お預かりする個人情報を適切に取り扱います。'
				}
			]
		},
		{
			title: { en: 'Information we collect', ja: '取得する情報' },
			paragraphs: [
				{
					en: 'Through the contact form: the type of inquiry, your name, company (optional), email address, phone number (optional) and your message. We collect nothing else from you directly, and the site has no accounts, no purchases and no analytics or advertising trackers.',
					ja: 'お問い合わせフォームから、お問い合わせの種別、お名前、会社名（任意）、メールアドレス、電話番号（任意）、メッセージ内容を取得します。それ以外の情報を直接取得することはありません。本サイトにはアカウント登録・購入機能はなく、アクセス解析や広告のトラッキングも使用していません。'
				},
				{
					en: 'Like any website, the servers that deliver this site (Cloudflare) process technical data such as IP address, browser type and the pages requested, for delivery and security.',
					ja: '本サイトを配信するサーバー（Cloudflare）は、配信およびセキュリティのため、IPアドレス、ブラウザの種類、閲覧ページなどの技術的な情報を処理します。'
				}
			]
		},
		{
			title: { en: 'How we use it', ja: '利用目的' },
			paragraphs: [
				{
					en: 'Only to read and reply to your inquiry, and to discuss and carry out the work you ask about. We do not sell your information or use it for marketing without your consent.',
					ja: 'お問い合わせの確認・ご返信、およびご相談いただいた業務の検討・遂行のためにのみ利用します。ご本人の同意なく、販売やマーケティング目的で利用することはありません。'
				}
			]
		},
		{
			title: { en: 'Sharing and processors', ja: '第三者提供・委託先' },
			paragraphs: [
				{
					en: 'We do not provide personal information to third parties, except where required by law. The contact form is delivered by email through Resend, and the site is hosted on Cloudflare; these services handle data only to provide their service to us, and may do so outside Japan.',
					ja: '法令に基づく場合を除き、個人情報を第三者に提供しません。お問い合わせフォームはResendを通じてメールで送信され、サイトはCloudflare上でホストされています。これらのサービスは当方へのサービス提供の範囲でのみ情報を取り扱い、日本国外で処理する場合があります。'
				}
			]
		},
		{
			title: { en: 'Retention and your rights', ja: '保管期間・開示等のご請求' },
			paragraphs: [
				{
					en: 'Inquiries are kept for as long as needed to respond and to follow up on the work, then deleted. You may ask us to disclose, correct or delete your information at any time through the contact form (the contact point for this site is Mirai Service Co., Ltd.).',
					ja: 'お問い合わせ内容は、ご返信および業務の対応に必要な期間保管し、その後削除します。保有する情報の開示・訂正・削除は、お問い合わせフォームからいつでもご請求いただけます（本サイトの窓口は株式会社みらいサービスです）。'
				}
			]
		},
		{
			title: { en: 'Terms of use', ja: 'ご利用にあたって' },
			paragraphs: [
				{
					en: 'All works, images, text, typefaces and other content on this site belong to II or the respective rights holders. Reproducing, redistributing or using them without prior permission is not allowed, except as permitted by law.',
					ja: '本サイトに掲載されている作品、画像、テキスト、書体その他のコンテンツの権利は、IIまたはそれぞれの権利者に帰属します。法令で認められる場合を除き、事前の許可なく複製・転載・利用することはできません。'
				},
				{
					en: 'We take care to keep the content accurate, but do not guarantee it, and may change or remove it without notice. Mirai Service Co., Ltd. and II are not liable for any loss arising from use of this site. Links to external sites are provided for convenience; their content is the responsibility of their operators.',
					ja: '掲載内容の正確性には注意を払っていますが、保証するものではなく、予告なく変更・削除する場合があります。本サイトのご利用により生じた損害について、当社およびIIは責任を負いません。外部サイトへのリンク先の内容は、各運営者の責任となります。'
				},
				{
					en: 'These terms are governed by the laws of Japan.',
					ja: '本規約は日本法に準拠します。'
				}
			]
		},
		{
			title: { en: 'Changes', ja: '改定' },
			paragraphs: [
				{
					en: `We may update this policy from time to time; the latest version is always on this page. Last updated: ${UPDATED}.`,
					ja: `本ポリシーは必要に応じて改定することがあり、最新版は常にこのページに掲載します。最終更新日：${UPDATED}。`
				}
			]
		}
	]
};

/** The operator's details — fill in `registeredName` / `address` once
    confirmed; rows without a value are not shown. */
export const COMPANY_FACTS: { label: Bilingual; value: Bilingual }[] = [
	{ label: { en: 'Name', ja: '名称' }, value: { en: 'Isobe Institute (II)', ja: 'Isobe Institute（II）' } },
	{
		label: { en: 'Operator', ja: '運営会社' },
		value: { en: 'Mirai Service Co., Ltd.', ja: '株式会社みらいサービス' }
	},
	{
		label: { en: 'Representative', ja: '代表者' },
		value: { en: 'Satoru Isobe', ja: '磯部悟' }
	},
	{
		label: { en: 'Address', ja: '所在地' },
		value: {
			en: '1-16 Hinokuchi-cho, Nishi-ku, Nagoya, Aichi 451-0034, Japan',
			ja: '〒451-0034 愛知県名古屋市西区樋の口町1番16号'
		}
	},
	{
		label: { en: 'Business', ja: '事業内容' },
		value: {
			en: 'Creative direction and design — brand and visual identity, web and digital, typefaces, product and furniture.',
			ja: 'クリエイティブディレクション・デザイン — ブランド／ビジュアルアイデンティティ、ウェブ・デジタル、書体、プロダクト・家具。'
		}
	},
	{ label: { en: 'Studio', ja: '拠点' }, value: { en: 'Tokyo, Japan', ja: '東京' } },
	{
		label: { en: 'Capital', ja: '資本金' },
		value: { en: 'JPY 10,000,000', ja: '1,000万円' }
	},
	{
		label: { en: 'Contact', ja: 'お問い合わせ' },
		value: { en: 'Via the contact form (/contact)', ja: 'お問い合わせフォーム（/contact）より' }
	},
	{
		label: { en: 'Instagram', ja: 'Instagram' },
		value: { en: INSTAGRAM.handle, ja: INSTAGRAM.handle }
	}
];

export const COMPANY: LegalDoc = {
	title: { en: 'Company', ja: '運営情報' },
	description: 'II — Isobe Institute: about the operator of this site.',
	updated: UPDATED,
	sections: []
};

export const COOKIES: LegalDoc = {
	title: { en: 'Cookies', ja: 'Cookieについて' },
	description: 'II — Isobe Institute: how this site uses cookies and browser storage.',
	updated: UPDATED,
	sections: [
		{
			title: { en: 'What this site sets', ja: '本サイトが設定するもの' },
			paragraphs: [
				{
					en: 'II sets no cookies of its own, and uses no analytics or advertising cookies. The only thing stored is your chosen display language (EN / JA), kept in your browser\'s session storage for the current tab; it is cleared when you close the tab and is never sent to us.',
					ja: 'IIは独自のCookieを設定せず、アクセス解析や広告のCookieも使用していません。保存されるのは表示言語（EN / JA）の選択のみで、現在のタブのセッションストレージに保持され、タブを閉じると消去されます。当方に送信されることはありません。'
				}
			]
		},
		{
			title: { en: 'Third-party services', ja: '外部サービス' },
			paragraphs: [
				{
					en: 'Japanese web fonts are delivered by FontPlus and TypeSquare, and the site is delivered through Cloudflare. These services may use cookies or similar technologies of their own, for font delivery and security, under their own policies.',
					ja: '日本語ウェブフォントはFontPlusおよびTypeSquareから、サイトはCloudflareを通じて配信されています。これらのサービスは、フォント配信やセキュリティのために、各社のポリシーに基づきCookieまたは類似の技術を使用する場合があります。'
				}
			]
		},
		{
			title: { en: 'Your choice', ja: 'ブラウザでの設定' },
			paragraphs: [
				{
					en: 'You can block or delete cookies and site storage in your browser settings; the site works without them, apart from the language choice not being remembered.',
					ja: 'Cookieやサイトデータは、ブラウザの設定でブロック・削除できます。無効にしても、表示言語の選択が保持されない以外、サイトは問題なく動作します。'
				}
			]
		}
	]
};
