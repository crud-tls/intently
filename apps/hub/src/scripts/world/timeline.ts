/**
 * Where the day is, given how far the visitor has scrolled. `u` runs through the scenes: 0 is the
 * night before (the prologue), 1 dawn (time) … 8 the night after (the finale). Everything the
 * renderer draws for a frame is decided here: the light, the camera, where the walker is, which
 * props are on screen and what they're doing.
 */
import { SKY, blendSky, isNarrow, NARROW_MOON_Y, type Sky } from '../../data/sky.ts';
import { LAYERS, LAKE_EDGE } from '../../world/terrain.ts';
import { SCENES, SPACING, type Placement } from '../../world/scenes.ts';
import { groundAt, type Lake } from './columns.ts';
import { baseHalfWidth, restY } from '../../world/props.ts';
import { spriteKey, type Sprite } from './atlas.ts';
import { hexToRgb, mix, type Rgb } from '../lib/color.ts';

export interface SpriteDraw {
	sprite: Sprite;
	x: number;
	y: number;
	scale: number;
	scaleY?: number;
	flip?: boolean;
	flipY?: boolean;
	tilt?: number;
	/** Shear about the base, in degrees: leaning without lifting a foot. */
	lean?: number;
	/** For things that stand on the land: which layer, and half the width of their base. */
	ground?: { layer: number; half: number };
	alpha: number;
	tint?: [number, number, number, number];
	blur?: number;
	/** Drawn behind the foreground (props on the far layers) or in front of it. */
	front: boolean;
	/** What it is, so a chapter page can adjust it (fade the notifications, brighten the lantern). */
	kind?: string;
}

export interface LightDraw {
	x: number;
	y: number;
	r: number;
	strength: number;
	color: Rgb;
	kind?: string;
}

export interface Frame {
	u: number;
	sky: Sky;
	cam: number;
	visW: number;
	lake: Lake | null;
	pond: [number, number, number, number] | null;
	sprites: SpriteDraw[];
	lights: LightDraw[];
	points: {
		gridMix: number;
		markMix: number;
		alpha: number;
		grid: [number, number, number, number];
		mark: [number, number, number, number];
		/** Weeks drawn (years x 52), how many are lived, and whether lived ones look different. */
		total: number;
		lived: number;
		livedOn: number;
	};
	/** Free-placed glowing dots: x, y, size, alpha (units). */
	dots?: Float32Array | null;
	dotColor?: Rgb;
	ripple: number;
}

const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
	return t * t * (3 - 2 * t);
};

const FIGURE_DIM: Record<string, number> = { night: 0.35, lantern: 0.3, bluehour: 0.3, dusk: 0.3 };
const IDX = Object.fromEntries(SCENES.map((s, i) => [s.id, i])) as Record<string, number>;

export function skyAt(u: number): Sky {
	const i = Math.min(Math.max(Math.floor(u), 0), SCENES.length - 1);
	const j = Math.min(i + 1, SCENES.length - 1);
	return blendSky(SKY[SCENES[i].sky], SKY[SCENES[j].sky], smooth(0.3, 0.7, u - i));
}

/** The walker's resting place in scene i, relative to the screen centre. */
function walkerHome(i: number, visW: number): { x: number; lean: number } {
	const p = SCENES[i].props.find((q) => q.kind === 'figure')!;
	return { x: (p.fx - 0.5) * visW + (p.dx ?? 0), lean: p.lean ?? 0 };
}

const WALKER_SIZE = 84;

/** Where the boardwalk is: across the lake, from one bank to the other (as the shader draws it). */
export const onBoardwalk = (x: number, lake: Lake | null) => !!lake && x > lake.a - LAKE_EDGE && x < lake.b + LAKE_EDGE;

/** Where the walker's feet are: the lowest ground under them, or the planks while over the lake. */
export function walkerFeetY(wx: number, cam: number, lake: Lake | null): number {
	const rest = restY((x) => groundAt(3, x, cam, lake), wx, baseHalfWidth('figure', WALKER_SIZE));
	return onBoardwalk(wx, lake) ? Math.min(rest, lake!.level - 6) : rest;
}

/** Screen x of a prop that belongs to scene i, with the camera at u. */
function placeX(p: Placement, i: number, u: number, visW: number, parallax: number): number {
	return (i - u) * SPACING * parallax + (p.fx - 0.5) * visW + (p.dx ?? 0);
}

export interface TimelineInput {
	u: number;
	visW: number;
	time: number;
	velocity: number;
	sprites: Map<string, Sprite>;
	/** Where the finale's constellation sits on screen, in units, if it's laid out. */
	markRect: [number, number, number, number] | null;
}

