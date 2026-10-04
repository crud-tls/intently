/**
 * The light of one day. Each chapter happens at one time of day; the home page passes through all
 * of them in order and the live renderer blends between neighbours. A sky has three stops
 * (zenith at the top, `upper` at 40% down, `horizon` at 66%), a sun and a moon placed in screen
 * fractions, and four ground layers from the far ridge to the foreground (src/world/terrain.ts).
 *
 * Text over the sky uses `ink`/`ink2`/`accent` and stays in the top 40% of a scene. Content below a
 * chapter's landscape sits on its foreground, the `soil`, in `soilInk`/`soilInk2`/`soilAccent`.
 * src/scripts/lib/sky.test.ts checks every pair against WCAG AA.
 */
import { mix } from '../scripts/lib/color.ts';

export type SkyKey = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'bluehour' | 'lantern';

export interface Orb {
	x: number;
	y: number;
	/** Radius as a fraction of the scene height. */
	r: number;
	/** 0 hidden … 1 fully there. */
	show: number;
}

export interface Sky {
	zenith: string;
	upper: string;
	horizon: string;
	sun: Orb & { core: string; glow: string; spread: number };
	moon: Orb;
	stars: number;
	/** Far ridge → foreground. */
	ground: [string, string, string, string];
	cloud: string;
	cloudOpacity: number;
	ink: string;
	ink2: string;
	accent: string;
	soilInk: string;
	soilInk2: string;
	soilAccent: string;
	/** The colour of light at this hour: the sun, a lamp, a star. */
	glow: string;
}

const NO_SUN = { x: 0.5, y: 1.2, r: 0.05, show: 0, core: '#FFFFFF', glow: '#FFFFFF', spread: 0.3 };
const NO_MOON = { x: 0.2, y: 0.25, r: 0.03, show: 0 };

export const SKY: Record<SkyKey, Sky> = {
	night: {
		zenith: '#050920', upper: '#10173A', horizon: '#2A2B58',
		sun: NO_SUN, moon: { x: 0.84, y: 0.2, r: 0.026, show: 0.9 }, stars: 1,
		ground: ['#242A50', '#1B1F42', '#131631', '#0A0B1E'],
		cloud: '#2A3060', cloudOpacity: 0.3,
		ink: '#F3EFE8', ink2: '#C3BDD8', accent: '#9CCBFF',
		soilInk: '#F3EFE8', soilInk2: '#B9B4CC', soilAccent: '#9CCBFF', glow: '#A9BEFF',
	},
	dawn: {
		zenith: '#222D66', upper: '#4E4E86', horizon: '#FFB487',
		sun: { x: 0.2, y: 0.62, r: 0.05, show: 1, core: '#FFF1D6', glow: '#FF9C6B', spread: 0.62 },
		moon: NO_MOON, stars: 0.3,
		ground: ['#B78AA0', '#8A6C93', '#5B4B76', '#2A2245'],
		cloud: '#F4A99C', cloudOpacity: 0.5,
		ink: '#FFF8F1', ink2: '#E9DDF0', accent: '#FFCFA3',
		soilInk: '#FFF8F1', soilInk2: '#DCCFE6', soilAccent: '#FFC79A', glow: '#FFB077',
	},
	morning: {
		zenith: '#5C9DD6', upper: '#97C5E8', horizon: '#F8E7C7',
		sun: { x: 0.32, y: 0.3, r: 0.045, show: 1, core: '#FFFBEA', glow: '#FFE7A3', spread: 0.42 },
		moon: NO_MOON, stars: 0,
		ground: ['#A9C2D3', '#7D9FB5', '#567C93', '#24394B'],
		cloud: '#FFFFFF', cloudOpacity: 0.72,
		ink: '#081626', ink2: '#0F2236', accent: '#0A3F78',
		soilInk: '#F2F6FA', soilInk2: '#C6D3DE', soilAccent: '#FFE6A0', glow: '#FFE6A0',
	},
	noon: {
		zenith: '#4596D8', upper: '#84C2EC', horizon: '#DAF0FA',
		sun: { x: 0.5, y: 0.09, r: 0.04, show: 1, core: '#FFFFFF', glow: '#FFF6C8', spread: 0.48 },
		moon: NO_MOON, stars: 0,
		ground: ['#A0C2C6', '#6FA085', '#457F55', '#1F4229'],
		cloud: '#FFFFFF', cloudOpacity: 0.9,
		ink: '#06121F', ink2: '#0C1D2E', accent: '#07325E',
		soilInk: '#F1F7F1', soilInk2: '#C3D6C7', soilAccent: '#FFF2B0', glow: '#FFF2B8',
	},
	afternoon: {
		zenith: '#79A9D2', upper: '#B7D0DF', horizon: '#F7D69B',
		sun: { x: 0.7, y: 0.32, r: 0.045, show: 1, core: '#FFF6DC', glow: '#FFCB6B', spread: 0.55 },
		moon: NO_MOON, stars: 0,
		ground: ['#CDB99A', '#C59A5C', '#9F6E35', '#46301A'],
		cloud: '#FFF4DE', cloudOpacity: 0.8,
		ink: '#0E1622', ink2: '#1A2433', accent: '#4A2A00',
		soilInk: '#FBF3E6', soilInk2: '#E0CDB2', soilAccent: '#FFCB6B', glow: '#FFCB6B',
	},
	dusk: {
		zenith: '#2C2F66', upper: '#6E4C78', horizon: '#FFA766',
		sun: { x: 0.8, y: 0.6, r: 0.06, show: 1, core: '#FFE3B8', glow: '#FF7F50', spread: 0.7 },
		moon: NO_MOON, stars: 0.15,
		ground: ['#8F5C7C', '#5F3F65', '#3B2A4B', '#1C1530'],
		cloud: '#E58A86', cloudOpacity: 0.55,
		ink: '#FFF5EE', ink2: '#EBD9E6', accent: '#FFC3A0',
		soilInk: '#FFF5EE', soilInk2: '#D8C6DA', soilAccent: '#FF9E7A', glow: '#FF9360',
	},
	bluehour: {
		zenith: '#0F1640', upper: '#252C63', horizon: '#6C70AA',
		sun: NO_SUN, moon: { x: 0.22, y: 0.3, r: 0.022, show: 0.55 }, stars: 0.55,
		ground: ['#4B5087', '#353B6C', '#232851', '#10133A'],
		cloud: '#3A4180', cloudOpacity: 0.35,
		ink: '#F5F2FB', ink2: '#D2CCEA', accent: '#FFD0B0',
		soilInk: '#F5F2FB', soilInk2: '#C4BEE0', soilAccent: '#C9B8FF', glow: '#BCC8FF',
	},
	lantern: {
		zenith: '#03061A', upper: '#0B1030', horizon: '#1E2448',
		sun: NO_SUN, moon: { x: 0.8, y: 0.17, r: 0.03, show: 1 }, stars: 1,
		ground: ['#1F2547', '#171C3A', '#10142C', '#080A1A'],
		cloud: '#1C2350', cloudOpacity: 0.25,
		ink: '#F3EFE8', ink2: '#C9C2B2', accent: '#F3C46A',
		soilInk: '#F3EFE8', soilInk2: '#BDB6A6', soilAccent: '#F3C46A', glow: '#F2B84B',
	},
};

