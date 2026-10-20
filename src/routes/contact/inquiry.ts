// The kinds of inquiry the contact form offers (shared by the page and its
// server action).
export const INQUIRY_TYPES = [
	{ value: 'works', en: 'Works', ja: '制作のご依頼' },
	{ value: 'type', en: 'Type', ja: '書体について' },
	{ value: 'other', en: 'Other', ja: 'その他' }
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]['value'];
