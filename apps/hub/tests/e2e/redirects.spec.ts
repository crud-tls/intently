/** Old liveintently.app URLs (store listings, shipped apps) keep working; new pages are never shadowed. */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { CHAPTERS } from '../../src/data/chapters.ts';

test.beforeEach(({}, info) => {
	test.skip(info.project.name !== 'desktop-chrome', 'server behaviour: one browser is enough');
});

const legacy = readFileSync(new URL('../../../../docs/legacy-urls.txt', import.meta.url), 'utf8')
	.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(' ')[1]);

// Deliberately gone from the apex (tools/hub-redirects.mjs): it would make studio links open the Pawse app.
const DROPPED = new Set(['/.well-known/assetlinks.json']);
// Accepts POST only (the contact form); checked separately below.
const POST_ONLY = new Set(['/api/contact']);

test('every legacy URL answers 200 or redirects', async ({ request }) => {
	for (const path of legacy.filter((p) => !DROPPED.has(p) && !POST_ONLY.has(p))) {
		const res = await request.get(path, { maxRedirects: 0 });
		expect([200, 301, 307, 308], `${path} -> ${res.status()}`).toContain(res.status());
		if (res.status() === 301) expect(res.headers()['location'], path).toMatch(/pawse|loop|liveintently/);
	}
});

test('the contact endpoint answers its own form and refuses cross-site posts', async ({ request, baseURL }) => {
	const form = { name: '', email: 'not-an-email', message: '' };
	const ours = await request.post('/api/contact', { multipart: form, headers: { Origin: baseURL! } });
	expect(ours.status()).toBe(400);
	const body = await ours.json();
	expect(Object.keys(body.errors).sort()).toEqual(['email', 'message', 'name']);
	const theirs = await request.post('/api/contact', { multipart: form, headers: { Origin: 'https://example.com' } });
	expect(theirs.status()).toBe(403);
});

test('the apex no longer claims Pawse app links', async ({ request }) => {
	expect((await request.get('/.well-known/assetlinks.json', { maxRedirects: 0 })).status()).toBe(404);
});

test('store-listing paths still go to the apps', async ({ request }) => {
	for (const [path, to] of [['/privacy', /pawse.*\/privacy$/], ['/terms', /pawse.*\/terms$/], ['/delete-account', /pawse.*\/delete-account$/], ['/privacy-loop', /loop.*\/privacy$/]] as const) {
		const res = await request.get(path, { maxRedirects: 0 });
		expect(res.status(), path).toBe(301);
		expect(res.headers()['location']).toMatch(to);
	}
});

test('chapter pages and landscapes are served, not redirected', async ({ request }) => {
	for (const c of CHAPTERS) {
		const res = await request.get(c.path, { maxRedirects: 0 });
		expect(res.status(), c.path).toBe(200);
		for (const v of ['wide', 'tall']) {
			const svg = await request.get(`/world/${c.id}-${v}.svg`);
			expect(svg.status()).toBe(200);
			expect(svg.headers()['content-type']).toContain('image/svg+xml');
		}
	}
});

test('pages carry the policy that keeps what you type on the page', async ({ request }) => {
	for (const path of ['/', '/time/', '/wealth/', '/contact/']) {
		const res = await request.get(path);
		expect(res.headers()['content-security-policy'], path).toContain("connect-src 'self'");
	}
});
