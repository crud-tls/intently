// The world's shape must be deterministic (static SVGs and the live renderer draw the same hills)
// and stay inside the bands the layout relies on (text sits above the far ridge).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYERS, hash, rnd, noise, fbm, ridge, treeAt, pineHalfWidth, shoreY, lakeWeight, LAKE_EDGE } from './terrain.ts';

test('hash is lowbias32 (the same bits GLSL computes)', () => {
	assert.equal(hash(0), 0);
	assert.equal(hash(1), hash(1));
	assert.notEqual(hash(1), hash(2));
	for (const x of [1, 7, 123456, 0xffffffff]) assert.ok(hash(x) >= 0 && hash(x) <= 0xffffffff);
});

test('noise and fbm stay in 0..1 and are continuous', () => {
	for (let x = -50; x < 50; x += 0.37) {
		const n = noise(x, 3);
		assert.ok(n >= 0 && n <= 1);
		assert.ok(Math.abs(noise(x + 1e-4, 3) - n) < 1e-2, `jump at ${x}`);
		const f = fbm(x, 5, 4, 0.5);
		assert.ok(f >= 0 && f <= 1);
	}
	assert.equal(rnd(5, 9), rnd(5, 9));
});

test('ridges stay in their bands, far to near', () => {
	// The far range never climbs into the top 40% of the sky, where words sit.
	const bands = [[0.4, 0.75], [0.58, 0.73], [0.68, 0.8], [0.8, 0.92]];
	LAYERS.forEach((L, i) => {
		for (let x = -20; x < 20; x += 0.013) {
			const y = ridge(L, x);
			assert.ok(y >= bands[i][0] && y <= bands[i][1], `layer ${i} at ${x}: ${y}`);
		}
	});
});

test('pines are deterministic and only on the tree layers', () => {
	assert.equal(treeAt(LAYERS[0], 10), null);
	assert.equal(treeAt(LAYERS[3], 10), null);
	let found = 0;
	for (let c = 0; c < 400; c++) {
		const a = treeAt(LAYERS[1], c);
		assert.deepEqual(a, treeAt(LAYERS[1], c));
		if (a) {
			found++;
			assert.ok(a.h > 0 && a.h < 0.1);
			assert.ok(Math.abs(a.y - ridge(LAYERS[1], a.x)) < 1e-12);
		}
	}
	assert.ok(found > 40, 'forests exist');
	assert.ok(pineHalfWidth(0.05, 0.05) > pineHalfWidth(0.05, 0.01));
});

test('lake: banks stand above the water, the lake bed drops away, far land is untouched', () => {
	const [a, b, level] = [0, 500, 840];
	assert.equal(shoreY(860, 250, a, b, level), 1040);
	assert.ok(shoreY(860, b + LAKE_EDGE + 20, a, b, level) <= level - 15);
	assert.equal(shoreY(860, b + LAKE_EDGE + 2000, a, b, level), 860);
	assert.equal(lakeWeight(-1000, a, b), 0);
	assert.equal(lakeWeight(250, a, b), 1);
});
