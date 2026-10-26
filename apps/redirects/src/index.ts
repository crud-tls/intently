/**
 * Hostnames that only redirect: www to the apex, old experiment subdomains, and former app
 * names (the registry's aliases). Each keeps the path and query, except where an alias has a
 * path map: pawse.liveintently.app was the Android and Chrome app, so its policy and terms
 * land on Respite's Android pages, not the iPhone ones that live at /privacy and /terms.
 */
import { APPS, STUDIO } from '@intently/registry';

const TARGETS: Record<string, string> = {
	[`www.${STUDIO.host}`]: STUDIO.host,
	// Experiments that mirrored the old single site; nothing of theirs is worth keeping.
	[`health.${STUDIO.host}`]: STUDIO.host,
	[`finances.${STUDIO.host}`]: STUDIO.host,
};
for (const app of APPS) for (const alias of app.aliases ?? []) TARGETS[alias] = app.host;

/** Per-alias exceptions: old path (no trailing slash) to the path it moved to on the target host. */
export const PATH_MAPS: Record<string, Record<string, string>> = {
	'pawse.liveintently.app': {
		'/privacy': '/privacy/android',
		'/terms': '/terms/android',
	},
};

export const HOSTS = Object.keys(TARGETS);

/** The permanent-redirect target for a request URL, or null when the host is not one of ours. */
export function redirectTarget(url: URL): string | null {
	const target = TARGETS[url.hostname];
	if (!target) return null;
	// Moving a whole host to the hub root is cleaner than keeping paths that never meant anything there.
	const keepPath = target !== STUDIO.host || url.hostname === `www.${STUDIO.host}`;
	if (!keepPath) return `https://${target}/`;
	const key = url.pathname.replace(/\/+$/, '') || '/';
	const path = PATH_MAPS[url.hostname]?.[key] ?? url.pathname;
	return `https://${target}${path}${url.search}`;
}

export default {
	fetch(request: Request): Response {
		const to = redirectTarget(new URL(request.url));
		return to ? Response.redirect(to, 301) : new Response('Not found', { status: 404 });
	},
};