export const SKY_KEYS = Object.keys(SKY) as SkyKey[];

/** Where the sky's three stops sit, top to bottom. */
export const SKY_STOPS = [0, 0.4, 0.66] as const;

/** CSS custom properties for a sky. */
export function skyVars(s: Sky): string {
	return [
		`--sky-top:${s.zenith}`, `--sky-upper:${s.upper}`, `--sky-horizon:${s.horizon}`,
		`--ink:${s.ink}`, `--ink2:${s.ink2}`, `--sky-accent:${s.accent}`, `--glow:${s.glow}`,
		`--soil:${s.ground[3]}`, `--soil-ink:${s.soilInk}`, `--soil-ink2:${s.soilInk2}`, `--soil-accent:${s.soilAccent}`,
	].join(';');
}

/**
 * On narrow screens the words fill the width of the sky, so a bright moon would sit behind the
 * title: it rides higher there, between the header and the words.
 */
export const NARROW_MOON_Y = 0.095;
export const isNarrow = (visibleWidth: number) => visibleWidth < 800;

/** Blend two skies (the live renderer does the same, frame by frame). */
export function blendSky(a: Sky, b: Sky, t: number): Sky {
	const c = (x: string, y: string) => mix(x, y, t);
	const n = (x: number, y: number) => x + (y - x) * t;
	// An orb that is absent on one side doesn't travel there: it fades where it is.
	const orb = <T extends Orb>(x: T, y: T): T => {
		const from = x.show > 0 ? x : y;
		const to = y.show > 0 ? y : x;
		return { ...from, x: n(from.x, to.x), y: n(from.y, to.y), r: n(from.r, to.r), show: n(x.show, y.show) };
	};
	const step = t < 0.5 ? a : b;
	return {
		zenith: c(a.zenith, b.zenith), upper: c(a.upper, b.upper), horizon: c(a.horizon, b.horizon),
		sun: { ...orb(a.sun, b.sun), core: c(a.sun.core, b.sun.core), glow: c(a.sun.glow, b.sun.glow), spread: n(a.sun.spread, b.sun.spread) },
		moon: orb(a.moon, b.moon),
		stars: n(a.stars, b.stars),
		ground: a.ground.map((g, i) => c(g, b.ground[i])) as Sky['ground'],
		cloud: c(a.cloud, b.cloud), cloudOpacity: n(a.cloudOpacity, b.cloudOpacity),
		// Text colours switch, never blend: a halfway grey fails on both skies.
		ink: step.ink, ink2: step.ink2, accent: step.accent,
		soilInk: step.soilInk, soilInk2: step.soilInk2, soilAccent: step.soilAccent,
		glow: c(a.glow, b.glow),
	};
}
