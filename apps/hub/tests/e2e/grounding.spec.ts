/**
 * The walker's feet touch the ground, measured in the rendered pixels on each device: the scene
 * is drawn with and without the walker, the lowest row where they differ is the feet, and the
 * strongest edge in that column of the empty scene is the ground (or the boardwalk). They must meet.
 */
import { test, expect, type Page } from '@playwright/test';
import { SCENES } from '../../src/world/scenes.ts';
import { skipSplash, scrollToScene, waitForWorld, world } from './helpers.ts';

test.use({ reducedMotion: 'no-preference' });

// Dawn, noon (leaning as it runs), afternoon (by the pond), blue hour (on the boardwalk), night.
const CHECKS = ['prologue', 'time', 'health', 'wealth', 'self', 'faith'];

interface Shot {
	data: number[];
	w: number;
	h: number;
}

async function grab(page: Page, clip: { x: number; y: number; width: number; height: number }): Promise<Shot> {
	const png = await page.screenshot({ clip, scale: 'css', animations: 'allow' });
	return page.evaluate(async (b64) => {
		const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
		const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
		const c = document.createElement('canvas');
		c.width = bmp.width;
		c.height = bmp.height;
		const ctx = c.getContext('2d')!;
		ctx.drawImage(bmp, 0, 0);
		return { data: Array.from(ctx.getImageData(0, 0, c.width, c.height).data), w: c.width, h: c.height };
	}, png.toString('base64'));
}

const px = (s: Shot, x: number, y: number) => {
	const i = (y * s.w + x) * 4;
	return [s.data[i], s.data[i + 1], s.data[i + 2]];
};
const lum = (p: number[]) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];

const setHidden = (page: Page, kinds: string[]) =>
	page.evaluate((kinds) => {
		(window as unknown as { __intentlyWorld: { hide: string[] } }).__intentlyWorld.hide = kinds;
	}, kinds);

async function frames(page: Page, n: number) {
	const start = (await world(page))!.frames;
	await expect.poll(async () => (await world(page))!.frames - start).toBeGreaterThanOrEqual(n);
}

test.beforeEach(async ({ page }) => {
	await skipSplash(page);
});

test('the walker stands on the ground at every hour', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/');
	test.skip(!(await waitForWorld(page)), 'no WebGL2 in this browser');

	for (const id of CHECKS) {
		const i = SCENES.findIndex((s) => s.id === id);
		await scrollToScene(page, i);
		await expect.poll(async () => (await world(page))?.scene).toBe(id);
		await page.waitForTimeout(700);
		const st = (await world(page))!;
		const vp = page.viewportSize()!;
		const cx = vp.width / 2 + st.walker.x * st.scale;
		const feet = st.walker.y * st.scale;
		const half = 84 * 0.3 * st.scale;
		const clip = {
			x: Math.max(0, Math.round(cx - half - 6)),
			y: Math.max(0, Math.round(feet - 90 * st.scale)),
			width: Math.round(2 * half + 12),
			height: Math.round(110 * st.scale),
		};
		await setHidden(page, []);
		await frames(page, 2);
		const withWalker = await grab(page, clip);
		await setHidden(page, ['walker']);
		await frames(page, 2);
		const without = await grab(page, clip);
		await setHidden(page, []);

		// The feet: the lowest differing row (above the feet line plus a margin, so a lake reflection
		// below the boardwalk isn't mistaken for them), and the column where it is.
		const limit = Math.min(withWalker.h - 1, Math.round(feet - clip.y + 6));
		let feetRow = -1;
		let feetCol = -1;
		for (let x = 0; x < withWalker.w; x++) {
			for (let y = limit; y >= 0; y--) {
				const a = px(withWalker, x, y);
				const b = px(without, x, y);
				if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 70) {
					if (y > feetRow) [feetRow, feetCol] = [y, x];
					break;
				}
			}
		}
		expect(feetRow, `${id}: the walker is drawn`).toBeGreaterThan(0);

		// The ground: the strongest brightness step in that column of the empty scene, averaged over
		// a few columns and rows so film grain doesn't count.
		const avg = (y0: number, y1: number) => {
			let sum = 0;
			let n = 0;
			for (let x = Math.max(0, feetCol - 3); x <= Math.min(without.w - 1, feetCol + 3); x++)
				for (let y = y0; y <= y1; y++) {
					sum += lum(px(without, x, y));
					n++;
				}
			return sum / n;
		};
		const steps: [number, number][] = [];
		for (let y = Math.max(3, feetRow - 14); y <= Math.min(without.h - 4, feetRow + 14); y++) {
			steps.push([y, Math.abs(avg(y, y + 2) - avg(y - 3, y - 1))]);
		}
		const best = Math.max(...steps.map(([, v]) => v));
		expect(best, `${id}: the ground has an edge under the walker`).toBeGreaterThan(3);
		// The nearest clear edge to the feet (lantern glow and grain make 'the strongest' unreliable).
		const strong = steps.filter(([, v]) => v >= Math.max(3, best * 0.45));
		const edge = strong.reduce((a, b) => (Math.abs(b[0] - feetRow - 1) < Math.abs(a[0] - feetRow - 1) ? b : a))[0];
		// On the boardwalk either face of the plank (5 units thick) is the surface.
		const tolerance = 3 + (id === 'self' ? 5 * st.scale : 0);
		expect(Math.abs(feetRow + 1 - edge), `${id}: feet at row ${feetRow + 1}, ground at row ${edge}`).toBeLessThanOrEqual(tolerance);
	}
});
