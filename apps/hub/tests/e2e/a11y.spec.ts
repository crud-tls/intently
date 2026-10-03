/** Automated accessibility checks (axe): no serious or critical problems on any page. */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { skipSplash } from './helpers.ts';

const PAGES = ['/', ...CHAPTERS.map((c) => c.path), '/about/', '/contact/'];

test.beforeEach(async ({ page }, info) => {
	test.skip(!['desktop-chrome', 'iphone'].includes(info.project.name), 'one desktop and one phone layout is enough');
	await skipSplash(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const path of PAGES) {
	test(`axe ${path}`, async ({ page }) => {
		await page.goto(path);
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
	});
}

test('keyboard: the first tab lands on a visible link with a focus ring', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop-chrome', 'phones have no Tab key (iOS Safari does not tab to links by default)');
	await page.goto('/');
	await page.keyboard.press('Tab');
	const focused = page.locator(':focus');
	await expect(focused).toBeVisible();
	const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
	expect(outline).not.toBe('none');
});
