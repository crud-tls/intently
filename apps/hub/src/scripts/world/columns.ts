/**
 * The live world's terrain, prepared on the CPU each time the camera moves: the ridge height of all
 * four layers under every screen column, and the pines near the screen. The shader only looks
 * these up, so the hills are the same as the static landscapes' (same functions, src/world/terrain.ts).
 */
import { LAYERS, ridge, treeAt, shoreY } from '../../world/terrain.ts';

export const TREE_SLOTS = 256;

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

/** `cols` columns spanning `visW` units around the camera at `cam`. */
export function computeColumns(cols: number, visW: number, cam: number, lake: Lake | null, out?: Columns): Columns {
	const ridges = out?.ridges.length === cols * 4 ? out.ridges : new Float32Array(cols * 4);
	const trees = out?.trees ?? new Float32Array(TREE_SLOTS * 4 * 2);
	const firstCell: [number, number] = [0, 0];

	for (let i = 0; i < cols; i++) {
		const xr = ((i + 0.5) / cols - 0.5) * visW;
		for (let l = 0; l < 4; l++) {
			const L = LAYERS[l];
			let y = ridge(L, (cam * L.parallax + xr) / 1600) * 1000;
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
			const t = treeAt(L, first + k);
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
	const L = LAYERS[layer];
	let y = ridge(L, (cam * L.parallax + xr) / 1600) * 1000;
	if (layer === 3 && lake) y = shoreY(y, xr, lake.a, lake.b, lake.level);
	return y;
}
