/**
 * Draws a scene of the day as a standalone SVG: the "postcard" shown without WebGL, with reduced
 * motion, and in chapter-page heroes. Pure (no DOM), so it runs at build time; served as static
 * files by src/pages/world/[file].svg.ts. The live renderer draws the same world from the same
 * terrain maths, palettes and scenes.
 */
import { SKY, SKY_STOPS, isNarrow, NARROW_MOON_Y, type Sky } from '../data/sky.ts';
import { mix } from '../scripts/lib/color.ts';
import { seeded } from '../scripts/lib/random.ts';
import { LAYERS, ridge, treeAt, pineHalfWidth, shoreY, LAKE_EDGE, type Layer } from './terrain.ts';
import { SPACING, VARIANTS, type Placement, type Scene, type Variant } from './scenes.ts';
import { propLook, baseHalfWidth, restY, BLUE } from './props.ts';

const H = 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;

interface Ctx {
	s: Sky;
	scene: Scene;
	W: number;
	vis: number;
	cx: number;
	id: string;
}

/** Scene x of a composition fraction. */
const fxToX = (c: Ctx, fx: number) => c.cx + (fx - 0.5) * c.vis;

/** Layer-x (in 1600-unit widths) at scene x. */
const layerX = (c: Ctx, L: Layer, x: number) => (c.scene.cam * SPACING * L.parallax + (x - c.cx)) / 1600;

function lakeEnds(c: Ctx): [number, number] | null {
	const w = c.scene.water;
	if (!w || w.kind !== 'lake') return null;
	return [fxToX(c, w.from), fxToX(c, w.to) + (w.dx ?? 0)];
}

function groundY(c: Ctx, i: number, x: number): number {
	const L = LAYERS[i];
	const y = ridge(L, layerX(c, L, x)) * H;
	const ends = i === 3 ? lakeEnds(c) : null;
	return ends ? shoreY(y, x, ends[0], ends[1], c.scene.water!.level * H) : y;
}

function layerPath(c: Ctx, i: number): string {
	const step = i === 0 ? 8 : i === 3 ? 14 : 12;
	const pts: string[] = [];
	for (let x = -step; x <= c.W + step; x += step) pts.push(`${Math.round(x)} ${r1(groundY(c, i, x))}`);
	return `M${pts.join('L')}L${c.W + step} ${H + 10}L${-step} ${H + 10}Z`;
}

function pinePath(x: number, y: number, h: number): string {
	// Tip, then each tier's wide edge and its tuck-in, down both sides, to the ground.
	const pts: [number, number][] = [[0, 0]];
	for (let k = 1; k <= 3; k++) {
		const d = (k * h) / 3;
		pts.push([pineHalfWidth(h, d - 0.001), d]);
		if (k < 3) pts.push([pineHalfWidth(h, d), d]);
	}
	const right = pts.map(([w, d]) => `${r1(x + w)} ${r1(y - h + d)}`);
	const left = pts.slice(1).reverse().map(([w, d]) => `${r1(x - w)} ${r1(y - h + d)}`);
	return `M${right.join('L')}L${r1(x)} ${r1(y + 4)}L${left.join('L')}Z`;
}

function trees(c: Ctx, i: number): string {
	const L = LAYERS[i];
	if (!L.trees) return '';
	const cell = L.trees.cell;
	const lo = Math.floor(layerX(c, L, -40) / cell);
	const hi = Math.ceil(layerX(c, L, c.W + 40) / cell);
	let d = '';
	for (let k = lo; k <= hi; k++) {
		const t = treeAt(L, k);
		if (!t) continue;
		const x = (t.x * 1600 - c.scene.cam * SPACING * L.parallax) + c.cx;
		d += pinePath(x, t.y * H, t.h * H);
	}
	return d;
}

function stars(c: Ctx): string {
	if (c.s.stars <= 0.02) return '';
	const rand = seeded(7 + c.scene.cam * 13);
	const n = Math.round((c.W / 1000) * 90);
	let out = '';
	for (let k = 0; k < n; k++) {
		const x = rand() * c.W;
		const y = rand() ** 1.3 * 0.62 * H;
		const r = 0.7 + rand() ** 3 * 2;
		const o = (0.35 + rand() * 0.65) * c.s.stars;
		out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#FFF8EC" opacity="${o.toFixed(2)}"/>`;
	}
	return out;
}

