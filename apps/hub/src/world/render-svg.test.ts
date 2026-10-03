// Every postcard renders, stays light enough to ship, and contains what its scene promises.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderScene, propAnchor } from './render-svg.ts';
import { baseHalfWidth } from './props.ts';
import { SCENES, VARIANTS, type Variant } from './scenes.ts';

const MARK = '<path d="M0 0h400v400H0z"/>';

for (const s of SCENES) {
	for (const v of Object.keys(VARIANTS) as Variant[]) {
		test(`postcard ${s.id}-${v}`, () => {
			const svg = renderScene(s, v, MARK);
			assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
			assert.ok(svg.endsWith('</svg>'));
			assert.ok(!/NaN|undefined|Infinity/.test(svg), 'no broken numbers');
			for (let i = 0; i < 4; i++) assert.ok(svg.includes(`id="${s.id}-${v}-l${i}"`), `layer ${i}`);
			const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
			assert.equal(new Set(ids).size, ids.length, 'ids are unique');
			assert.ok(svg.includes('href="#mark"'), 'the walker is there');
			assert.ok(svg.length < 90_000, `size ${svg.length}`);
			if (s.water?.kind === 'lake') assert.ok(svg.includes(`${s.id}-${v}-lakeclip`));
		});
	}
}

// In every postcard, things standing on the land touch it.
for (const s of SCENES) {
	for (const v of Object.keys(VARIANTS) as Variant[]) {
		test(`postcard ${s.id}-${v}: grounded props touch the ground`, () => {
			s.props.forEach((p, i) => {
				const half = baseHalfWidth(p.kind, p.size);
				if (p.layer === undefined || half === 0) return;
				const { x, y, ground } = propAnchor(s, v, i);
				const worst = Math.max(...[x - half, x, x + half].map((gx) => ground(gx) - y));
				assert.ok(Math.abs(worst) < 0.01, `${p.kind} #${i}: ${worst.toFixed(2)} units off the ground`);
			});
		});
	}
}
