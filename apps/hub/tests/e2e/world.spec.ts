/**
 * The live world on the home page: it starts, follows the scroll through the whole day, and keeps
 * working when the visitor scrolls back up (a regression: the frame budget used to swap it out for
 * the static landscapes mid-journey). Runs on every device project.
 */
import { test, expect } from '@playwright/test';
import { SCENES } from '../../src/world/scenes.ts';
import { SKY } from '../../src/data/sky.ts';
import { collectErrors, gesture, isChromium, scrollToScene, skipSplash, waitForWorld, world, wordsOpacity } from './helpers.ts';

test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
});

test('the live world starts, or the static landscapes stand in cleanly', async ({ page }, info) => {
	const errors = collectErrors(page);
	await page.goto('/');
	const live = await waitForWorld(page);
	if (isChromium(info)) expect(live, 'Chromium has WebGL2: the world should run').toBe(true);
	if (live) {
		await expect(page.locator('html')).toHaveClass(/world-live/);
		await expect(page.locator('canvas.world')).toHaveCount(1);
		// The still landscapes step aside (and further ones are never fetched).
		await expect(page.locator('[data-scene="time"] .land')).toBeHidden();
	} else {
		await expect(page.locator('canvas.world')).toHaveCount(0);
		await expect(page.locator('[data-scene="prologue"] .land img')).toBeVisible();
	}
	expect(errors).toEqual([]);
});

test('walks through the whole day and back, with the right light and words at every hour', async ({ page }) => {
	test.setTimeout(120_000);
	const errors = collectErrors(page);
	await page.goto('/');
	test.skip(!(await waitForWorld(page)), 'no WebGL2 in this browser');

	const visit = async (i: number) => {
		await scrollToScene(page, i);
		await expect.poll(async () => (await world(page))?.scene, { message: `scene ${SCENES[i].id}` }).toBe(SCENES[i].id);
		await expect.poll(async () => (await world(page))?.zenith, { message: `light at ${SCENES[i].id}` }).toBe(SKY[SCENES[i].sky].zenith);
		await expect.poll(() => wordsOpacity(page, i), { message: `words of ${SCENES[i].id}` }).toBeGreaterThan(0.9);
		const heading = page.locator(`[data-scene="${SCENES[i].id}"] .words :is(h1, h2)`).first();
		const box = (await heading.boundingBox())!;
		expect(box.y, 'heading on screen').toBeGreaterThanOrEqual(0);
		expect(box.y, 'heading in the upper half').toBeLessThan(page.viewportSize()!.height / 2);
		for (const j of [i - 1, i + 1]) {
			if (j >= 0 && j < SCENES.length) expect(await wordsOpacity(page, j), `neighbour ${SCENES[j].id} hidden`).toBeLessThan(0.1);
		}
	};

	for (let i = 0; i < SCENES.length; i++) await visit(i);
	for (let i = SCENES.length - 1; i >= 0; i--) await visit(i);

	await expect(page.locator('html')).toHaveClass(/world-live/);
	const before = (await world(page))!.frames;
	await page.mouse.move(10, 10);
	await expect.poll(async () => (await world(page))!.frames, { message: 'still drawing at the top' }).toBeGreaterThan(before);
	expect(errors).toEqual([]);
});

test('real scrolling to the end and back up keeps the world alive (wheel, or touch on phones)', async ({ page }, info) => {
	test.setTimeout(120_000);
	const errors = collectErrors(page);
	await page.goto('/');
	test.skip(!(await waitForWorld(page)), 'no WebGL2 in this browser');

	const height = await page.evaluate(() => document.documentElement.scrollHeight);
	for (let y = 0; y < height; y += 900) {
		await gesture(page, info, 900);
		await page.waitForTimeout(80);
	}
	await expect.poll(() => page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4), { timeout: 15_000 }).toBe(true);
	await expect.poll(async () => (await world(page))!.resting, { message: 'rests under the app list' }).toBe(true);

	for (let y = height; y > 0; y -= 900) {
		await gesture(page, info, -900);
		await page.waitForTimeout(80);
	}
	await expect.poll(() => page.evaluate(() => scrollY), { timeout: 15_000 }).toBeLessThan(10);
	await expect.poll(async () => (await world(page))?.scene).toBe('prologue');
	await expect(page.locator('html')).toHaveClass(/world-live/);
	await expect(page.locator('canvas.world')).toHaveCount(1);
	await expect.poll(() => wordsOpacity(page, 0)).toBeGreaterThan(0.9);
	const before = (await world(page))!.frames;
	await expect.poll(async () => (await world(page))!.frames).toBeGreaterThan(before);
	expect(errors).toEqual([]);
});

test('"Start at dawn" goes to the first chapter', async ({ page }) => {
	await page.goto('/');
	await waitForWorld(page);
	await page.getByRole('link', { name: 'Start at dawn' }).click();
	await expect(page.locator('#time-title')).toBeInViewport();
});

test('turning a phone or resizing the window keeps the world drawing', async ({ page }) => {
	const errors = collectErrors(page);
	await page.goto('/');
	test.skip(!(await waitForWorld(page)), 'no WebGL2 in this browser');
	const vp = page.viewportSize()!;
	await page.setViewportSize({ width: vp.height, height: vp.width });
	await scrollToScene(page, 3);
	await expect.poll(async () => (await world(page))?.scene).toBe('health');
	await page.setViewportSize(vp);
	await scrollToScene(page, 6);
	await expect.poll(async () => (await world(page))?.scene).toBe('self');
	const before = (await world(page))!.frames;
	await expect.poll(async () => (await world(page))!.frames).toBeGreaterThan(before);
	await expect(page.locator('html')).toHaveClass(/world-live/);
	expect(errors).toEqual([]);
});

test('the day rail marks the current hour and travels to it', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop-chrome' && info.project.name !== 'desktop-safari', 'the rail shows on wide screens');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	test.skip(!(await waitForWorld(page)), 'no WebGL2 in this browser');
	await scrollToScene(page, 4);
	await expect(page.locator('[data-rail="wealth"]')).toHaveAttribute('aria-current', 'step');
	await page.locator('[data-rail="faith"]').click();
	await expect.poll(async () => (await world(page))?.scene, { timeout: 15_000 }).toBe('faith');
	await expect(page.locator('[data-rail="faith"]')).toHaveAttribute('aria-current', 'step');
});

test('the first visit plays the splash, then the world takes over', async ({ browser }, info) => {
	const context = await browser.newContext({ ...info.project.use, reducedMotion: 'no-preference' });
	const page = await context.newPage();
	const errors = collectErrors(page);
	await page.goto('/');
	await expect(page.locator('html')).toHaveClass(/splashing/);
	await expect(page.locator('html')).not.toHaveClass(/splashing/, { timeout: 10_000 });
	await expect(page.locator('[data-splash-target]')).toBeVisible();
	if (isChromium(info)) expect(await waitForWorld(page)).toBe(true);
	// A second visit in the same session skips it.
	await page.reload();
	await expect(page.locator('html')).not.toHaveClass(/splashing/);
	expect(errors).toEqual([]);
	await context.close();
});
