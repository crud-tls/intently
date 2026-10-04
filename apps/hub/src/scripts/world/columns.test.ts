import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeColumns, ridgeAt, groundAt, TREE_SLOTS } from './columns.ts';
import { LAYERS, ridge, treeAt } from '../../world/terrain.ts';

test('cached ridges match the terrain to within a hair', () => {
	for (let l = 0; l < 4; l++) {
		for (let x = -3000; x < 3000; x += 37.3) {
			assert.ok(Math.abs(ridgeAt(l, x) - ridge(LAYERS[l], x / 1600) * 1000) < 1.5, `layer ${l} at ${x}`);
		}
	}
});

test('columns cover the screen and trees line up with their cells', () => {
	const cam = 4321;
	const cols = 300;
	const c = computeColumns(cols, 1600, cam, null);
	assert.equal(c.ridges.length, cols * 4);
	for (let i = 0; i < cols; i++) {
		for (let l = 0; l < 4; l++) assert.ok(Number.isFinite(c.ridges[i * 4 + l]));
		assert.ok(c.ridges[i * 4] < c.ridges[i * 4 + 3] + 200, 'far ridges stand above the foreground, roughly');
	}
	[1, 2].forEach((l, row) => {
		for (let k = 0; k < TREE_SLOTS; k += 7) {
			const t = treeAt(LAYERS[l], c.firstCell[row] + k);
			const o = (row * TREE_SLOTS + k) * 4;
			assert.equal(c.trees[o + 3], t ? 1 : 0);
			// Stored as float32: a few thousandths of a unit is the precision there.
			if (t) assert.ok(Math.abs(c.trees[o] - (t.x * 1600 - cam * LAYERS[l].parallax)) < 0.01);
		}
	});
});

test('the walker can stand on the ground, or the lake bed falls away', () => {
	const lake = { a: -200, b: 200, level: 840 };
	assert.equal(groundAt(3, 0, 0, lake), 1040);
	assert.ok(groundAt(3, 700, 0, lake) < 1000);
});
