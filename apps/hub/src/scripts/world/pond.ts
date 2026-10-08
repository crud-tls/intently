/**
 * The pond, live: turns its description (src/world/pond.ts) into this frame's water, the things
 * living in it and the drops falling from the spring. The home page draws the worked example; the
 * Wealth hero redraws it from the visitor's own amount (src/scripts/feel/wealth.ts).
 */
import { pondAt, pondLife, pondRx, type PondKind } from '../../world/pond.ts';
import { SPOUT } from '../../world/props.ts';
import type { Sprite } from './atlas.ts';
import type { Frame } from './timeline.ts';

/** The sizes the pond's sprites are drawn at in the atlas (src/scripts/world/atlas.ts). */
export const POND_SPRITES: Record<PondKind | 'drop', number> = { reed: 40, lily: 10, bloom: 10, stone: 8, boat: 16, drop: 4.5 };

const isPondSprite = (kind?: string) => !!kind && kind in POND_SPRITES;

/** Where the pond is in this frame, so a chapter page can redraw it. */
export interface PondSite {
	cx: number;
	/** From its middle to the right edge of the screen: how much room the pond has. */
	room: number;
	/** The lowest ground under the pond's widest reach. */
	groundY: number;
	spring: { x: number; y: number; size: number } | null;
	walkerX: number;
}

export interface PondState {
	/** 0..1: how full (pondFill of the total). */
	fill: number;
	/** Half-width in units, at most; defaults to the width for the fill in the room there is. */
	rx?: number;
	/** Stones on the shore; may be fractional while it animates. */
	years: number;
	/** Drops in the air at once, and how many times a second each one falls. */
	drops: number;
	rate: number;
	/** If it grew: how many times the amount it would be (1 or less: no dashed shoreline). */
	grown: number;
	/** A gust, -1..1 (the frame's wind): the reeds lean away from it, as the grass does. */
	wind: number;
}

/** Puts the pond into the frame, replacing whatever pond was drawn before. */
export function drawPond(frame: Frame, sprites: Map<string, Sprite>, site: PondSite, s: PondState, time: number): void {
	frame.sprites = frame.sprites.filter((d) => !isPondSprite(d.kind));
	const p = pondAt(site.cx, site.groundY, Math.min(s.rx ?? Infinity, pondRx(s.rx ? 1 : s.fill, site.room)));
	frame.pond = [p.cx, p.cy, p.rx, p.ry];

	// The drops: from the spout's tip, in an arc, into the water.
	const sp = site.spring;
	let ring: [number, number, number, number] = [0, 0, 0, 0];
	const avoid: [number, number][] = [[site.walkerX - 38, site.walkerX + 38]];
	if (sp) {
		const tipX = sp.x + SPOUT[0] * sp.size;
		const tipY = sp.y + SPOUT[1] * sp.size;
		// Into open water: past the middle on a phone, where the spring stands close.
		const landX = Math.min(Math.max(tipX - sp.size * 0.9, p.cx + p.rx * 0.12), p.cx + p.rx * 0.7);
		const landY = p.cy - p.ry * 0.45;
		avoid.push([sp.x - sp.size * 0.8, sp.x + sp.size * 0.9], [landX - 16, landX + 16]);
		const drop = sprites.get('drop');
		if (drop && s.drops > 0) {
			for (let n = 0; n < s.drops; n++) {
				const t = (time * s.rate + n / s.drops) % 1;
				const vx = landX - tipX;
				const vy = 2 * t * (landY - tipY);
				frame.sprites.push({
					sprite: drop, kind: 'drop', front: true,
					x: tipX + vx * t,
					y: tipY + (landY - tipY) * t * t,
					scale: 0.85 + 0.25 * ((n * 7) % 3) / 2,
					// The tail trails behind the fall.
					tilt: (Math.atan2(-vx, vy + 1e-3) * 180) / Math.PI,
					alpha: Math.min(1, t * 10) * Math.min(1, (1 - t) * 12),
				});
			}
			// Rings leave the landing place once per drop, at a walking pace.
			const perSecond = s.rate * s.drops;
			ring = [landX, landY, Math.max(7, 24 / perSecond), (time * perSecond) % 1];
		}
	}

	const life = pondLife(p, s.fill, s.years, avoid);
	for (const it of life.items) {
		const sprite = sprites.get(it.kind);
		if (!sprite || it.alpha <= 0.01) continue;
		const scale = it.size / POND_SPRITES[it.kind];
		const ph = it.seed * 6.283;
		let { x, y } = it;
		let lean: number | undefined;
		let tilt: number | undefined;
		if (it.kind === 'reed') lean = Math.sin(time * 0.9 + ph) * 3 - s.wind * 9;
		else if (it.kind === 'lily' || it.kind === 'bloom') {
			x += Math.sin(time * 0.35 + ph) * 1.4;
			y += Math.sin(time * 0.8 + ph) * 0.5;
		} else if (it.kind === 'boat') {
			x += Math.sin(time * 0.3) * 4;
			y += Math.sin(time * 1.1) * 0.7;
			tilt = Math.sin(time * 0.9) * 3.5;
		}
		frame.sprites.push({ sprite, kind: it.kind, front: true, x, y, scale, flip: it.flip, lean, tilt, alpha: it.alpha });
	}

	frame.pondFx = {
		ring,
		jetty: life.jetty ? [life.jetty.x0, life.jetty.x1, life.jetty.y, life.jetty.alpha] : [0, 0, 0, 0],
		// The dashed shoreline encloses that many times the water: its width grows by the square root.
		grown: s.grown > 1.001 ? p.rx * Math.sqrt(Math.min(s.grown, 3)) : 0,
	};
}
