/**
 * The pond in the afternoon: how big it is for an amount set aside, and what has come to live in
 * it. One description for both renderers (the live world and the static postcards), so the pond on
 * the home page, the one in the Wealth hero and the still one are the same pond.
 *
 * The pond reads like a tally. Each drop from the spring is a day; each stone on the near shore is
 * a year; the water is as wide as the total. Reeds, lily pads, a jetty, a paper boat and the lilies'
 * flowers arrive in that order as it fills, and leave in reverse.
 *
 * Units as everywhere in the world: the scene is 1000 tall, x in the same units, y from the top.
 */
import { rnd } from './terrain.ts';

export interface Pond {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
}

export type PondKind = 'reed' | 'lily' | 'bloom' | 'stone' | 'boat';

export interface PondItem {
	kind: PondKind;
	x: number;
	y: number;
	/** In units: a reed's height, a pad's or stone's half-width, the boat's half-length. */
	size: number;
	/** 0..1: the newest arrival fades in rather than popping. */
	alpha: number;
	flip: boolean;
	/** 0..1, steady for this item: its own phase when it sways or bobs. */
	seed: number;
}

export interface PondLife {
	items: PondItem[];
	/** Planks from the left bank out over the water: their ends and the height of the deck. */
	jetty: { x0: number; x1: number; y: number; alpha: number } | null;
	/** 0 a puddle · 1 reeds · 2 lily pads · 3 a jetty · 4 a paper boat · 5 the lilies flower. */
	stage: number;
}

/** How flat the pond lies, and how deep (in units) it can get on screen. */
const RATIO = 0.24;
const MAX_RY = 50;

/** When each arrival comes, as a share of a full pond. */
export const ARRIVES = { reeds: 0.15, lilies: 0.3, jetty: 0.42, boat: 0.55, blooms: 0.72 } as const;

export const MAX_YEARS = 30;
const MAX_REEDS = 14;
const MAX_LILIES = 10;

/** What has arrived in a pond this full: 0 a puddle, then reeds, lily pads, a jetty, a paper boat, 5 the lilies flower. */
export const pondStage = (fill: number) =>
	fill >= ARRIVES.blooms ? 5 : fill >= ARRIVES.boat ? 4 : fill >= ARRIVES.jetty ? 3 : fill >= ARRIVES.lilies ? 2 : fill >= ARRIVES.reeds ? 1 : 0;

/** The example on the home page and the postcards: five a day for ten years. */
export const EXAMPLE = { perDay: 5, years: 10 } as const;

/** 0 for a few hundred set aside (a puddle) … 1 for half a million (a wide pool). */
export const pondFill = (total: number) => Math.min(1, Math.max(0, (Math.log10(Math.max(total, 1)) - 2) / 3.8));

/** The shore isn't a perfect ellipse. Its radius by angle; the shader repeats this exactly. */
export const shore = (a: number) => 1 + 0.05 * Math.sin(3 * a + 0.6) + 0.03 * Math.sin(5 * a + 2.1);

/**
 * The far shore lies this far below the ground line. The walker (and the spring) stand on plain
 * ground with a strip of bank under their feet, and only then the water: close enough to be at the
 * pond, far enough that their footing is never mistaken for it.
 */
export const BANK = 20;

/**
 * Half the pond's width for a fill. `room` is how far it is from the pond's middle to the edge of
 * the screen: on a phone the pond is smaller throughout, so it still grows with the total.
 */
export function pondRx(fill: number, room = Infinity): number {
	const cap = Math.min(260, Math.max(room, 110));
	const least = Math.min(90, cap * 0.6);
	return least + (cap - least) * fill;
}

/** The widest the pond gets: the ground is read across this much, so a growing pond never shifts. */
export const POND_REACH = pondRx(1);

/** The lowest ground under the pond's widest reach: where the water can lie without floating. */
export function pondGround(ground: (x: number) => number, cx: number): number {
	let low = -Infinity;
	for (let k = -4; k <= 4; k++) low = Math.max(low, ground(cx + (k * POND_REACH) / 4));
	return low;
}

/** A pond of half-width rx lying on the foreground, its far shore a bank's width below the ground line. */
export function pondAt(cx: number, groundY: number, rx: number): Pond {
	const ry = Math.min(rx * RATIO, MAX_RY);
	return { cx, cy: groundY + BANK + ry * 1.08, rx, ry };
}

/** A point on the shore at angle a (0 right, π/2 the near side, -π/2 the far side), pushed out by `out` units. */
export function shorePoint(p: Pond, a: number, out = 0): [number, number] {
	const r = shore(a);
	return [p.cx + (p.rx * r + out) * Math.cos(a), p.cy + (p.ry * r + out * 0.6) * Math.sin(a)];
}

