/** What each app site provides in its own src/content.ts; everything else comes from the registry. */
export interface Feature {
	title: string;
	body: string;
}

export interface Faq {
	q: string;
	a: string;
}

export interface SiteContent {
	headline: string;
	subhead: string;
	features: Feature[];
	faq: Faq[];
	/** Which legal pages this app has (each needs a policy in @intently/legal). */
	legal: { privacy: boolean; terms: boolean };
	/** How to delete an account and its data, for apps with accounts (Play requires a web page). */
	accountDeletion?: { inApp: string; byEmail: string; whatIsDeleted: string[] };
}

/** White or near-black, whichever reads better on the given brand colour (WCAG contrast). */
export function onColor(hex: string): string {
	const channel = (i: number) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	const lum = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
	return 1.05 / (lum + 0.05) >= 4.5 ? '#ffffff' : '#1d1b18';
}
