/** Every page: loads, says what it is, has one h1, no errors, and never scrolls sideways. */
import { test, expect } from '@playwright/test';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { collectErrors, expectNoHorizontalScroll, skipSplash } from './helpers.ts';

const PAGES = ['/', ...CHAPTERS.map((c) => c.path), '/about/', '/contact/', '/legal/privacy/', '/legal/terms/'];

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const path of PAGES) {
	test(`page ${path}`, async ({ page }) => {
		const errors = collectErrors(page);
		const res = await page.goto(path);
		expect(res?.status()).toBe(200);
		await expect(page).toHaveTitle(/Intently/);
		const description = await page.locator('meta[name="description"]').getAttribute('content');
		expect(description?.length ?? 0).toBeGreaterThan(40);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://liveintently\\.app${path.replace(/\//g, '\\/')}$`));
		await expect(page.locator('h1')).toHaveCount(1);
		await expect(page.locator('h1')).toBeVisible();
		await expectNoHorizontalScroll(page);
		expect(errors).toEqual([]);
	});
}

test('titles and descriptions are unique', async ({ page }) => {
	const seen = new Map<string, string>();
	for (const path of PAGES) {
		await page.goto(path);
		const key = `${await page.title()}|${await page.locator('meta[name="description"]').getAttribute('content')}`;
		expect(seen.get(key), `${path} duplicates ${seen.get(key)}`).toBeUndefined();
		seen.set(key, path);
	}
});

test('the 404 page answers with 404 and a way back', async ({ page }) => {
	const res = await page.goto('/no-such-page');
	expect(res?.status()).toBe(404);
	await expect(page.getByRole('link', { name: /home page/i })).toBeVisible();
});

test('header and footer links lead somewhere real', async ({ page, request }) => {
	await page.goto('/time/');
	const hrefs = await page.locator('header a, footer a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
	for (const href of new Set(hrefs)) {
		if (!href.startsWith('/') || href.startsWith('/#')) continue;
		const res = await request.get(href);
		expect(res.status(), href).toBe(200);
	}
});
