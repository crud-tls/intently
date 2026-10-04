/**
 * The live world's terrain, prepared on the CPU each time the camera moves: the ridge height of all
 * four layers under every screen column, and the pines near the screen. The shader only looks
 * these up, so the hills are the same as the static landscapes' (same functions, src/world/terrain.ts).
 *
 * Ridges are sampled on a fixed world grid (every STEP units along each layer) and cached, so a
 * moving camera only computes the few samples it hasn't seen yet; pines are cached per cell.
 */
import { LAYERS, ridge, treeAt, shoreY, type Tree } from '../../world/terrain.ts';

export const TREE_SLOTS = 256;
const STEP = 2;
const CACHE_LIMIT = 40000;

export interface Lake {
	/** Screen-relative units (0 = centre), and the water line in units from the top. */
	a: number;
	b: number;
	level: number;
}

export interface Columns {
	/** RGBA per column: ridge y (units) of layers 0..3. */
	ridges: Float32Array;
	/** RGBA per slot, one row per tree layer (1, 2): centre x (screen units), tip y, height, 1 if a tree. */
	trees: Float32Array;
	/** First tree cell index per tree layer, so the shader can find a cell's slot. */
	firstCell: [number, number];
}

const TREE_LAYERS = [1, 2] as const;
const ridgeCache = LAYERS.map(() => new Map<number, number>());
const treeCache = LAYERS.map(() => new Map<number, Tree | null>());

/** Ridge y (units) of layer l at layer-world x (units), from cached grid samples. */
export function ridgeAt(l: number, wx: number): number {
	const cache = ridgeCache[l];
	if (cache.size > CACHE_LIMIT) cache.clear();
	const f = wx / STEP;
	const k = Math.floor(f);
	const sample = (i: number) => {
		let v = cache.get(i);
		if (v === undefined) {
			v = ridge(LAYERS[l], (i * STEP) / 1600) * 1000;
			cache.set(i, v);
		}
		return v;
	};
	const a = sample(k);
	return a + (sample(k + 1) - a) * (f - k);
}

function treeCached(l: number, c: number): Tree | null {
	const cache = treeCache[l];
	if (cache.size > CACHE_LIMIT) cache.clear();
	let t = cache.get(c);
	if (t === undefined) {
		t = treeAt(LAYERS[l], c);
		cache.set(c, t);
	}
	return t;
}

/** `cols` columns spanning `visW` units around the camera at `cam`. */
export function computeColumns(cols: number, visW: number, cam: number, lake: Lake | null, out?: Columns): Columns {
	const ridges = out?.ridges.length === cols * 4 ? out.ridges : new Float32Array(cols * 4);
	const trees = out?.trees ?? new Float32Array(TREE_SLOTS * 4 * 2);
	const firstCell: [number, number] = [0, 0];

	for (let i = 0; i < cols; i++) {
		const xr = ((i + 0.5) / cols - 0.5) * visW;
		for (let l = 0; l < 4; l++) {
			let y = ridgeAt(l, cam * LAYERS[l].parallax + xr);
			if (l === 3 && lake) y = shoreY(y, xr, lake.a, lake.b, lake.level);
			ridges[i * 4 + l] = y;
		}
	}

	trees.fill(0);
	TREE_LAYERS.forEach((l, row) => {
		const L = LAYERS[l];
		const cell = L.trees!.cell;
		const first = Math.floor((cam * L.parallax - visW / 2 - 60) / 1600 / cell);
		firstCell[row] = first;
		for (let k = 0; k < TREE_SLOTS; k++) {
			const t = treeCached(l, first + k);
			if (!t) continue;
			const o = (row * TREE_SLOTS + k) * 4;
			const h = t.h * 1000;
			trees[o] = t.x * 1600 - cam * L.parallax;
			trees[o + 1] = t.y * 1000 - h;
			trees[o + 2] = h;
			trees[o + 3] = 1;
		}
	});

	return { ridges, trees, firstCell };
}

/** The ridge of one layer at a screen x, for standing things on the ground. */
export function groundAt(layer: number, xr: number, cam: number, lake: Lake | null): number {
	let y = ridgeAt(layer, cam * LAYERS[layer].parallax + xr);
	if (layer === 3 && lake) y = shoreY(y, xr, lake.a, lake.b, lake.level);
	return y;
}