const frac = (v: number) => v - Math.floor(v);
const fade = (count: number, k: number) => Math.min(1, Math.max(0, count - k));
const GOLDEN = 0.6180339887;

/**
 * What lives in the pond. `fill` is 0..1 (pondFill of the total) and `years` may be fractional
 * while it animates; `avoid` lists x-ranges to keep clear on the far bank (the walker, the spring).
 */
export function pondLife(p: Pond, fill: number, years: number, avoid: [number, number][] = []): PondLife {
	const items: PondItem[] = [];
	const clear = (x: number) => !avoid.some(([a, b]) => x > a && x < b);
	const span = (from: number, to = 1) => Math.min(1, Math.max(0, (fill - from) / (to - from)));

	// A stone for each year, counted along the near shore from the left; every fifth is larger.
	const stones = Math.min(years, MAX_YEARS);
	for (let k = 0; k < Math.ceil(stones); k++) {
		const a = Math.PI * (0.92 - (0.84 * k) / (MAX_YEARS - 1));
		const [x, y] = shorePoint(p, a, 9 + 3 * rnd(k, 91));
		const big = (k + 1) % 5 === 0;
		items.push({ kind: 'stone', x, y: y + 2, size: (big ? 7.6 : 4.6) + 1.8 * rnd(k, 92), alpha: fade(stones, k), flip: rnd(k, 93) > 0.5, seed: rnd(k, 94) });
	}

	// Reeds along the far bank, spread evenly but never in a row.
	const reeds = fill < ARRIVES.reeds ? 0 : 3 + (MAX_REEDS - 3) * span(ARRIVES.reeds);
	for (let k = 0; k < Math.ceil(reeds); k++) {
		const a = -Math.PI * (0.05 + 0.9 * frac(0.37 + k * GOLDEN));
		const [x, y] = shorePoint(p, a, 1);
		if (!clear(x)) continue;
		items.push({ kind: 'reed', x, y: y + 2, size: 30 + 24 * rnd(k, 95), alpha: fade(reeds, k), flip: rnd(k, 96) > 0.5, seed: rnd(k, 97) });
	}

	// The jetty reaches out from the left bank; the paper boat is moored at its end.
	const jettyIn = span(ARRIVES.jetty, ARRIVES.jetty + 0.06);
	const row = -0.4;
	const jx0 = p.cx - p.rx * Math.sqrt(1 - row * row) * shore(-Math.PI + 0.41) - 14;
	const jx1 = p.cx - p.rx * 0.4;
	const jy = p.cy + p.ry * row;
	const jetty = jettyIn > 0 ? { x0: jx0, x1: jx1, y: jy, alpha: jettyIn } : null;
	const boatIn = span(ARRIVES.boat, ARRIVES.boat + 0.05);
	if (boatIn > 0) items.push({ kind: 'boat', x: jx1 + 24, y: jy + 7, size: 17, alpha: boatIn, flip: false, seed: 0.3 });

	// Lily pads drift in the open water, away from the jetty and from where the drops land.
	const lilies = fill < ARRIVES.lilies ? 0 : 2 + (MAX_LILIES - 2) * span(ARRIVES.lilies);
	const blooming = span(ARRIVES.blooms, ARRIVES.blooms + 0.1);
	for (let k = 0; k < Math.ceil(lilies); k++) {
		const r = 0.28 + 0.5 * Math.sqrt(frac(0.21 + k * GOLDEN));
		const t = 0.25 + k * 2.39996;
		const ex = r * Math.cos(t);
		const ey = r * Math.sin(t) * 0.9 + 0.12;
		const x = p.cx + p.rx * ex;
		const y = p.cy + p.ry * ey;
		const nearJetty = x < jx1 + 44 && y < jy + 12;
		if (nearJetty || (ey < 0.1 && !clear(x))) continue;
		const size = 8.5 + 5 * rnd(k, 98);
		const alpha = fade(lilies, k);
		const flip = rnd(k, 99) > 0.5;
		const seed = rnd(k, 100);
		items.push({ kind: 'lily', x, y, size, alpha, flip, seed });
		// Every other pad flowers once the pond is nearly full; the flower opens over its pad.
		if (k % 2 === 0 && blooming > 0) items.push({ kind: 'bloom', x, y, size, alpha: alpha * blooming, flip, seed });
	}

	return { items, jetty, stage: pondStage(fill) };
}

/** The shore as SVG path data (for the postcards), `out` units beyond the water's edge. */
export function shorePath(p: Pond, out = 0, steps = 56): string {
	const pts: string[] = [];
	for (let k = 0; k < steps; k++) {
		const [x, y] = shorePoint(p, (k / steps) * Math.PI * 2 - Math.PI, out);
		pts.push(`${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`);
	}
	return `M${pts.join('L')}Z`;
}
