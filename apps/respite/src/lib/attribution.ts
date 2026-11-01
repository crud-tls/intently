// Store-link attribution for the Respite site. Runs in the browser on every page.
//
// 1. Inbound: the first utm_* set a visitor arrives with is kept for the session (sessionStorage),
//    so a visitor from a Reddit post who reads two posts and then installs is still credited to Reddit.
// 2. Outbound: every link to the App Store, Google Play or the Chrome Web Store gets that store's
//    own campaign parameters, so the store consoles show which source, page and button sent the install:
//      - Google Play  → &referrer=utm_source%3D…  (Play Console › Acquisition)
//      - Chrome Store → ?utm_source=…            (Developer Dashboard › Analytics › Acquisition)
//      - App Store    → ?pt=<provider>&ct=…      (App Store Connect › App Analytics › Campaigns)
//        Only when APPLE_PROVIDER_TOKEN is set; without it the App Store link is left as is.
// 3. Each store click is sent to Ahrefs Web Analytics as a custom event `store_click`.
//
// The naming scheme is in docs/utm.md at the repo root. Keep the two in step.

/** App Store Connect provider token ("pt"). App Analytics › Campaigns › Generate a campaign link. */
export const APPLE_PROVIDER_TOKEN = '';

const SITE_SOURCE = 'respite_site';
const KEY = 'respite_utm';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
type Utm = Partial<Record<(typeof UTM)[number], string>>;

const STORES: Array<{ id: string; match: (u: URL) => boolean }> = [
	{ id: 'app_store', match: (u) => u.hostname === 'apps.apple.com' },
	{ id: 'google_play', match: (u) => u.hostname === 'play.google.com' && u.pathname.startsWith('/store/apps') },
	{ id: 'chrome_web_store', match: (u) => u.hostname === 'chromewebstore.google.com' || u.hostname === 'chrome.google.com' },
];

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

function inbound(): Utm {
	const params = new URLSearchParams(location.search);
	const fresh: Utm = {};
	for (const k of UTM) { const v = params.get(k); if (v) fresh[k] = clean(v); }
	try {
		if (fresh.utm_source) { sessionStorage.setItem(KEY, JSON.stringify(fresh)); return fresh; }
		const kept = sessionStorage.getItem(KEY);
		if (kept) return JSON.parse(kept);
	} catch { /* storage blocked: fall through */ }
	if (fresh.utm_source) return fresh;
	// No tags: name the referring site, if any, so organic search and links still show up.
	try {
		const ref = document.referrer && new URL(document.referrer).hostname.replace(/^www\./, '');
		if (ref && ref !== location.hostname) {
			const search = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|yandex)\./.test(ref + '.');
			return { utm_source: clean(ref.split('.').slice(-2, -1)[0] || ref), utm_medium: search ? 'organic' : 'referral' };
		}
	} catch { /* bad referrer */ }
	return {};
}

/** blog, home, features, download, compare, tools, legal… and the page slug. */
function page(): { section: string; slug: string } {
	const parts = location.pathname.split('/').filter(Boolean);
	if (!parts.length) return { section: 'home', slug: 'home' };
	const tools = ['quiz', 'screen-time-calculator', 'app-addiction-score'];
	const legal = ['privacy', 'terms', 'delete-account'];
	const section = parts[0] === 'blog' ? 'blog' : tools.includes(parts[0]) ? 'tools' : legal.includes(parts[0]) ? 'legal' : clean(parts[0]);
	return { section, slug: clean(parts.at(-1)!) };
}

/** Where on the page the link sits: an explicit data-placement wins, then the landmark around it. */
function placement(a: HTMLAnchorElement): string {
	const explicit = a.closest<HTMLElement>('[data-placement]')?.dataset.placement;
	if (explicit) return clean(explicit);
	if (a.closest('header, nav')) return 'nav';
	if (a.closest('footer')) return 'footer';
	if (a.closest('.hero, .article-hero, [class*="hero"]')) return 'hero';
	if (a.closest('aside')) return 'sidebar';
	if (a.closest('article, .article-body')) return 'article';
	return 'body';
}

function tag(a: HTMLAnchorElement, store: string, src: Utm, pg: ReturnType<typeof page>) {
	const url = new URL(a.href);
	const where = placement(a);
	const utm = {
		utm_source: src.utm_source || SITE_SOURCE,
		utm_medium: src.utm_medium || 'web',
		// The visitor's own campaign wins; otherwise the site section that sent them.
		utm_campaign: src.utm_campaign || pg.section,
		utm_content: `${pg.slug}__${where}`,
	};
	if (store === 'google_play') {
		url.searchParams.set('referrer', new URLSearchParams(utm).toString());
	} else if (store === 'chrome_web_store') {
		for (const [k, v] of Object.entries(utm)) url.searchParams.set(k, v);
	} else if (store === 'app_store') {
		if (!APPLE_PROVIDER_TOKEN) return { where, utm };
		url.searchParams.set('pt', APPLE_PROVIDER_TOKEN);
		// Apple allows 40 characters; source first so it survives the cut.
		url.searchParams.set('ct', `${utm.utm_source}.${pg.slug}`.slice(0, 40));
		url.searchParams.set('mt', '8');
	}
	a.href = url.href;
	return { where, utm };
}

export function initAttribution() {
	const src = inbound();
	const pg = page();
	for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')) {
		let url: URL;
		try { url = new URL(a.href); } catch { continue; }
		const store = STORES.find((s) => s.match(url))?.id;
		if (!store || a.dataset.attributed) continue;
		const { where, utm } = tag(a, store, src, pg);
		a.dataset.attributed = '1';
		const send = () => {
			const w = window as unknown as { AhrefsAnalytics?: { sendEvent: (n: string, o?: object) => void } };
			w.AhrefsAnalytics?.sendEvent('store_click', {
				props: { store, page: pg.slug, section: pg.section, placement: where, source: utm.utm_source, medium: utm.utm_medium },
			});
		};
		a.addEventListener('click', send);
		a.addEventListener('auxclick', send);
	}
}
