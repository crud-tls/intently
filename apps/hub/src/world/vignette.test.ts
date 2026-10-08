// The strips of land behind each app: one per chapter, light enough to inline seven times on the
// home page, each from its own hour's palette, and steady from build to build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vignette, vignetteGround, VIGNETTE_WIDTH } from './vignette.ts';
import { CHAPTERS } from '../data/chapters.ts';
import { SKY } from '../data/sky.ts';

for (const c of CHAPTERS) {
	test(`vignette ${c.id}`, () => {
		const svg = vignette(c.id, 64);
		assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"') && svg.endsWith('</svg>'));
		assert.ok(svg.includes('aria-hidden="true"'), 'decoration, hidden from assistive tech');
		assert.ok(!/NaN|undefined|Infinity/.test(svg), 'no broken numbers');
		assert.ok(svg.includes(SKY[c.sky].ground[3]) && svg.includes(SKY[c.sky].ground[2]), 'in its own hour\'s colours');
		assert.ok(svg.length < 9_000, `size ${svg.length}`);
		assert.equal(svg, vignette(c.id, 64), 'the same every time');
	});
}

test('each hour has its own hills', () => {
	const all = CHAPTERS.map((c) => vignette(c.id, 64).replace(/fill="[^"]+"/g, ''));
	assert.equal(new Set(all).size, all.length);
});

test('the near ground is inside the strip, wherever something stands on it', () => {
	for (const c of CHAPTERS) {
		for (const h of [64, 116]) {
			for (const fromRight of [40, 64, 150, 400, VIGNETTE_WIDTH - 10]) {
				const y = vignetteGround(c.id, h, fromRight);
				assert.ok(y > h * 0.5 && y < h, `${c.id} ground at ${y.toFixed(1)} of ${h}`);
			}
		}
	}
});

test('ids stay unique when every strip is on one page', () => {
	const ids = CHAPTERS.flatMap((c) => [...vignette(c.id, 64).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
	assert.equal(new Set(ids).size, ids.length);
});
