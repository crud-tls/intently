/**
 * The chapter interactives: their numbers are right, they answer touch, mouse and keyboard, the
 * live hero draws them where it can, and without it the still example below follows the controls.
 */
import { test, expect } from '@playwright/test';
import { hoursPerYear, kmPerYear, lifeWeeks, marathons, setAside, visitsLeft, wakingDays, weeksLived, withGrowth } from '../../src/scripts/lib/math.ts';
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

test.describe('faith', () => {
	test('holding the lantern lights the night and raises the verse', async ({ page }, info) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		const errors = collectErrors(page);
		await page.goto('/faith/');
		const feel = page.locator('[data-feel="faith"]');
		const button = page.locator('[data-lantern]');
		await button.scrollIntoViewIfNeeded();
		const box = (await button.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await expect(page.locator('[data-feel="faith"] [data-cue]')).toHaveText('Slowly…');
		await expect.poll(async () => +(await feel.getAttribute('data-light'))!, { timeout: 12_000 }).toBeGreaterThanOrEqual(100);
		await page.mouse.up();
		await expect(page.locator('[data-feel="faith"] [data-cue]')).toHaveText('Stay as long as you like.');
		// It doesn't fade when you let go.
		await page.waitForTimeout(1500);
		expect(+(await feel.getAttribute('data-light'))!).toBe(100);
		if (isChromium(info)) {
			await expect.poll(() => heroFrames(page)).toBeGreaterThan(3);
			const verse = page.locator('[data-feel="faith"] [data-verse]');
			await expect(verse).toBeVisible();
			await expect.poll(() => verse.evaluate((el) => +getComputedStyle(el).opacity)).toBeGreaterThan(0.95);
			await expect(verse.locator('.arabic')).toHaveAttribute('lang', 'ar');
		}
		expect(errors).toEqual([]);
	});

	test('a tap lets the lantern brighten on its own', async ({ page }) => {
		await page.goto('/faith/');
		await page.locator('[data-lantern]').click();
		await expect.poll(async () => +(await page.locator('[data-feel="faith"]').getAttribute('data-light'))!, { timeout: 12_000 }).toBeGreaterThanOrEqual(100);
	});

	test('without the live world the verse is still there, below', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/faith/');
		await expect(page.locator('[data-still-feel] .verse .arabic')).toBeVisible();
		await expect(page.locator('[data-feel="faith"] [data-verse]')).toBeHidden();
	});
});

test.describe('relationships', () => {
	test('the visits ahead follow their age and how often you see them', async ({ page }, info) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		const errors = collectErrors(page);
		await page.goto('/relationships/');
		for (const [age, per] of [[60, 4], [72, 12], [30, 1], [90, 6]]) {
			await setRange(page, '[data-their-age]', age);
			await setRange(page, '[data-per-year]', per);
			const n = visitsLeft(age, per);
			await expect(page.locator('[data-feel="relationships"]')).toHaveAttribute('data-visits', String(n));
			if (n > 0) await expect(page.locator('[data-out="visits"]')).toHaveText(n.toLocaleString('en'));
			else await expect(page.locator('[data-none]')).toBeVisible();
		}
		if (isChromium(info)) await expect.poll(() => heroFrames(page)).toBeGreaterThan(3);
		expect(errors).toEqual([]);
	});

	test('without the live world, the still dots are one per visit', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/relationships/');
		await setRange(page, '[data-their-age]', 75);
		await setRange(page, '[data-per-year]', 6);
		await expect(page.locator('.feel svg.visits circle')).toHaveCount(visitsLeft(75, 6));
	});
});