function orbs(c: Ctx): string {
	const { sun, moon } = c.s;
	let out = '';
	if (moon.show > 0) {
		const x = fxToX(c, moon.x);
		const y = moon.y * H;
		const r = moon.r * H;
		out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 5)}" fill="url(#${c.id}-moonglow)" opacity="${moon.show}"/>`;
		out += `<mask id="${c.id}-crescent"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#fff"/><circle cx="${r1(x + r * 0.42)}" cy="${r1(y - r * 0.18)}" r="${r1(r * 0.86)}" fill="#000"/></mask>`;
		out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#F6F1E4" opacity="${moon.show}" mask="url(#${c.id}-crescent)"/>`;
	}
	if (sun.show > 0) {
		const x = fxToX(c, sun.x);
		const y = sun.y * H;
		out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(sun.spread * H)}" fill="url(#${c.id}-sunglow)" opacity="${sun.show}"/>`;
		out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(sun.r * H)}" fill="${sun.core}" opacity="${sun.show}"/>`;
	}
	return out;
}

function clouds(c: Ctx): string {
	if (c.s.cloudOpacity <= 0.05) return '';
	const rand = seeded(31 + c.scene.cam * 7);
	const n = Math.max(2, Math.round(c.W / 520));
	let out = `<g filter="url(#${c.id}-soft)" fill="${c.s.cloud}" opacity="${c.s.cloudOpacity}">`;
	for (let k = 0; k < n; k++) {
		const x = rand() * c.W;
		const y = (0.1 + rand() * 0.32) * H;
		const w = 70 + rand() * 120;
		for (let p = 0; p < 4; p++) {
			const dx = (p - 1.5) * w * 0.42 + (rand() - 0.5) * 20;
			const ry = w * (0.16 + rand() * 0.12) * (p === 1 || p === 2 ? 1.35 : 1);
			out += `<ellipse cx="${r1(x + dx)}" cy="${r1(y - ry * 0.3)}" rx="${r1(w * 0.42)}" ry="${r1(ry)}"/>`;
		}
	}
	return out + '</g>';
}


function at(c: Ctx, p: Placement): { x: number; y: number } {
	const x = fxToX(c, p.fx) + (p.dx ?? 0);
	if (p.layer === undefined) return { x, y: (p.y ?? 0.5) * H };
	const layer = p.layer;
	return { x, y: restY((gx) => groundY(c, layer, gx), x, baseHalfWidth(p.kind, p.size)) - (p.y ?? 0) };
}

/** Where a scene's prop stands in a postcard (for tests: grounded things must touch the ground). */
export function propAnchor(scene: Scene, variant: Variant, index: number): { x: number; y: number; ground: (x: number) => number } {
	const { width: W, visible } = VARIANTS[variant];
	const c: Ctx = { s: SKY[scene.sky], scene, W, vis: visible, cx: W / 2, id: 'test' };
	const p = scene.props[index];
	return { ...at(c, p), ground: (gx) => groundY(c, p.layer ?? 3, gx) };
}

