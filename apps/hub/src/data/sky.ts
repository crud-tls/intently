/**
 * The skies of one day. Each chapter happens under one of them; the home page passes through all
 * of them in order. `top` is the sky overhead, `bottom` the horizon. Text colours (`ink`, `ink2`)
 * and `accent` (focus rings, links) are chosen to read on both, and on the dimmed version that
 * bright skies get in dark mode (src/scripts/lib/sky.test.ts checks every pair).
 */
import { dim, mix } from '../scripts/lib/color.ts';

export type SkyKey = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'bluehour' | 'lantern';

export interface Sky {
	top: string;
	bottom: string;
	ink: string;
	ink2: string;
	accent: string;
	/** The colour of light in this sky: the sun, a lamp, a star. */
	glow: string;
	/** Bright skies are dimmed for visitors in dark mode; night skies are already dark. */
	bright: boolean;
}

export const SKY: Record<SkyKey, Sky> = {
	night: { top: '#0A0F2C', bottom: '#231E48', ink: '#F3EFE8', ink2: '#BDB7D3', accent: '#9CCBFF', glow: '#A9BEFF', bright: false },
	dawn: { top: '#F2BCA8', bottom: '#FCE4CB', ink: '#2A1912', ink2: '#543A2E', accent: '#9A3A22', glow: '#FFB077', bright: true },
	morning: { top: '#BFE0F2', bottom: '#F1F6F7', ink: '#11202B', ink2: '#364D5C', accent: '#0F5AA8', glow: '#FFE6A0', bright: true },
	noon: { top: '#8FCBEF', bottom: '#E4F3FB', ink: '#0C1B27', ink2: '#2A4051', accent: '#0A4C88', glow: '#FFF2B8', bright: true },
	afternoon: { top: '#EDCD92', bottom: '#FBF1DC', ink: '#291C0A', ink2: '#554223', accent: '#7E4300', glow: '#FFCB6B', bright: true },
	dusk: { top: '#EE9A74', bottom: '#F8C9A2', ink: '#2A110B', ink2: '#482419', accent: '#701A35', glow: '#FF9360', bright: true },
	bluehour: { top: '#1E2853', bottom: '#4B4779', ink: '#F5F2FB', ink2: '#D2CCEA', accent: '#FFD0B0', glow: '#BCC8FF', bright: false },
	lantern: { top: '#05081A', bottom: '#11172F', ink: '#F3EFE8', ink2: '#C2BBAA', accent: '#F3C46A', glow: '#F2B84B', bright: false },
};

export const SKY_KEYS = Object.keys(SKY) as SkyKey[];

/** A sky as seen in dark mode. */
export function dimmed(key: SkyKey): Sky {
	const s = SKY[key];
	return s.bright ? { ...s, top: dim(s.top), bottom: dim(s.bottom) } : s;
}

/** CSS custom properties for a sky, as a declaration list. */
export function skyVars(s: Sky): string {
	return `--sky-top:${s.top};--sky-bottom:${s.bottom};--ink:${s.ink};--ink2:${s.ink2};--accent:${s.accent};--glow:${s.glow}`;
}

/**
 * The background for one band of the day on the home page: it starts halfway from the previous
 * sky, holds its own sky through the middle (where the text sits), and ends halfway to the next,
 * so stacked bands read as one continuous day without any script.
 */
export function band(prev: SkyKey, cur: SkyKey, next: SkyKey, dark = false): string {
	const get = dark ? dimmed : (k: SkyKey) => SKY[k];
	const [p, c, n] = [get(prev), get(cur), get(next)];
	const start = prev === cur ? c.top : mix(p.bottom, c.top, 0.5);
	const end = next === cur ? c.bottom : mix(c.bottom, n.top, 0.5);
	return `linear-gradient(180deg, ${start} 0%, ${c.top} 22%, ${c.bottom} 76%, ${end} 100%)`;
}
