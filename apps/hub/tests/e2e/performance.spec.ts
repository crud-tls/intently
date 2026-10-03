/** Weight budgets, so the world stays light on phones. */
import { test, expect, type Page } from '@playwright/test';
import { skipSplash } from './helpers.ts';

async function scriptBytes(page: Page, path: string): Promise<number> {
	let total = 0;
	page.on('response', async (res) => {
		if (res.request().resourceType() === 'script') total += (await res.body().catch(() => Buffer.alloc(0))).length;
	});
	await page.goto(path, { waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	return total;
}

test.beforeEach(async ({ page }, info) => {
	test.skip(!['desktop-chrome', 'android'].includes(info.project.name), 'byte budgets: Chromium is enough');
	await skipSplash(page);
});

test('home page JavaScript stays within budget (uncompressed)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	// The splash player (lottie, ~170 KB) is preloaded on the home page; the world itself is ~65 KB + Lenis.
	expect(await scriptBytes(page, '/')).toBeLessThan(300_000);
});

test('chapter pages stay light', async ({ page }) => {
	expect(await scriptBytes(page, '/time/')).toBeLessThan(120_000);
});

test('with the live world running, landscapes further down are never downloaded', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	const svgs: string[] = [];
	page.on('request', (r) => r.url().includes('/world/') && svgs.push(r.url()));
	await page.goto('/');
	await page.waitForFunction(() => document.documentElement.classList.contains('world-live'), null, { timeout: 20_000 });
	for (let i = 0; i < 6; i++) {
		await page.mouse.wheel(0, 1500);
		await page.waitForTimeout(150);
	}
	// The first scenes may be fetched before the world starts; nothing past them.
	expect(svgs.filter((u) => !/\/world\/(prologue|time)-/.test(u))).toEqual([]);
});
