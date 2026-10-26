import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { HOSTS, PATH_MAPS, redirectTarget } from './index.ts';

const go = (url: string) => redirectTarget(new URL(url));

test('former app names redirect to the app site, keeping path and query', () => {
	assert.equal(go('https://infocus.liveintently.app/blog/x?a=1'), 'https://respite.liveintently.app/blog/x?a=1');
	assert.equal(go('https://qit.liveintently.app/privacy'), 'https://qandeel.liveintently.app/privacy');
	assert.equal(go('https://pawse.liveintently.app/'), 'https://respite.liveintently.app/');
});

test('pawse: privacy and terms land on the Android pages, with or without a trailing slash', () => {
	assert.equal(go('https://pawse.liveintently.app/privacy'), 'https://respite.liveintently.app/privacy/android');
	assert.equal(go('https://pawse.liveintently.app/privacy/'), 'https://respite.liveintently.app/privacy/android');
	assert.equal(go('https://pawse.liveintently.app/terms'), 'https://respite.liveintently.app/terms/android');
	assert.equal(go('https://pawse.liveintently.app/terms/'), 'https://respite.liveintently.app/terms/android');
});

test('pawse: the query string survives a mapped path', () => {
	assert.equal(go('https://pawse.liveintently.app/privacy?utm=play'), 'https://respite.liveintently.app/privacy/android?utm=play');
	assert.equal(go('https://pawse.liveintently.app/terms/?a=1&b=2'), 'https://respite.liveintently.app/terms/android?a=1&b=2');
});

test('pawse: every other path keeps its path, including /privacy/chrome', () => {
	for (const path of ['/privacy/chrome', '/delete-account', '/delete-account/confirm', '/blog/pawse-vs-opal', '/.well-known/assetlinks.json', '/rss.xml', '/privacy/ios', '/privacy-chrome']) {
		assert.equal(go(`https://pawse.liveintently.app${path}?t=1`), `https://respite.liveintently.app${path}?t=1`, path);
	}
});

test('path maps apply only to the alias they belong to', () => {
	assert.deepEqual(Object.keys(PATH_MAPS), ['pawse.liveintently.app']);
	assert.equal(go('https://infocus.liveintently.app/privacy'), 'https://respite.liveintently.app/privacy');
	assert.equal(go('https://qit.liveintently.app/terms'), 'https://qandeel.liveintently.app/terms');
});

test('the studio hosts keep their rules', () => {
	assert.equal(go('https://www.liveintently.app/about?x=1'), 'https://liveintently.app/about?x=1');
	assert.equal(go('https://health.liveintently.app/anything'), 'https://liveintently.app/');
	assert.equal(go('https://finances.liveintently.app/a/b?c=d'), 'https://liveintently.app/');
});

test('unknown hosts are not ours', () => {
	assert.equal(go('https://example.com/'), null);
});

test('the worker answers 301 with a Location, and 404 for unknown hosts', () => {
	const res = worker.fetch(new Request('https://pawse.liveintently.app/terms/?q=1'));
	assert.equal(res.status, 301);
	assert.equal(res.headers.get('location'), 'https://respite.liveintently.app/terms/android?q=1');
	assert.equal(worker.fetch(new Request('https://example.com/')).status, 404);
});

test('every alias in the registry is a redirect host with a route in wrangler.json', async () => {
	const { readFileSync } = await import('node:fs');
	const routes = JSON.parse(readFileSync(new URL('../wrangler.json', import.meta.url), 'utf8')).routes.map((r: { pattern: string }) => r.pattern);
	assert.deepEqual([...HOSTS].sort(), [...routes].sort());
});