function prop(c: Ctx, p: Placement, index: number): string {
	const { x, y } = at(c, p);
	const look = propLook(p.kind, {
		size: p.size,
		sky: c.s,
		skyKey: c.scene.sky,
		land: c.s.ground[p.layer ?? 3],
		lit: p.lit,
		variant: index,
		mark: (mx, my, size, style) => `<use href="#mark" x="${r1(mx)}" y="${r1(my)}" width="${size}" height="${size}" style="${style}"/>`,
	});
	const glow = look.glow
		? `<circle cx="${r1(look.glow.x)}" cy="${r1(look.glow.y)}" r="${r1(look.glow.r)}" fill="url(#${c.id}-${look.glow.color === BLUE ? 'blue' : 'warm'})" opacity="${look.glow.strength}"/>`
		: '';
	// The spring's drops are animated in the live world; here they hang in mid-fall.
	const drops = p.kind === 'spring'
		? [0.15, 0.35, 0.55, 0.75].map((t) => `<circle cx="${r1(-p.size * 0.4 - t * p.size * 0.9)}" cy="${r1(-p.size * 0.7 + t * t * p.size * 0.75)}" r="${r1(p.size * 0.06)}" fill="#DDF1FF"/>`).join('')
		: '';
	const flip = p.flip ? ' scale(-1 1)' : '';
	const tilt = p.tilt ? ` rotate(${p.tilt})` : '';
	const lean = p.lean ? ` skewX(${-p.lean})` : '';
	return `<g transform="translate(${r1(x)} ${r1(y)})${tilt}${lean}${flip}">${glow}${look.body}${drops}</g>`;
}

function propsOn(c: Ctx, layer: number | undefined): string {
	return c.scene.props.map((p, i) => (p.layer === layer ? prop(c, p, i) : '')).join('');
}

function pond(c: Ctx): string {
	const w = c.scene.water;
	if (!w || w.kind !== 'pond') return '';
	const cx = fxToX(c, w.from);
	const cy = groundY(c, 3, cx) + 16;
	const rx = w.dx ?? 100;
	return `<ellipse cx="${r1(cx)}" cy="${r1(cy - 2)}" rx="${r1(rx + 6)}" ry="${r1(rx * 0.15 + 4)}" fill="${mix(c.s.ground[3], c.s.ground[2], 0.5)}"/>`
		+ `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(rx * 0.15)}" fill="url(#${c.id}-water)"/>`
		+ `<ellipse cx="${r1(cx + rx * 0.35)}" cy="${r1(cy)}" rx="${r1(rx * 0.18)}" ry="${r1(rx * 0.03)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2"/>`
		+ `<ellipse cx="${r1(cx + rx * 0.35)}" cy="${r1(cy)}" rx="${r1(rx * 0.32)}" ry="${r1(rx * 0.055)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2"/>`;
}

function lake(c: Ctx): string {
	const w = c.scene.water;
	if (!w || w.kind !== 'lake') return '';
	const L = w.level * H;
	const tint = mix(c.s.horizon, c.s.ground[2], 0.45);
	const ripples = Array.from({ length: 9 }, (_, k) => {
		const y = L + 10 + k * k * 2.2;
		const x0 = fxToX(c, w.from) + ((k * 137) % 200);
		return `<rect x="${r1(x0)}" y="${r1(y)}" width="${r1(c.vis * (0.15 + ((k * 53) % 30) / 100))}" height="1.6" fill="#FFFFFF" opacity="${(0.18 - k * 0.012).toFixed(3)}"/>`;
	}).join('');
	const [a, b] = lakeEnds(c)!;
	const x0 = Math.max(0, a - LAKE_EDGE);
	const x1 = Math.min(c.W, b + LAKE_EDGE);
	return `<clipPath id="${c.id}-lakeclip"><rect x="${r1(x0)}" y="${L}" width="${r1(x1 - x0)}" height="${H - L + 20}"/></clipPath>`
		+ `<rect x="${r1(x0)}" y="${L}" width="${r1(x1 - x0)}" height="${H - L + 20}" fill="${tint}"/>`
		+ `<g clip-path="url(#${c.id}-lakeclip)"><g transform="translate(0 ${2 * L}) scale(1 -1)" opacity="0.62" filter="url(#${c.id}-ripple)">`
		+ `<use href="#${c.id}-sky"/><use href="#${c.id}-orbs"/><use href="#${c.id}-l0"/><use href="#${c.id}-l1"/><use href="#${c.id}-l2"/>`
		+ `</g></g>${ripples}`
		+ boardwalk(c, x0, x1, L);
}

