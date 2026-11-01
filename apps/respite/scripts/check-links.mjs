// After `astro build`: every internal page link in dist must point at the URL the site serves
// (/page/), not one Cloudflare answers with a 307 to the slashed form. Temporary hops on every
// internal link waste crawl budget and blur which URL Google should rank.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const html = walk(dist).filter((f) => f.endsWith('.html') && !f.includes('_worker.js'));
const bad = new Map();
for (const file of html) {
	for (const [, raw] of readFileSync(file, 'utf8').matchAll(/href="([^"]+)"/g)) {
		let url;
		try { url = new URL(raw.replace(/&amp;/g, '&'), 'https://respite.liveintently.app/'); } catch { continue; }
		if (url.host !== 'respite.liveintently.app') continue;
		const p = url.pathname;
		if (p.startsWith('/api/') || p.startsWith('/_') || /\.[a-z0-9]+$/i.test(p)) continue;
		if (p.endsWith('/') ? existsSync(join(dist, p, 'index.html')) || p === '/' : false) continue;
		const where = file.replace(dist, '/');
		bad.set(p, (bad.get(p) ?? new Set()).add(where));
	}
}
if (bad.size) {
	for (const [p, from] of bad) console.error(`${p}  (linked from ${from.size} pages, e.g. ${[...from][0]})`);
	console.error(`\n${bad.size} internal links point at a URL that redirects or does not exist. Use the /page/ form.`);
	process.exit(1);
}
console.log(`check-links: ${html.length} pages, every internal page link is a direct 200.`);
