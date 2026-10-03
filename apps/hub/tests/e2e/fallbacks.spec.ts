/**
 * Without the live world, the day still reads: reduced motion, ?world=static, no WebGL2, and no
 * JavaScript at all each get the static landscapes and every word.
 */
import { test, expect, type Page } from '@playwright/test';
import { SCENES } from '../../src/world/scenes.ts';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { collectErrors, expectNoHorizontalScroll, isMobile, skipSplash } from './helpers.ts';

async function expectStaticDay(page: Page, tall: boolean) {
	await expect(page.locator('canvas.world')).toHaveCount(0);
	await expect(page.locator('html')).not.toHaveClass(/world-live/);
	for (const s of SCENES) {
		const scene = page.locator(`[data-scene="${s.id}"]`);
		await scene.scrollIntoViewIfNeeded();
		const img = scene.locator('.land img');
		await expect(img).toBeVisible();
		await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { message: `${s.id} landscape loads` }).toBe(true);
		const src = await img.evaluate((i: HTMLImageElement) => i.currentSrc);
		expect(src, `${s.id} picks the ${tall ? 'tall' : 'wide'} composition`).toMatch(tall ? /-tall\.svg$/ : /-wide\.svg$/);
		await expect(scene.locator('.words')).toHaveCSS('opacity', '1');
	}
}

test('reduced motion: the static day, every landscape and every word', async ({ page }, info) => {
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const errors = collectErrors(page);
	await page.goto('/');
	const tall = await page.evaluate(() => innerWidth / innerHeight <= 1);
	expect(tall, 'phones and portrait tablets get the tall compositions').toBe(isMobile(info));
	await expectStaticDay(page, tall);
	await expectNoHorizontalScroll(page);
	expect(errors).toEqual([]);
});

test('?world=static keeps the static day even when motion is fine', async ({ page }) => {
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/?world=static');
	await page.waitForTimeout(1500);
	await expectStaticDay(page, await page.evaluate(() => innerWidth / innerHeight <= 1));
});

test('without WebGL2 the page falls back quietly', async ({ page }) => {
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		const get = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
			if (type === 'webgl2') return null;
			return (get as (...a: unknown[]) => unknown).call(this, type, ...rest);
		} as typeof get;
	});
	const errors = collectErrors(page);
	await page.goto('/');
	await page.waitForTimeout(1500);
	await expectStaticDay(page, await page.evaluate(() => innerWidth / innerHeight <= 1));
	expect(errors).toEqual([]);
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the home page still tells the whole day', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: 'Most days just happen.' })).toBeVisible();
		for (const c of CHAPTERS) await expect(page.getByRole('heading', { level: 2, name: c.title })).toBeAttached();
		await expect(page.locator('[data-scene="prologue"] .land img')).toBeVisible();
		await expect(page.locator('.splash')).toBeHidden();
		await expectNoHorizontalScroll(page);
	});

	test('chapter pages show their worked examples', async ({ page }) => {
		for (const c of CHAPTERS) {
			await page.goto(c.path);
			await expect(page.getByRole('heading', { level: 1, name: c.title })).toBeVisible();
			await expect(page.locator('.feel figcaption').first()).toHaveText(c.feel.example);
			for (const el of await page.locator('.needs-js').all()) await expect(el).toBeHidden();
		}
	});
});
