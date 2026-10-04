import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'One question a day, for the two of you.',
	subhead: "TwoHearts is a small app for couples and close pairs: each day you both answer the same question, then reveal your answers together.",
	features: [
		{ title: 'Pair up', body: 'Connect with your partner, best friend or anyone you want to know better.' },
		{ title: 'A daily question', body: 'One thoughtful question each day, some light, some deep.' },
		{ title: 'Reveal together', body: "Answers stay hidden until you've both answered, so neither of you can peek." },
	],
	faq: [
		{ q: 'When is TwoHearts coming?', a: "We're still building it. Tap \"Tell me when it's out\" and we'll email you." },
	],
	legal: { privacy: false, terms: false },
};
