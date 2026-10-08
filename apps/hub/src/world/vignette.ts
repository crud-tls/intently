/**
 * A strip of an hour's landscape, small enough to sit behind an app's name: three ridges in that
 * sky's ground colours, a few pines, and one sign of what happens there (the birds of the morning,
 * the pond, the house with its light on). Not a crop of the real scene, which is far too wide for
 * a strip, but drawn from the same noise and palette, so it belongs to the same world.
 *
 * Pure (no DOM): the hub inlines it at build time. The strip is WIDTH wide and anchored to its right
 * edge (preserveAspectRatio xMaxYMax slice), so on a phone the right-hand part shows at full size.
 */
import { SKY } from '../data/sky.ts';
import { fbm, rnd } from './terrain.ts';
import { scene as getScene, type SceneId } from './scenes.ts';
import { mix } from '../scripts/lib/color.ts';

export const VIGNETTE_WIDTH = 1400;

interface Band {
	seed: number;
	/** Where its ridge rests and how tall its hills get, as shares of the strip's height. */
	base: number;
	amp: number;
	/** Pixels per hill. */
	wave: number;
	ridged: number;
}

const BANDS: Band[] = [
	{ seed: 23, base: 0.42, amp: 0.36, wave: 520, ridged: 0.5 },
	{ seed: 37, base: 0.61, amp: 0.2, wave: 360, ridged: 0 },
	{ seed: 51, base: 0.79, amp: 0.1, wave: 640, ridged: 0 },
];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** The ridge of band i at x (pixels from the strip's left), for a strip `height` tall. */
function ridgeY(i: number, x: number, height: number, cam: number): number {
	const b = BANDS[i];
	const n = fbm(x / b.wave + cam * 3.7 + i * 11.3, b.seed, 3, b.ridged) - 0.5;
	return height * (b.base - n * b.amp * 2);
}

/** Where the nearest ground is, `fromRight` pixels in from the strip's right edge (to stand something on it). */
export function vignetteGround(id: SceneId, height: number, fromRight: number): number {
	return ridgeY(2, VIGNETTE_WIDTH - fromRight, height, getScene(id).cam);
}

function ridgePath(i: number, height: number, cam: number): string {
	const step = i === 0 ? 14 : 18;
	const pts: string[] = [];
	for (let x = 0; x <= VIGNETTE_WIDTH + step; x += step) pts.push(`${x} ${r1(ridgeY(i, x, height, cam))}`);
	return `M${pts.join('L')}V${height}H0Z`;
}

/** A few pines on the middle ridge, in patches, more of them towards the left (the right is for the sign). */
function pines(height: number, cam: number): string {
	let d = '';
	for (let k = 0; k < 46; k++) {
		const seed = k + cam * 97;
		if (rnd(seed, 71) > 0.42) continue;
		const x = (k + rnd(seed, 72)) * (VIGNETTE_WIDTH / 46);
		const h = height * (0.16 + 0.14 * rnd(seed, 73));
		const y = ridgeY(1, x, height, cam) + 2;
		const w = h * 0.3;
		d += `M${r1(x)} ${r1(y - h)}L${r1(x + w)} ${r1(y)}H${r1(x - w)}Z`;
	}
	return d;
}

/** One sign of the hour, at the right of the strip; `u` is a unit that scales with the strip. */
function sign(id: SceneId, height: number, cam: number): string {
	const s = SKY[getScene(id).sky];
	const u = height / 80;
	const right = (px: number) => VIGNETTE_WIDTH - px * u;
	const near = (px: number) => ridgeY(2, right(px), height, cam);
	const mid = (px: number) => ridgeY(1, right(px), height, cam);
	const bird = (x: number, y: number, size: number) =>
		`<path d="M${r1(x - size)} ${r1(y)}q${r1(size / 2)} ${r1(-size * 0.55)} ${r1(size)} 0q${r1(size / 2)} ${r1(-size * 0.55)} ${r1(size)} 0" fill="none" stroke="${s.ground[3]}" stroke-width="${r1(1.3 * u)}" stroke-linecap="round" opacity="0.75"/>`;
	switch (id) {
		case 'time':
			return bird(right(250), height * 0.2, 7 * u) + bird(right(222), height * 0.3, 5 * u);
		case 'attention':
			return bird(right(300), height * 0.16, 6 * u) + bird(right(268), height * 0.26, 4.5 * u) + bird(right(236), height * 0.12, 5 * u);
		case 'health':
			return bird(right(330), height * 0.22, 5 * u);
		case 'wealth': {
			// The pond, catching the light.
			const x = right(210);
			const y = Math.max(near(180), near(210), near(240)) + 5.5 * u;
			return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(30 * u)}" ry="${r1(3.6 * u)}" fill="${mix(s.upper, s.horizon, 0.6)}"/>`
				+ `<path d="M${r1(x + 22 * u)} ${r1(y - 3 * u)}v${r1(-12 * u)}M${r1(x + 27 * u)} ${r1(y - 2 * u)}v${r1(-9 * u)}" stroke="${s.ground[3]}" stroke-width="${r1(1.3 * u)}" stroke-linecap="round"/>`;
		}
		case 'relationships': {
			// The house, with someone's light left on.
			const x = right(240);
			const y = mid(240) + 3;
			const w = 15 * u;
			const wall = mix(s.ground[2], '#000000', 0.15);
			return `<circle cx="${r1(x)}" cy="${r1(y - 7 * u)}" r="${r1(24 * u)}" fill="#FFB25C" opacity="0.28"/>`
				+ `<path d="M${r1(x - w)} ${r1(y)}v${r1(-11 * u)}l${r1(w)} ${r1(-8 * u)}l${r1(w)} ${r1(8 * u)}v${r1(11 * u)}Z" fill="${wall}"/>`
				+ `<rect x="${r1(x + 2 * u)}" y="${r1(y - 9 * u)}" width="${r1(5 * u)}" height="${r1(5 * u)}" fill="#FFD38A"/>`;
		}
		case 'self': {
			// Still water between the hills, holding the moon's light.
			const y = height * 0.7;
			return `<rect x="${r1(right(520))}" y="${r1(y)}" width="${r1(520 * u)}" height="${r1(height - y)}" fill="${mix(s.horizon, s.ground[2], 0.45)}"/>`
				+ `<rect x="${r1(right(330))}" y="${r1(y + 5 * u)}" width="${r1(70 * u)}" height="${r1(1.4 * u)}" fill="#FFFFFF" opacity="0.3"/>`
				+ `<rect x="${r1(right(300))}" y="${r1(y + 10 * u)}" width="${r1(40 * u)}" height="${r1(1.4 * u)}" fill="#FFFFFF" opacity="0.2"/>`;
		}
		case 'faith': {
			// A lantern on the near hill.
			const x = right(230);
			const y = near(230);
			return `<circle cx="${r1(x)}" cy="${r1(y - 8 * u)}" r="${r1(40 * u)}" fill="url(#vg-warm-${id})"/>`
				+ `<rect x="${r1(x - 2.5 * u)}" y="${r1(y - 11 * u)}" width="${r1(5 * u)}" height="${r1(7 * u)}" rx="${r1(1.2 * u)}" fill="#FFD27A"/>`;
		}
		default:
			return '';
	}
}

/** The strip for a scene, `height` pixels tall: an <svg> to lay along the bottom of a piece of its sky. */
export function vignette(id: SceneId, height: number): string {
	const sc = getScene(id);
	const s = SKY[sc.sky];
	const cam = sc.cam;
	const hazy = mix(s.ground[1], s.horizon, 0.35);
	const defs = id === 'faith'
		? `<defs><radialGradient id="vg-warm-${id}"><stop offset="0" stop-color="#FFD38A" stop-opacity="0.75"/><stop offset="0.3" stop-color="#FFB25C" stop-opacity="0.3"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient></defs>`
		: '';
	// The lake of the blue hour lies between the middle ridge and the near one.
	const water = id === 'self' ? sign(id, height, cam) : '';
	const front = id === 'self' ? '' : sign(id, height, cam);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIGNETTE_WIDTH} ${height}" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">${defs}`
		+ `<path d="${ridgePath(0, height, cam)}" fill="${hazy}"/>`
		+ `<path d="${ridgePath(1, height, cam)}${pines(height, cam)}" fill="${s.ground[2]}"/>`
		+ water
		+ `<path d="${ridgePath(2, height, cam)}" fill="${s.ground[3]}"/>`
		+ front
		+ '</svg>';
}
