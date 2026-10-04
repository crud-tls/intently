/** How the hub talks about an app's availability and where to get it. */
import type { App } from '@intently/registry';

/** A short, true status line, or null when the app is out and its store buttons say enough. */
export function statusLabel(app: App): string | null {
	if (app.status === 'live') return null;
	if (app.status === 'soon') return 'In the workshop';
	return app.platforms.includes('Android') ? 'On Google Play soon' : 'On the App Store soon';
}

export function stores(app: App): { label: string; href: string }[] {
	const out: { label: string; href: string }[] = [];
	if (app.stores.play) out.push({ label: 'Get it on Google Play', href: app.stores.play });
	if (app.stores.appStore) out.push({ label: 'Download on the App Store', href: app.stores.appStore });
	if (app.stores.chrome) out.push({ label: 'Add to Chrome', href: app.stores.chrome });
	return out;
}

export const siteUrl = (app: App) => `https://${app.host}`;

/** "Pawse", "Pawse and Respite", "A, B and C". */
export function names(apps: App[]): string {
	const n = apps.map((a) => a.name);
	return n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
}