/** Planks across the lake, just above the water, with a post every 80 units (as the live world draws them). */
function boardwalk(c: Ctx, x0: number, x1: number, level: number): string {
	const wood = mix(c.s.ground[3], c.s.ground[2], 0.35);
	const top = level - 6;
	const a = lakeEnds(c)![0];
	let posts = '';
	for (let x = a + 40 - 80 * Math.ceil((a + 40 - x0) / 80); x < x1; x += 80) posts += `<rect x="${r1(x - 2.5)}" y="${r1(top)}" width="5" height="${r1(level + 26 - top)}"/>`;
	return `<g fill="${wood}"><rect x="${r1(x0)}" y="${r1(top)}" width="${r1(x1 - x0)}" height="5"/>${posts}</g>`;
}

/** The SVG for one scene, composed for a wide screen or a tall phone. */
export function renderScene(scene: Scene, variant: Variant, markInner: string): string {
	const { width: W, visible } = VARIANTS[variant];
	const base = SKY[scene.sky];
	const s = isNarrow(visible) ? { ...base, moon: { ...base.moon, y: Math.min(base.moon.y, NARROW_MOON_Y) } } : base;
	const id = `${scene.id}-${variant}`;
	const c: Ctx = { s, scene, W, vis: visible, cx: W / 2, id };
	const [, upperAt, horizonAt] = SKY_STOPS;
	const layer = (i: number) => {
		const t = trees(c, i);
		return `<g id="${id}-l${i}" fill="${s.ground[i]}"><path d="${layerPath(c, i)}"/>${t ? `<path d="${t}"/>` : ''}</g>`;
	};

	const defs = `<defs>
<symbol id="mark" viewBox="0 0 400 400">${markInner}</symbol>
<linearGradient id="${id}-skyg" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${s.zenith}"/><stop offset="${upperAt}" stop-color="${s.upper}"/><stop offset="${horizonAt}" stop-color="${s.horizon}"/><stop offset="1" stop-color="${s.horizon}"/></linearGradient>
<radialGradient id="${id}-sunglow"><stop offset="0" stop-color="${s.sun.core}" stop-opacity="0.95"/><stop offset="0.07" stop-color="${s.sun.glow}" stop-opacity="0.7"/><stop offset="0.3" stop-color="${s.sun.glow}" stop-opacity="0.22"/><stop offset="1" stop-color="${s.sun.glow}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-moonglow"><stop offset="0" stop-color="#E8EEFF" stop-opacity="0.35"/><stop offset="1" stop-color="#E8EEFF" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-warm"><stop offset="0" stop-color="#FFD38A" stop-opacity="0.9"/><stop offset="0.3" stop-color="#FFB25C" stop-opacity="0.35"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-blue"><stop offset="0" stop-color="#CFEAFF" stop-opacity="0.9"/><stop offset="0.35" stop-color="#8CC8FF" stop-opacity="0.3"/><stop offset="1" stop-color="#8CC8FF" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.horizon}" stop-opacity="0"/><stop offset="0.55" stop-color="${s.horizon}" stop-opacity="0.42"/><stop offset="1" stop-color="${s.horizon}" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(s.zenith, s.ground[3], 0.35)}"/><stop offset="0.6" stop-color="${mix(s.upper, s.ground[2], 0.25)}"/><stop offset="1" stop-color="${s.horizon}"/></linearGradient>
<filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="${id}-ripple" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.09" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="14" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.8 2"/></filter>
<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.45"/></filter>
</defs>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${defs}`
		+ `<rect id="${id}-sky" width="${W}" height="${H}" fill="url(#${id}-skyg)"/>`
		+ stars(c)
		+ `<g id="${id}-orbs">${orbs(c)}</g>`
		+ clouds(c)
		+ layer(0) + propsOn(c, 0)
		+ `<rect y="${0.5 * H}" width="${W}" height="${0.3 * H}" fill="url(#${id}-haze)"/>`
		+ layer(1) + propsOn(c, 1)
		+ layer(2) + propsOn(c, 2)
		+ lake(c)
		+ layer(3) + pond(c) + propsOn(c, 3)
		+ propsOn(c, undefined)
		+ `<rect width="${W}" height="${H}" filter="url(#${id}-grain)" opacity="0.5" style="mix-blend-mode:overlay"/>`
		+ '</svg>';
}
