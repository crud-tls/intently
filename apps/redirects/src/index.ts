/**
 * Hostnames that only redirect: www to the apex, old experiment subdomains, and former app
 * names (the registry's aliases). Each keeps the path and query.
 */
import { APPS, STUDIO } from '@intently/registry';

const TARGETS: Record<string, string> = {
	[`www.${STUDIO.host}`]: STUDIO.host,
	// Experiments that mirrored the old single site; nothing of theirs is worth keeping.
	[`health.${STUDIO.host}`]: STUDIO.host,
	[`finances.${STUDIO.host}`]: STUDIO.host,
};
for (const app of APPS) for (const alias of app.aliases ?? []) TARGETS[alias] = app.host;

export const HOSTS = Object.keys(TARGETS);

export default {
	fetch(request: Request): Response {
		const url = new URL(request.url);
		const target = TARGETS[url.hostname];
		if (!target) return new Response('Not found', { status: 404 });
		// Moving a whole host to the hub root is cleaner than keeping paths that never meant anything there.
		const keepPath = target !== STUDIO.host || url.hostname === `www.${STUDIO.host}`;
		return Response.redirect(`https://${target}${keepPath ? url.pathname + url.search : '/'}`, 301);
	},
};
