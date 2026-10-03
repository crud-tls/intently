/** Chapter pages: the hour's landscape, the thought, questions, a practice, the app, the day around it. */
import { test, expect } from '@playwright/test';
import { CHAPTERS, neighbours } from '../../src/data/chapters.ts';
import { collectErrors, expectNoHorizontalScroll, skipSplash } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
});

for (const c of CHAPTERS) {
	test(`chapter ${c.id}`, async ({ page }) => {
		const errors = collectErrors(page);
		await page.goto(c.path);
		await expect(page.locator('html')).toHaveAttribute('data-sky', c.sky);
		await expect(page.getByRole('heading', { level: 1, name: c.title })).toBeVisible();
		await expect(page.locator('.hero .when')).toContainText(c.clock);

		const hero = page.locator('.hero .land img');
		await expect.poll(() => hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);

		const questions = page.locator('.reflection li');
		await expect(questions).toHaveCount(3);
		for (const q of c.reflection) await expect(page.getByText(q)).toBeAttached();
		await expect(page.getByRole('heading', { level: 2, name: c.practice.heading })).toBeAttached();
		for (const a of c.apps) await expect(page.getByRole('heading', { level: 3, name: a.name })).toBeAttached();

		const { prev, next } = neighbours(c.id);
		const nav = page.getByRole('navigation', { name: 'The rest of the day' });
		await expect(nav.locator('a').first()).toHaveAttribute('href', prev.path);
		await expect(nav.locator('a').last()).toHaveAttribute('href', next.path);

		const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
		expect(schema.some((s) => s.includes('"BreadcrumbList"'))).toBe(true);
		await expectNoHorizontalScroll(page);
		expect(errors).toEqual([]);
	});
}

test('the faith verse is marked up as Arabic, right to left, with its translation and source', async ({ page }) => {
	await page.goto('/faith/');
	const verse = page.locator('.verse .arabic');
	await expect(verse).toHaveAttribute('lang', 'ar');
	await expect(verse).toHaveAttribute('dir', 'rtl');
	await expect(page.locator('.verse footer')).toContainText('Saheeh International');
	await expect(page.locator('.verse footer')).toContainText('13:28');
});
