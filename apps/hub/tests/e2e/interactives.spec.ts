/**
 * The chapter interactives: their numbers are right, they answer touch, mouse and keyboard, the
 * live hero draws them where it can, and without it the still example below follows the controls.
 */
import { test, expect } from '@playwright/test';
import { hoursPerYear, lifeWeeks, wakingDays, weeksLived } from '../../src/scripts/lib/math.ts';
import { collectErrors, isChromium, skipSplash } from './helpers.ts';

const fmt = (n: number) => Math.floor(n).toLocaleString('en');

async function setRange(page: import('@playwright/test').Page, selector: string, value: number) {
	await page.locator(selector).evaluate((el: HTMLInputElement, v) => {
		el.value = String(v);
		el.dispatchEvent(new Event('input', { bubbles: true }));
	}, value);
}

async function heroFrames(page: import('@playwright/test').Page) {
	return page.evaluate(() => (window as unknown as { __intentlyHero?: { frames: number } }).__intentlyHero?.frames ?? 0);
}

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
});

test.describe('time', () => {
	test('your weeks: the numbers follow the sliders, and the hero draws them', async ({ page }, info) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		const errors = collectErrors(page);
		await page.goto('/time/');
		for (const [age, life] of [[30, 80], [42, 80], [65, 90], [95, 80]]) {
			await setRange(page, '[data-age]', age);
			await setRange(page, '[data-life]', life);
			await expect(page.locator('[data-out="lived"]')).toHaveText(fmt(Math.min(weeksLived(age), lifeWeeks(life))));
			if (age < life) {
				await expect(page.locator('[data-out="ahead"]')).toHaveText(fmt(lifeWeeks(life) - weeksLived(age)));
				await expect(page.locator('[data-past]')).toBeHidden();
			} else await expect(page.locator('[data-past]')).toBeVisible();
		}
		if (isChromium(info)) {
			await expect.poll(() => heroFrames(page)).toBeGreaterThan(3);
			await expect(page.locator('html')).toHaveClass(/hero-live/);
			const stage = await page.locator('[data-stage]').boundingBox();
			expect(stage!.width).toBeGreaterThan(150);
			// The still example steps aside for the live one.
			await expect(page.locator('[data-still-feel]')).toBeHidden();
		}
		expect(errors).toEqual([]);
	});

	test('without the live world, the still frame of weeks follows the sliders', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/time/');
		await expect(page.locator('html')).not.toHaveClass(/hero-live/);
		await expect(page.locator('[data-still-feel]')).toBeVisible();
		await setRange(page, '[data-age]', 50);
		await expect(page.locator('.feel svg.weeks [data-lived]')).toHaveAttribute('height', String(50 * 10));
		await setRange(page, '[data-life]', 90);
		await expect(page.locator('.feel svg.weeks [data-ahead]')).toHaveAttribute('height', String(90 * 10));
	});

	test('the sliders work from the keyboard', async ({ page }, info) => {
		test.skip(!['desktop-chrome', 'desktop-safari'].includes(info.project.name), 'keyboard on desktops');
		await page.goto('/time/');
		await page.locator('[data-age]').focus();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('[data-out="age"]')).toHaveText('32');
		await expect(page.locator('[data-out="lived"]')).toHaveText(fmt(weeksLived(32)));
	});
});

test.describe('attention', () => {
	test('holding one slow breath quiets the morning', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		const errors = collectErrors(page);
		await page.goto('/attention/');
		const feel = page.locator('[data-feel="attention"]');
		const button = page.locator('[data-breathe]');
		await button.scrollIntoViewIfNeeded();
		const box = (await button.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await expect(button).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('[data-cue]')).toHaveText('Breathe in…');
		await expect.poll(async () => +(await feel.getAttribute('data-calm'))!, { timeout: 9_000 }).toBeGreaterThanOrEqual(100);
		await page.mouse.up();
		await expect(page.locator('[data-cue]')).toContainText('the gap');
		expect(errors).toEqual([]);
	});

	test('a single tap guides the breath for you', async ({ page }) => {
		await page.goto('/attention/');
		await page.locator('[data-breathe]').click();
		await expect.poll(async () => +(await page.locator('[data-feel="attention"]').getAttribute('data-calm'))!, { timeout: 9_000 }).toBeGreaterThanOrEqual(100);
	});

	test('letting go early: the noise creeps back', async ({ page }) => {
		await page.goto('/attention/');
		const button = page.locator('[data-breathe]');
		const box = (await button.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(1500);
		await page.mouse.up();
		const calm = +(await page.locator('[data-feel="attention"]').getAttribute('data-calm'))!;
		expect(calm).toBeGreaterThan(10);
		expect(calm).toBeLessThan(100);
		await expect.poll(async () => +(await page.locator('[data-feel="attention"]').getAttribute('data-calm'))!).toBeLessThan(calm);
	});

	test('the space bar holds a breath too', async ({ page }, info) => {
		test.skip(!['desktop-chrome', 'desktop-safari'].includes(info.project.name), 'keyboard on desktops');
		await page.goto('/attention/');
		await page.locator('[data-breathe]').focus();
		await page.keyboard.down(' ');
		await expect.poll(async () => +(await page.locator('[data-feel="attention"]').getAttribute('data-calm'))!, { timeout: 9_000 }).toBeGreaterThanOrEqual(100);
		await page.keyboard.up(' ');
	});

	test('phone hours add up', async ({ page }) => {
		await page.goto('/attention/');
		for (const h of [0, 2.5, 4, 12]) {
			await setRange(page, '[data-hours]', h);
			await expect(page.locator('[data-out="year"]')).toHaveText(fmt(hoursPerYear(h)));
			await expect(page.locator('[data-out="days"]')).toHaveText(fmt(wakingDays(hoursPerYear(h))));
		}
	});
});
