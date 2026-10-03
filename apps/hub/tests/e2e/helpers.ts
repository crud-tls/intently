import { expect, type Page, type TestInfo } from '@playwright/test';

export interface WorldState {
	u: number;
	scene: string;
	frames: number;
	resting: boolean;
	zenith: string;
	/** The walker's feet, in world units from the screen centre and the top. */
	walker: { x: number; y: number };
	/** CSS pixels per world unit. */
	scale: number;
	/** Sprite kinds the test asked the world to leave out. */
	hide: string[];
}

/** Console errors and uncaught exceptions, minus GPU driver chatter that isn't ours. */
export function collectErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
	page.on('console', (m) => {
		const text = m.text();
		if (/GL Driver Message|GPU stall|WebGL: INVALID_ENUM: getParameter/.test(text)) return;
		if (m.type() === 'error') errors.push(`console.error: ${text}`);
		if (m.type() === 'warning' && text.includes('[world]')) errors.push(`console.warn: ${text}`);
	});
	return errors;
}

export const isMobile = (info: TestInfo) => ['android', 'iphone', 'ipad'].includes(info.project.name);
export const isChromium = (info: TestInfo) => ['desktop-chrome', 'android'].includes(info.project.name);

/** Skip the first-visit splash so tests start on the page itself. */
export async function skipSplash(page: Page) {
	await page.addInitScript(() => {
		try {
			sessionStorage.setItem('introSeen', '1');
		} catch {}
	});
}

export async function world(page: Page): Promise<WorldState | null> {
	return page.evaluate(() => (window as unknown as { __intentlyWorld?: WorldState }).__intentlyWorld ?? null);
}

/** Waits until the live world has drawn a few frames; returns false if it never starts. */
export async function waitForWorld(page: Page, timeout = 20_000): Promise<boolean> {
	try {
		await page.waitForFunction(() => ((window as unknown as { __intentlyWorld?: { frames: number } }).__intentlyWorld?.frames ?? 0) > 3, null, { timeout });
		return true;
	} catch {
		return false;
	}
}

/** Puts scene i's centre at the centre of the viewport. */
export async function scrollToScene(page: Page, i: number) {
	await page.evaluate((i) => {
		const s = document.querySelectorAll<HTMLElement>('[data-scene]')[i];
		const r = s.getBoundingClientRect();
		window.scrollTo({ top: r.top + scrollY + r.height / 2 - innerHeight / 2, behavior: 'instant' as ScrollBehavior });
	}, i);
}

/** Scroll by a real input gesture: the wheel on desktop, a finger swipe on Chromium phones. */
export async function gesture(page: Page, info: TestInfo, dy: number) {
	if (!isMobile(info)) {
		await page.mouse.move(400, 300);
		await page.mouse.wheel(0, dy);
		return;
	}
	if (isChromium(info)) {
		const cdp = await page.context().newCDPSession(page);
		const vp = page.viewportSize()!;
		await cdp.send('Input.synthesizeScrollGesture', {
			x: vp.width / 2,
			y: vp.height / 2,
			yDistance: -dy,
			gestureSourceType: 'touch',
			speed: 2400,
		});
		await cdp.detach();
		return;
	}
	await page.evaluate((dy) => window.scrollBy(0, dy), dy);
}

/** Opacity of a scene's words as the visitor sees them. */
export async function wordsOpacity(page: Page, i: number): Promise<number> {
	return page.evaluate((i) => {
		const w = document.querySelectorAll<HTMLElement>('[data-scene]')[i].querySelector<HTMLElement>('.words')!;
		return +getComputedStyle(w).opacity;
	}, i);
}

export async function expectNoHorizontalScroll(page: Page) {
	const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
	expect(sw, 'page must not scroll sideways').toBeLessThanOrEqual(cw + 1);
}