export function frameAt({ u, visW, time, velocity, sprites, markRect }: TimelineInput): Frame {
	const sky = skyAt(u);
	if (isNarrow(visW)) sky.moon = { ...sky.moon, y: Math.min(sky.moon.y, NARROW_MOON_Y) };
	const cam = u * SPACING;
	const half = visW / 2 + 260;
	const out: SpriteDraw[] = [];
	const lights: LightDraw[] = [];
	const near = (x: number) => x > -half && x < half;

	// Water first: the lake reshapes the foreground the walker stands on.
	let lake: Lake | null = null;
	let pond: Frame['pond'] = null;
	for (const [i, sc] of SCENES.entries()) {
		const w = sc.water;
		if (!w || Math.abs(u - i) > 1.6) continue;
		const off = (i - u) * SPACING;
		if (w.kind === 'lake') {
			lake = { a: off + (w.from - 0.5) * visW, b: off + (w.to - 0.5) * visW + (w.dx ?? 0), level: w.level * 1000 };
		} else {
			const cx = off + (w.from - 0.5) * visW;
			const rx = w.dx ?? 100;
			pond = [cx, groundAt(3, cx, cam, null) + 16, rx, rx * 0.15];
		}
	}

	const light = (x: number, y: number, look: Sprite, scale: number, alpha: number) => {
		const g = look.glow;
		if (!g || alpha <= 0.01) return;
		lights.push({ x: x + g.x * scale, y: y + g.y * scale, r: g.r * scale, strength: g.strength * alpha, color: hexToRgb(g.color), kind: look.kind });
	};

	// ——— The walker ———
	const i0 = Math.min(Math.max(Math.floor(u), 0), SCENES.length - 1);
	const i1 = Math.min(i0 + 1, SCENES.length - 1);
	const f = smooth(0.15, 0.85, u - i0);
	const a = walkerHome(i0, visW);
	const b = walkerHome(i1, visW);
	const wx = a.x + (b.x - a.x) * f;
	// Walking is squash and stretch about the feet (never a hop), so the walker stays on the ground.
	const stride = cam / 38;
	const running = Math.max(0, 1 - Math.abs(u - IDX.health) / 0.8);
	const moving = Math.min(1, Math.abs(velocity) * 40 + 0.15);
	const squash = Math.abs(Math.sin(stride)) * (0.025 + running * 0.04) * moving;
	const wy = walkerFeetY(wx, cam, lake);
	const dim = FIGURE_DIM[SCENES[i0].sky] ?? 0;
	const dim1 = FIGURE_DIM[SCENES[i1].sky] ?? 0;
	const dimAmt = dim + (dim1 - dim) * smooth(0.3, 0.7, u - i0);
	const tintRgb = hexToRgb(sky.ground[3]);
	const walkerTint: [number, number, number, number] = [...tintRgb, dimAmt];
	const walker = sprites.get('walker')!;
	const wScale = 1 + squash * 0.4;
	const wScaleY = (1 - squash) / wScale;
	const lean = a.lean + (b.lean - a.lean) * f + Math.sin(stride) * 2.5 * moving;
	out.push({
		sprite: walker, x: wx, y: wy, scale: wScale, scaleY: wScaleY, lean, alpha: 1, tint: walkerTint, front: true, kind: 'walker',
		ground: { layer: 3, half: baseHalfWidth('figure', WALKER_SIZE) },
	});

	// Its reflection in the lake: blurred while the visitor hurries, sharp when they slow down.
	if (lake && wy < lake.level + 4 && wx > lake.a - 140 && wx < lake.b + 200) {
		const ry = 2 * lake.level - wy;
		const blur = Math.min(4, 0.6 + Math.abs(velocity) * 260);
		out.push({ sprite: walker, x: wx, y: ry, scale: wScale, flipY: true, alpha: 0.45, tint: [...hexToRgb(mix(sky.horizon, sky.ground[2], 0.45)), 0.35 + dimAmt * 0.5], blur, front: true });
	}

	// ——— Everything else, scene by scene ———
	for (const [i, sc] of SCENES.entries()) {
		const d = u - i;
		if (Math.abs(d) > 1.6) continue;
		const weight = Math.max(0, 1 - Math.abs(d) / 0.7);
		const firstFigure = sc.props.findIndex((p) => p.kind === 'figure');
		sc.props.forEach((p, k) => {
			if (k === firstFigure) return;
			const look = sprites.get(spriteKey(sc.id, k));
			if (!look) return;
			const layer = p.layer ?? 3;
			const par = p.layer === undefined ? 0.3 : LAYERS[layer].parallax;
			let x = placeX(p, i, u, visW, par);
			let y = p.layer === undefined
				? (p.y ?? 0.5) * 1000
				: restY((gx) => groundAt(layer, gx, cam, layer === 3 ? lake : null), x, baseHalfWidth(p.kind, p.size)) - (p.y ?? 0);
			let alpha = 1;
			let scaleY: number | undefined;
			const front = layer === 3;

			switch (p.kind) {
				// Things the walker carries come with the walker.
				case 'phone':
				case 'lantern': {
					const home = walkerHome(i, visW);
					x = wx + ((p.fx - 0.5) * visW + (p.dx ?? 0) - home.x);
					y = wy - (p.y ?? 0);
					alpha = weight;
					if (p.kind === 'lantern') y += Math.sin(time * 1.3) * 1.5;
					break;
				}
				// Notifications crowd in as the morning arrives, then lift away as birds.
				case 'pill': {
					const home = walkerHome(i, visW);
					const ox = (p.fx - 0.5) * visW + (p.dx ?? 0) - home.x;
					// Placed by height above the walker, so they stay below the words on any screen.
					const oy = wy - 70 - (0.8 - (p.y ?? 0.5)) * 600;
					const gather = smooth(-0.95, -0.35, d);
					const scatter = smooth(0.08, 0.6, d);
					x = wx + ox * (1 + (1 - gather) * 2.5) + Math.sin(time * 1.1 + k) * 6;
					y = oy - (1 - gather) * 140 - scatter * 520 + Math.cos(time * 0.9 + k * 1.7) * 5;
					alpha = gather * (1 - scatter);
					const bird = sprites.get('bird')!;
					const ba = smooth(0.15, 0.4, d) * (1 - smooth(0.9, 1.4, d));
					if (ba > 0.01) {
						out.push({ sprite: bird, x: x + Math.sin(k) * 40 * scatter, y: y - 30, scale: 0.9, scaleY: 0.6 + 0.4 * Math.sin(time * 9 + k), alpha: ba, front: true });
					}
					break;
				}
				case 'bird':
					x += time * 14 * ((k % 2) + 1);
					x = ((x + half) % (2 * half) + 2 * half) % (2 * half) - half;
					scaleY = 0.55 + 0.45 * Math.sin(time * 8 + k * 2);
					break;
				case 'firefly':
					x += Math.sin(time * 0.6 + k * 2.1) * 16;
					y += Math.cos(time * 0.8 + k * 1.3) * 12;
					alpha = 0.55 + 0.45 * Math.sin(time * 2 + k * 3);
					break;
				case 'fire':
					scaleY = 0.92 + 0.12 * Math.sin(time * 11 + Math.sin(time * 7));
					break;
				case 'spring':
					// Drops fall from the rock into the pond, one after another.
					for (let n = 0; n < 4; n++) {
						const t = (time * 0.55 + n / 4) % 1;
						const s = p.size;
						const dx = -s * 0.4 - t * s * 0.9;
						const dy = -s * 0.7 + t * t * s * 0.75;
						out.push({ sprite: sprites.get('drop')!, x: x + dx, y: y + dy, scale: 1, alpha: Math.min(1, (1 - t) * 4), front: true });
					}
					break;
			}

			if (!near(x) || alpha <= 0.01) return;
			const isFigure = p.kind === 'figure';
			out.push({
				sprite: look, x, y, scale: 1, scaleY, flip: p.flip, tilt: p.tilt, lean: p.lean, alpha, front,
				tint: isFigure ? walkerTint : undefined, kind: p.kind,
				ground: p.layer !== undefined && baseHalfWidth(p.kind, p.size) > 0 ? { layer: p.layer, half: baseHalfWidth(p.kind, p.size) } : undefined,
			});
			light(x, y, look, 1, alpha * (p.kind === 'fire' ? 0.85 + 0.15 * Math.sin(time * 13) : 1));
		});
	}

	// The walker's lights (phone, lantern) are already in the list via their props.
	lights.sort((p, q) => q.strength - p.strength);

	// ——— Stars that become weeks at dawn, and the mark at the end ———
	const wide = visW > 900;
	const gw = wide ? Math.min(visW * 0.42, 620) : visW * 0.86;
	const gh = gw * (52 / 80);
	const grid: [number, number, number, number] = [wide ? visW * 0.24 - gw / 2 : -gw / 2, wide ? 90 : 110, gw, gh];
	// The mark keeps its shape: a square around the constellation, however the lights are laid out.
	let mark: [number, number, number, number] = [-150, 150, 300, 300];
	if (markRect) {
		const side = Math.min(Math.max(markRect[2], markRect[3]), visW * 0.86, 380);
		mark = [markRect[0] + markRect[2] / 2 - side / 2, markRect[1] + markRect[3] / 2 - side / 2, side, side];
	}
	const tIdx = IDX.time;
	const fIdx = IDX.finale;
	const timeAlpha = smooth(tIdx - 0.75, tIdx - 0.4, u) * (1 - smooth(tIdx + 0.1, tIdx + 0.55, u));
	const finAlpha = smooth(fIdx - 0.75, fIdx - 0.4, u);
	const points = {
		gridMix: u < fIdx - 1 ? smooth(tIdx - 0.65, tIdx - 0.05, u) : 0,
		markMix: smooth(fIdx - 0.45, fIdx - 0.02, u),
		alpha: Math.max(timeAlpha * (wide ? 1 : 0.6), finAlpha * 0.6),
		grid,
		mark,
		total: 80 * 52,
		lived: 80 * 52,
		livedOn: 0,
	};

	return { u, sky, cam, visW, lake, pond, sprites: out, lights: lights.slice(0, 8), points, ripple: Math.min(1, Math.abs(velocity) * 30) };
}
