/**
 * The things in the world, drawn once here for both renderers. Each prop is SVG markup in its own
 * frame (anchor at 0,0: the point that stands on the ground) plus, for things that give off light,
 * a glow. The static landscape inlines the markup and paints the glow as a radial gradient; the
 * live world rasterises the markup into a sprite atlas and turns the glow into a real light.
 */
import { mix } from '../scripts/lib/color.ts';
import type { Sky, SkyKey } from '../data/sky.ts';
import type { PropKind } from './scenes.ts';

export interface Glow {
	x: number;
	y: number;
	r: number;
	color: string;
	strength: number;
}

export interface PropLook {
	body: string;
	/** Bounds of the body in its own frame: x0, y0, x1, y1. */
	box: [number, number, number, number];
	glow?: Glow;
}

export interface PropOptions {
	size: number;
	sky: Sky;
	skyKey: SkyKey;
	/** The land it stands on (its layer's colour). */
	land: string;
	lit?: boolean;
	/** Picks one of a few colours, for props that come in a set (notification dots). */
	variant?: number;
	/** How to draw the Intently figure: a <use> of a symbol, or the paths themselves. */
	mark: (x: number, y: number, size: number, style: string) => string;
}

/**
 * Half the width of what touches the ground (the figure's feet, a tent's hem), in units. A grounded
 * prop rests on the lowest ground under that base, so on a slope it never floats; the uphill side
 * meets the ground a little early instead, which reads as standing on it.
 */
export function baseHalfWidth(kind: PropKind, size: number): number {
	switch (kind) {
		case 'figure': return size * 0.25;
		case 'tent': return size * 0.72;
		case 'house': return size * 0.58;
		case 'spring': return size * 0.55;
		case 'fire': return size * 0.3;
		default: return 0;
	}
}

/** The y a prop with this base rests at: the lowest of the ground under its middle and its two ends. */
export function restY(ground: (x: number) => number, x: number, half: number): number {
	return half > 0 ? Math.max(ground(x - half), ground(x), ground(x + half)) : ground(x);
}

/** Where the spring's spout ends, as fractions of its size: the drops start here. */
export const SPOUT: [number, number] = [-0.44, -0.64];

export const WARM = '#FFB25C';
export const BLUE = '#8CC8FF';

/** How much the figure takes on the colour of the land at night, so it belongs in the scene. */
const FIGURE_DIM: Partial<Record<SkyKey, number>> = { night: 0.35, lantern: 0.3, bluehour: 0.3, dusk: 0.3 };
const DOTS = ['#FF6B6B', '#7C5CFF', '#2EB67D', '#FFA62B', '#3DA5F4', '#E84393'];

const n = (v: number) => Math.round(v * 10) / 10;

