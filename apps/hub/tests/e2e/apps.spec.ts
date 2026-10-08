/**
 * The apps, shown where they live. On the home page the family is the day laid out from dawn to the
 * lantern hour, one strip of sky per chapter; on a chapter page each app stands in its own hour.
 */
import { test, expect } from '@playwright/test';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { collectErrors, expectNoHorizontalScroll, skipSplash } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the app family is the day in order: seven skies, each app under its own', async ({ page }) => {
	const errors = collectErrors(page);
	await page.goto('/');
	const hours = page.locator('.day > li');
	await expect(hours).toHaveCount(CHAPTERS.length);
	for (const [i, c] of CHAPTERS.entries()) {
		const hour = hours.nth(i);
		await hour.scrollIntoViewIfNeeded();
		await expect(hour).toHaveAttribute('data-sky', c.sky);
		await expect(hour.locator('.aspect')).toHaveAttribute('href', c.path);
		await expect(hour.locator('.aspect')).toContainText(c.clock);
		await expect(hour.locator('.aspect')).toContainText(c.name);
		await expect(hour.locator('.app')).toHaveCount(c.apps.length);
		for (const a of c.apps) {
			const link = hour.getByRole('link', { name: new RegExp(a.name) });
			await expect(link).toHaveAttribute('href', `https://${a.host}`);
			await expect(link).toContainText(a.tagline);
			// Out in a store: its platforms. Otherwise an honest status.
			await expect(link.locator('.status')).toHaveText(a.status === 'live' ? a.platforms.join(', ') : /soon|workshop/);
		}
		// Its strip of land is decoration.
		await expect(hour.locator('.land svg')).toHaveAttribute('aria-hidden', 'true');
	}
	// Dawn is at the top and the night at the bottom.
	const tops = await hours.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
	expect([...tops].sort((a, b) => a - b)).toEqual(tops);
	await expectNoHorizontalScroll(page);
	expect(errors).toEqual([]);
});

test.describe('the hour it is where the visitor is', () => {
	test.use({ timezoneId: 'Asia/Dhaka' });

	for (const [clock, sky] of [['2026-03-01T15:45:00+06:00', 'afternoon'], ['2026-03-01T06:00:00+06:00', 'dawn'], ['2026-03-01T03:10:00+06:00', 'lantern'], ['2026-03-01T23:50:00+06:00', 'lantern']]) {
		test(`at ${clock.slice(11, 16)} the ${sky} strip says so, and only that one`, async ({ page }) => {
			await page.clock.setFixedTime(new Date(clock));
			await page.goto('/');
			await expect(page.locator(`.day > li[data-sky="${sky}"] .now`)).toBeVisible();
			await expect(page.locator('.day .now:visible')).toHaveCount(1);
		});
	}
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the family still lists every app, and no strip claims to be now', async ({ page }) => {
		await page.goto('/');
		for (const c of CHAPTERS) for (const a of c.apps) await expect(page.locator('.day').getByRole('link', { name: new RegExp(a.name) })).toBeAttached();
		await expect(page.locator('.day .now:visible')).toHaveCount(0);
	});
});

for (const c of CHAPTERS) {
	test(`${c.id}: each app stands in its own hour`, async ({ page }) => {
		await page.goto(c.path);
		const cards = page.locator('.app-card');
		await expect(cards).toHaveCount(c.apps.length);
		for (const [i, a] of c.apps.entries()) {
			const card = cards.nth(i);
			await card.scrollIntoViewIfNeeded();
			await expect(card).toHaveAttribute('data-sky', c.sky);
			await expect(card.getByRole('heading', { level: 3, name: a.name })).toBeVisible();
			await expect(card.getByText(a.tagline)).toBeVisible();
			await expect(card.getByRole('link', { name: `Visit the ${a.name} site` })).toHaveAttribute('href', `https://${a.host}`);
			for (const h of a.highlights ?? []) await expect(card.getByText(h)).toBeVisible();
			// The icon stands on the land, inside the card, clear of the words.
			const icon = (await card.locator('.stand').boundingBox())!;
			const box = (await card.boundingBox())!;
			expect(icon.y + icon.height).toBeLessThanOrEqual(box.y + box.height);
			expect(icon.y).toBeGreaterThan(box.y + box.height - 116 - icon.height);
			const where = (await card.locator('.where').boundingBox())!;
			expect(where.y + where.height <= icon.y || where.x + where.width <= icon.x, 'words clear of the icon').toBe(true);
		}
		await expectNoHorizontalScroll(page);
	});
}
