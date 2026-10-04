import type { SiteContent } from '@intently/ui/site';

// Copy for {{NAME}}'s site. Keep every claim to what the app actually does.
export const content: SiteContent = {
	headline: '{{TAGLINE}}',
	subhead: 'TODO: two sentences on who it is for and what changes for them.',
	features: [
		{ title: 'TODO', body: 'TODO' },
	],
	faq: [],
	legal: { privacy: {{HAS_PRIVACY}}, terms: {{HAS_TERMS}} },
};