export function propLook(kind: PropKind, o: PropOptions): PropLook {
	const s = o.size;
	switch (kind) {
		case 'figure': {
			const dark = FIGURE_DIM[o.skyKey] ?? 0;
			const style = `--intently-light:${mix('#03A9F4', o.land, dark)};--intently-dark:${mix('#2196F3', o.land, dark)}`;
			// The mark's frame has 6% padding and its feet sit at 376/400.
			return { body: o.mark(-s / 2, -s * 0.94, s, style), box: [-s / 2, -s * 0.94, s / 2, s * 0.06] };
		}
		case 'tent': {
			const w = s * 0.85;
			const cloth = mix(o.land, o.sky.glow, 0.28);
			const door = o.lit ? '#FFC98A' : mix(o.land, '#000000', 0.3);
			return {
				body: `<path d="M${n(-w)} 2L0 ${-s}L${n(w)} 2Z" fill="${cloth}"/><path d="M${n(-s * 0.2)} 2L0 ${n(-s * 0.52)}L${n(s * 0.2)} 2Z" fill="${door}"/>`,
				box: [-w, -s, w, 2],
				glow: o.lit ? { x: 0, y: -s * 0.2, r: s * 1.6, color: WARM, strength: 0.55 } : undefined,
			};
		}
		case 'fire':
			return {
				body: `<path d="M0 0C${n(-s * 0.6)} ${n(-s * 0.5)} ${n(-s * 0.2)} ${-s} 0 ${n(-s * 1.3)}C${n(s * 0.2)} ${-s} ${n(s * 0.6)} ${n(-s * 0.5)} 0 0Z" fill="#FFB347"/><path d="M0 0C${n(-s * 0.3)} ${n(-s * 0.3)} ${n(-s * 0.1)} ${n(-s * 0.6)} 0 ${n(-s * 0.8)}C${n(s * 0.1)} ${n(-s * 0.6)} ${n(s * 0.3)} ${n(-s * 0.3)} 0 0Z" fill="#FFF0C2"/>`,
				box: [-s * 0.6, -s * 1.3, s * 0.6, 0],
				glow: { x: 0, y: -s * 0.4, r: s * 5, color: WARM, strength: 0.7 },
			};
		case 'phone':
			return {
				body: `<rect x="${n(-s * 0.3)}" y="${-s}" width="${n(s * 0.6)}" height="${s}" rx="${n(s * 0.12)}" fill="#EAF6FF"/>`,
				box: [-s * 0.3, -s, s * 0.3, 0],
				glow: { x: 0, y: -s / 2, r: s * 7, color: BLUE, strength: 0.75 },
			};
		case 'pill': {
			const w = s * 3.4;
			const dot = DOTS[(o.variant ?? 0) % DOTS.length];
			return {
				body: `<rect x="${n(-w / 2)}" y="${n(-s / 2)}" width="${n(w)}" height="${s}" rx="${n(s / 2)}" fill="#FFFFFF" opacity="0.94"/><circle cx="${n(-w / 2 + s / 2)}" r="${n(s * 0.26)}" fill="${dot}"/><rect x="${n(-w / 2 + s)}" y="${n(-s * 0.16)}" width="${n(w * 0.5)}" height="${n(s * 0.14)}" rx="${n(s * 0.07)}" fill="#1D2B3A" opacity="0.55"/>`,
				box: [-w / 2, -s / 2, w / 2, s / 2],
			};
		}
		case 'bird':
			return {
				body: `<path d="M${-s} 0Q${n(-s / 2)} ${n(-s * 0.55)} 0 0Q${n(s / 2)} ${n(-s * 0.55)} ${s} 0" fill="none" stroke="${o.sky.ground[3]}" stroke-width="${n(s * 0.2)}" stroke-linecap="round" opacity="0.8"/>`,
				box: [-s * 1.1, -s * 0.45, s * 1.1, s * 0.15],
			};
		case 'house': {
			const w = s * 1.3;
			const wall = mix(o.land, '#000000', 0.12);
			const win = o.lit ? `<rect x="${n(w * 0.05)}" y="${n(-s * 0.45)}" width="${n(s * 0.24)}" height="${n(s * 0.24)}" fill="#FFD38A"/>` : '';
			return {
				body: `<path d="M${n(-w / 2)} 4V${n(-s * 0.62)}L0 ${-s}L${n(w / 2)} ${n(-s * 0.62)}V4Z" fill="${wall}"/>${win}`,
				box: [-w / 2, -s, w / 2, 4],
				glow: o.lit ? { x: w * 0.15, y: -s * 0.32, r: s * 2.2, color: WARM, strength: 0.8 } : undefined,
			};
		}
		case 'lantern':
			return {
				body: `<path d="M${n(-s * 0.28)} ${n(-s * 0.15)}L${n(-s * 0.34)} ${n(-s * 0.6)}L${n(-s * 0.2)} ${n(-s * 0.85)}H${n(s * 0.2)}L${n(s * 0.34)} ${n(-s * 0.6)}L${n(s * 0.28)} ${n(-s * 0.15)}Z" fill="#FFD27A"/><rect x="${n(-s * 0.24)}" y="${-s}" width="${n(s * 0.48)}" height="${n(s * 0.15)}" rx="${n(s * 0.05)}" fill="#B7832C"/><rect x="${n(-s * 0.3)}" y="${n(-s * 0.18)}" width="${n(s * 0.6)}" height="${n(s * 0.14)}" rx="${n(s * 0.05)}" fill="#B7832C"/>`,
				box: [-s * 0.34, -s, s * 0.34, 0],
				glow: { x: 0, y: -s / 2, r: s * 9, color: WARM, strength: 0.65 },
			};
		case 'spring': {
			// A mossy rock with a bamboo spout propped on a forked stick: someone made this.
			const rock = mix(o.land, o.sky.ground[2], 0.5);
			const dark = mix(rock, '#000000', 0.15);
			const lit = mix(rock, o.sky.horizon, 0.3);
			const moss = mix(rock, '#7A9A3C', 0.55);
			const cane = mix('#D9C27A', o.land, 0.18);
			const caneDark = mix(cane, o.land, 0.5);
			const u = (v: number) => n(v * s);
			return {
				body: `<ellipse cx="${u(0.34)}" cy="${u(-0.3)}" rx="${u(0.46)}" ry="${u(0.38)}" fill="${dark}"/>`
					+ `<path d="M${u(-0.56)} ${u(0.04)}C${u(-0.64)} ${u(-0.3)} ${u(-0.42)} ${u(-0.74)} ${u(-0.04)} ${u(-0.8)}C${u(0.32)} ${u(-0.84)} ${u(0.58)} ${u(-0.5)} ${u(0.6)} ${u(0.04)}Z" fill="${rock}"/>`
					+ `<path d="M${u(-0.46)} ${u(-0.3)}C${u(-0.4)} ${u(-0.58)} ${u(-0.2)} ${u(-0.74)} 0 ${u(-0.76)}C${u(-0.16)} ${u(-0.66)} ${u(-0.3)} ${u(-0.5)} ${u(-0.36)} ${u(-0.26)}Z" fill="${lit}" opacity="0.6"/>`
					+ `<path d="M${u(-0.3)} ${u(-0.66)}C${u(-0.14)} ${u(-0.86)} ${u(0.2)} ${u(-0.88)} ${u(0.36)} ${u(-0.66)}C${u(0.2)} ${u(-0.75)} ${u(-0.12)} ${u(-0.75)} ${u(-0.3)} ${u(-0.66)}Z" fill="${moss}"/>`
					+ `<ellipse cx="${u(-0.5)}" cy="${u(-0.05)}" rx="${u(0.2)}" ry="${u(0.13)}" fill="${dark}"/>`
					+ `<path d="M${u(-0.31)} ${u(0.02)}L${u(-0.25)} ${u(-0.7)}M${u(-0.17)} ${u(0.02)}L${u(-0.25)} ${u(-0.7)}" stroke="${caneDark}" stroke-width="${u(0.035)}" stroke-linecap="round" fill="none"/>`
					+ `<path d="M${u(0.14)} ${u(-0.84)}L${u(-0.42)} ${u(-0.68)}" stroke="${cane}" stroke-width="${u(0.1)}" stroke-linecap="round"/>`
					+ `<path d="M${u(-0.07)} ${u(-0.832)}L${u(-0.042)} ${u(-0.736)}M${u(-0.266)} ${u(-0.776)}L${u(-0.238)} ${u(-0.68)}" stroke="${caneDark}" stroke-width="${u(0.022)}"/>`
					+ `<circle cx="${u(SPOUT[0])}" cy="${u(SPOUT[1] - 0.02)}" r="${u(0.035)}" fill="#DDF1FF"/>`,
				box: [-s * 0.72, -s * 0.94, s * 0.82, s * 0.2],
			};
		}
		case 'drop':
			// A teardrop with a glint; the anchor is the middle of its round end.
			return {
				body: `<path d="M0 ${n(-s * 1.8)}C${n(s * 0.5)} ${n(-s * 0.9)} ${s} ${n(-s * 0.35)} ${s} ${n(s * 0.1)}A${s} ${s} 0 0 1 ${-s} ${n(s * 0.1)}C${-s} ${n(-s * 0.35)} ${n(-s * 0.5)} ${n(-s * 0.9)} 0 ${n(-s * 1.8)}Z" fill="#DDF1FF"/>`
					+ `<circle cx="${n(-s * 0.32)}" cy="${n(s * 0.05)}" r="${n(s * 0.28)}" fill="#FFFFFF"/>`,
				box: [-s, -s * 1.9, s, s * 1.2],
			};
		case 'reed': {
			// A cattail: its height is the size; it stands at 0,0.
			const stem = mix(o.land, '#4E6B2E', 0.35);
			const head = mix(o.land, '#9A5A24', 0.55);
			const u = (v: number) => n(v * s);
			return {
				body: `<path d="M0 0C${u(-0.16)} ${u(-0.3)} ${u(-0.22)} ${u(-0.5)} ${u(-0.2)} ${u(-0.7)}C${u(-0.12)} ${u(-0.45)} ${u(-0.04)} ${u(-0.25)} ${u(0.04)} 0Z" fill="${stem}"/>`
					+ `<path d="M0 0C${u(0.1)} ${u(-0.2)} ${u(0.18)} ${u(-0.34)} ${u(0.22)} ${u(-0.5)}C${u(0.12)} ${u(-0.3)} ${u(0.06)} ${u(-0.14)} ${u(-0.03)} 0Z" fill="${stem}"/>`
					+ `<path d="M0 0Q${u(0.05)} ${u(-0.5)} 0 ${u(-0.98)}" stroke="${stem}" stroke-width="${Math.max(1.2, u(0.045))}" stroke-linecap="round" fill="none"/>`
					+ `<rect x="${u(-0.03)}" y="${u(-0.86)}" width="${u(0.1)}" height="${u(0.28)}" rx="${u(0.05)}" fill="${head}"/>`,
				box: [-s * 0.26, -s, s * 0.26, s * 0.02],
			};
		}
		case 'lily': {
			// A pad lying flat on the water, with its notch; the size is half its width.
			const pad = mix('#86A45A', o.land, 0.22);
			const rim = mix(pad, '#FFFFFF', 0.3);
			const ry = s * 0.4;
			const at = (deg: number) => `${n(s * Math.cos((deg * Math.PI) / 180))} ${n(ry * Math.sin((deg * Math.PI) / 180))}`;
			return {
				body: `<path d="M${at(-8)}A${s} ${n(ry)} 0 1 1 ${at(-38)}L0 0Z" fill="${pad}"/>`
					+ `<path d="M${at(200)}A${s} ${n(ry)} 0 0 1 ${at(262)}" stroke="${rim}" stroke-width="${n(s * 0.09)}" stroke-linecap="round" fill="none" opacity="0.75"/>`,
				box: [-s, -ry - 0.5, s, ry + 0.5],
			};
		}
		case 'bloom': {
			// The flower that opens on a pad (sized by its pad), seen from the side.
			const u = (v: number) => n(v * s);
			return {
				body: `<g transform="translate(${u(-0.15)} ${u(-0.18)})">`
					+ `<path d="M0 0C${u(-0.34)} ${u(-0.1)} ${u(-0.36)} ${u(-0.4)} ${u(-0.3)} ${u(-0.5)}C${u(-0.14)} ${u(-0.42)} ${u(-0.02)} ${u(-0.2)} 0 0Z" fill="#FFD3DC"/>`
					+ `<path d="M0 0C${u(0.34)} ${u(-0.1)} ${u(0.36)} ${u(-0.4)} ${u(0.3)} ${u(-0.5)}C${u(0.14)} ${u(-0.42)} ${u(0.02)} ${u(-0.2)} 0 0Z" fill="#FFD3DC"/>`
					+ `<path d="M0 0C${u(-0.2)} ${u(-0.24)} ${u(-0.14)} ${u(-0.5)} 0 ${u(-0.66)}C${u(0.14)} ${u(-0.5)} ${u(0.2)} ${u(-0.24)} 0 0Z" fill="#FFF6F2"/>`
					+ `<circle cy="${u(-0.1)}" r="${u(0.07)}" fill="#FFCB6B"/></g>`,
				box: [-s * 0.55, -s * 0.9, s * 0.25, s * 0.05],
			};
		}
		case 'stone': {
			// A pebble on the shore; the size is half its width.
			const stone = mix(o.land, o.sky.ground[1], 0.62);
			const lit = mix(stone, o.sky.horizon, 0.4);
			const u = (v: number) => n(v * s);
			return {
				body: `<path d="M${-s} 0C${-s} ${u(-0.7)} ${u(-0.5)} ${u(-1.05)} ${u(0.05)} ${-s}C${u(0.7)} ${u(-0.95)} ${s} ${u(-0.6)} ${s} 0Z" fill="${stone}"/>`
					+ `<path d="M${u(-0.6)} ${u(-0.5)}C${u(-0.45)} ${u(-0.82)} ${u(-0.1)} ${u(-0.9)} ${u(0.2)} ${u(-0.84)}C${u(-0.1)} ${u(-0.8)} ${u(-0.4)} ${u(-0.66)} ${u(-0.6)} ${u(-0.5)}Z" fill="${lit}" opacity="0.7"/>`,
				box: [-s, -s * 1.06, s, s * 0.02],
			};
		}
		case 'boat': {
			// A folded paper boat; the size is half its length and 0 is the waterline.
			const u = (v: number) => n(v * s);
			return {
				body: `<path d="M${u(-0.44)} ${u(-0.3)}L0 ${u(-1.05)}L${u(0.44)} ${u(-0.3)}Z" fill="#FFF8EA"/>`
					+ `<path d="M0 ${u(-1.05)}L${u(0.44)} ${u(-0.3)}L0 ${u(-0.3)}Z" fill="#E4D6BC"/>`
					+ `<path d="M${-s} ${u(-0.3)}L${s} ${u(-0.3)}L${u(0.5)} ${u(0.2)}L${u(-0.5)} ${u(0.2)}Z" fill="#FFF8EA"/>`
					+ `<path d="M${u(-0.8)} ${u(-0.1)}L${u(0.8)} ${u(-0.1)}L${u(0.5)} ${u(0.2)}L${u(-0.5)} ${u(0.2)}Z" fill="#E4D6BC"/>`,
				box: [-s, -s * 1.07, s, s * 0.22],
			};
		}
		case 'puff':
			// One breath of chimney smoke, in the colour of that hour's clouds.
			return {
				body: `<circle r="${s}" fill="${o.sky.cloud}" opacity="0.3"/><circle r="${n(s * 0.62)}" fill="${o.sky.cloud}" opacity="0.4"/>`,
				box: [-s, -s, s, s],
			};
		case 'firefly':
			return {
				body: `<circle r="${s}" fill="#FFF1B0"/>`,
				box: [-s, -s, s, s],
				glow: { x: 0, y: 0, r: s * 5, color: WARM, strength: 0.6 },
			};
	}
}