test.describe('wealth', () => {
	test('a small amount, simply set aside, in your currency; growth only when asked, and labelled', async ({ page }) => {
		const errors = collectErrors(page);
		await page.goto('/wealth/');
		await setRange(page, '[data-amount]', 20);
		await setRange(page, '[data-years]', 20);
		await page.locator('[data-currency]').selectOption('USD');
		await expect(page.locator('[data-feel="wealth"]')).toHaveAttribute('data-total', String(setAside(20, 20)));
		await expect(page.locator('[data-out="total"]')).toHaveText('$146,000');
		await expect(page.locator('[data-out="year"]')).toHaveText('$7,300');
		await expect(page.locator('[data-growth-line]')).toBeHidden();
		await page.locator('[data-growth]').check();
		await expect(page.locator('[data-growth-line]')).toBeVisible();
		await expect(page.locator('[data-growth-line]')).toContainText('not advice');
		const grown = Math.round(withGrowth(20, 20, 0.05)).toLocaleString('en');
		await expect(page.locator('[data-out="grown"]')).toHaveText(`$${grown}`);
		// The headline number never includes growth.
		await expect(page.locator('[data-out="total"]')).toHaveText('$146,000');
		expect(errors).toEqual([]);
	});

	test('without the live world the still tally follows the amount', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/wealth/');
		await setRange(page, '[data-amount]', 3);
		await expect(page.locator('.feel [data-tally="year"]')).toHaveText(setAside(3, 1).toLocaleString('en'));
		await expect(page.locator('.feel [data-tally="ten"]')).toHaveText(setAside(3, 10).toLocaleString('en'));
	});
});

test.describe('health', () => {
	test('breathing with the sun counts the box breath and can be stopped', async ({ page }) => {
		const errors = collectErrors(page);
		await page.goto('/health/');
		const feel = page.locator('[data-feel="health"]');
		const button = page.locator('[data-pace]');
		await button.click();
		await expect(feel).toHaveAttribute('data-breathing', 'true');
		await expect(page.locator('[data-feel="health"] [data-cue]')).toContainText('Breathe in');
		await expect(feel).toHaveAttribute('data-phase', '1', { timeout: 8_000 });
		await expect(page.locator('[data-feel="health"] [data-cue]')).toContainText('Hold');
		await button.click();
		await expect(feel).toHaveAttribute('data-breathing', 'false');
		await expect(button).toHaveText('Breathe with the sun');
		expect(errors).toEqual([]);
	});

	test('everyday steps add up to marathons', async ({ page }) => {
		await page.goto('/health/');
		for (const s of [0, 6000, 12500, 20000]) {
			await setRange(page, '[data-steps]', s);
			const m = Math.round(marathons(kmPerYear(s)));
			await expect(page.locator('[data-feel="health"]')).toHaveAttribute('data-marathons', String(m));
			await expect(page.locator('[data-out="year"]')).toHaveText(Math.round(kmPerYear(s)).toLocaleString('en'));
		}
	});
});

test.describe('self', () => {
	test('small acts build the sentence; holding still sharpens the reflection', async ({ page }, info) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		const errors = collectErrors(page);
		await page.goto('/self/');
		const feel = page.locator('[data-feel="self"]');
		await page.locator('[data-act="rested"]').click();
		await page.locator('[data-act="kind"]').click();
		await page.locator('[data-act="present"]').click();
		await expect(page.locator('[data-feel="self"] [data-becoming]')).toHaveText('rested, kind and present');
		await expect(page.locator('[data-act="kind"]')).toHaveAttribute('aria-pressed', 'true');
		await page.locator('[data-act="kind"]').click();
		await expect(page.locator('[data-feel="self"] [data-becoming]')).toHaveText('rested and present');
		// Stillness: nothing moves for a few seconds.
		await expect.poll(async () => +(await feel.getAttribute('data-stillness'))!, { timeout: 8_000 }).toBe(100);
		await expect(page.locator('[data-feel="self"] [data-cue]')).toHaveText('There you are.');
		if (!info.project.name.match(/iphone|ipad|android/)) {
			await page.mouse.move(100, 100);
			await page.mouse.move(300, 200);
			await expect.poll(async () => +(await feel.getAttribute('data-stillness'))!).toBeLessThan(100);
		}
		expect(errors).toEqual([]);
	});

	test('without the live world the still sentence follows the acts too', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/self/');
		await page.locator('[data-act="brave"]').click();
		await expect(page.locator('.feel [data-becoming]')).toHaveText('brave');
	});
});

test('nothing you type can leave the page: requests to other sites are blocked', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop-chrome', 'one browser proves the policy');
	await page.goto('/wealth/');
	const result = await page.evaluate(async () => {
		try {
			await fetch('https://example.com/collect', { method: 'POST', body: 'amount=5' });
			return 'sent';
		} catch {
			return 'blocked';
		}
	});
	expect(result).toBe('blocked');
	// Its own contact form still works.
	const own = await page.evaluate(async () => (await fetch('/api/contact', { method: 'POST', body: new FormData() })).status);
	expect(own).not.toBe(0);
});
