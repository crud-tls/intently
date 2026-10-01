// Checks that every legacy liveintently.app URL still ends somewhere real.
// For each path in docs/legacy-urls.txt it requests HUB + path, follows redirects (rewriting
// production hosts to preview hosts when given), and reports anything that doesn't end in a 200.
//   node tools/verify-urls.mjs                       # production: https://liveintently.app
//   node tools/verify-urls.mjs --preview             # workers.dev previews before cutover
import { readFileSync } from 'node:fs';

const preview = process.argv.includes('--preview');
const HOSTS = preview
	? {
		'liveintently.app': 'intently-hub.fsadakathussain.workers.dev',
		'pawse.liveintently.app': 'pawse-site.fsadakathussain.workers.dev',
		'loop.liveintently.app': 'loop-site.fsadakathussain.workers.dev',
	}
	: {};
// Not served any more on purpose (see tools/hub-redirects.mjs).
const GONE = new Set(['/.well-known/assetlinks.json', '/api/contact']);

const swap = (url) => {
	const u = new URL(url);
	if (HOSTS[u.host]) u.host = HOSTS[u.host];
	return u.toString();
};

const paths = readFileSync(new URL('../docs/legacy-urls.txt', import.meta.url), 'utf8')
	.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(' ')[1]);

let failures = 0;
for (const path of paths) {
	let url = swap(`https://liveintently.app${path}`);
	const hops = [];
	let res;
	for (let i = 0; i < 6; i++) {
		res = await fetch(url, { redirect: 'manual' });
		if (res.status < 300 || res.status >= 400) break;
		url = swap(new URL(res.headers.get('location'), url).toString());
		hops.push(url);
	}
	const ok = GONE.has(path) ? res.status === 404 : res.status === 200;
	if (!ok) {
		failures++;
		console.log(`FAIL ${res.status} ${path} -> ${hops.join(' -> ') || '(no redirect)'}`);
	}
}
console.log(`${paths.length - failures}/${paths.length} legacy URLs OK${preview ? ' (preview hosts)' : ''}`);
process.exit(failures ? 1 : 0);
