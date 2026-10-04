/**
 * The shape of the world: four layers of land, far to near, each a deterministic 1-D profile, and
 * pines along two of them. The same maths runs here (static SVG landscapes, at build time) and in
 * the live renderer's shader (src/scripts/world/scene.frag), so both draw the same hills. Keep the
 * two in step: the hash uses 32-bit integer ops that GLSL ES 3.00 `uint` reproduces exactly.
 *
 * Coordinates: x is in screen widths along a layer (layer x = camera x * parallax), y runs from
 * 0 at the top of the scene to 1 at the bottom.
 */

export interface Layer {
	seed: number;
	/** How far this layer moves when the camera moves one screen width. */
	parallax: number;
	/** The resting height of its ridge line. */
	base: number;
	/** How tall its hills get. */
	amp: number;
	/** Hills per screen width. */
	freq: number;
	octaves: number;
	/** 0 rolling hills, 1 sharp mountain ridges. */
	ridged: number;
	trees?: { cell: number; height: number; density: number };
}

export const LAYERS: Layer[] = [
	{ seed: 11, parallax: 0.12, base: 0.6, amp: 0.26, freq: 1.1, octaves: 5, ridged: 1 },
	{ seed: 23, parallax: 0.3, base: 0.66, amp: 0.1, freq: 1.9, octaves: 4, ridged: 0.4, trees: { cell: 0.011, height: 0.035, density: 0.55 } },
	{ seed: 37, parallax: 0.58, base: 0.75, amp: 0.07, freq: 1.5, octaves: 3, ridged: 0, trees: { cell: 0.019, height: 0.07, density: 0.45 } },
	{ seed: 51, parallax: 1, base: 0.87, amp: 0.06, freq: 0.9, octaves: 3, ridged: 0 },
];

/** lowbias32 (Chris Wellons): the same bits in JS and GLSL. */
export function hash(x: number): number {
	x = (x ^ (x >>> 16)) >>> 0;
	x = Math.imul(x, 0x7feb352d) >>> 0;
	x = (x ^ (x >>> 15)) >>> 0;
	x = Math.imul(x, 0x846ca68b) >>> 0;
	return (x ^ (x >>> 16)) >>> 0;
}

/** A value in 0..1 for lattice point i. Offset keeps i positive (GLSL converts int to uint). */
export function rnd(i: number, seed: number): number {
	return hash(((i + 100000) ^ Math.imul(seed, 0x9e3779b9)) >>> 0) / 4294967295;
}

export function noise(x: number, seed: number): number {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return rnd(i, seed) + (rnd(i + 1, seed) - rnd(i, seed)) * u;
}

/** Fractal noise in 0..1, optionally ridged (folded, for mountain crests). */
export function fbm(x: number, seed: number, octaves: number, ridged: number): number {
	let sum = 0;
	let amp = 0.5;
	let norm = 0;
	let f = 1;
	for (let o = 0; o < octaves; o++) {
		const n = noise(x * f, seed + o * 101);
		const r = 1 - Math.abs(2 * n - 1);
		sum += amp * (n + (r - n) * ridged);
		norm += amp;
		amp *= 0.5;
		f *= 2.03;
	}
	return sum / norm;
}

/**
 * The ridge line of a layer at layer-x: y of the top of the land. The tallest peaks are softly
 * capped, so the far range never climbs into the top 40% of the sky, where words sit.
 */
export function ridge(layer: Layer, x: number): number {
	const h = fbm(x * layer.freq, layer.seed, layer.octaves, layer.ridged) - 0.35;
	const capped = h < 0.2 ? h : 0.2 + (h - 0.2) * 0.4;
	return layer.base - capped * layer.amp * 2;
}

export interface Tree {
	x: number;
	/** y of the ground under it. */
	y: number;
	h: number;
}

/** The pine (if any) whose cell is `c`. */
export function treeAt(layer: Layer, c: number): Tree | null {
	const t = layer.trees;
	if (!t) return null;
	// Forests come in patches: a slow noise decides how dense this stretch is.
	const patch = noise(c * t.cell * 0.9, layer.seed + 7);
	if (rnd(c, layer.seed + 3) > t.density * (0.25 + 1.5 * patch * patch)) return null;
	const x = (c + 0.2 + 0.6 * rnd(c, layer.seed + 5)) * t.cell;
	const h = t.height * (0.55 + 0.6 * rnd(c, layer.seed + 9));
	return { x, y: ridge(layer, x), h };
}

/** Pine width at depth d below its tip: a cone with three soft tiers. Half-width, same units as h. */
export function pineHalfWidth(h: number, d: number): number {
	const tier = (d / h) * 3;
	return d * 0.32 * (0.72 + 0.28 * (tier - Math.floor(tier)));
}

/**
 * The foreground around a lake (screen-space x, units): banks stand a little above the water near
 * it, and inside it the ground drops away below the bottom of the scene. `a`/`b` are the lake's ends.
 */
export const LAKE_EDGE = 110;
const BANK = 320;

export function lakeWeight(x: number, a: number, b: number): number {
	const t = Math.min(Math.max((x - (a - LAKE_EDGE)) / LAKE_EDGE, 0), 1) * Math.min(Math.max((b + LAKE_EDGE - x) / LAKE_EDGE, 0), 1);
	return t * t * (3 - 2 * t);
}

export function shoreY(y: number, x: number, a: number, b: number, level: number): number {
	const away = Math.max(a - LAKE_EDGE - x, x - (b + LAKE_EDGE), 0);
	const bank = 1 - Math.min(away / BANK, 1);
	const raised = y + (Math.min(y, level - 16) - y) * bank * bank * (3 - 2 * bank);
	return raised + lakeWeight(x, a, b) * (1040 - raised);
}
