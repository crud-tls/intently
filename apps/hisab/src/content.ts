import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'Your spending, logged for you.',
	subhead: 'Hisab will read the transaction messages your bank already sends and turn them into a clear picture of where your money goes, without typing every expense.',
	features: [
		{ title: 'Logged from SMS', body: 'Bank and mobile-wallet transaction messages become entries automatically.' },
		{ title: 'See where it goes', body: 'Spending by category and by month, at a glance.' },
		{ title: 'Your data, your phone', body: "We're designing Hisab to keep your financial data on your phone." },
	],
	faq: [
		{ q: 'When is Hisab coming?', a: "We're still building it. Tap \"Tell me when it's out\" and we'll email you." },
	],
	legal: { privacy: false, terms: false },
};
