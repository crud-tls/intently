/**
 * Every prop in the day, rasterised once into one texture. The drawings are the same SVG markup the
 * static landscapes use (src/world/props.ts), so a tent here is the tent there.
 */
import { SKY } from '../../data/sky.ts';
import { SCENES, type PropKind } from '../../world/scenes.ts';
import { propLook, type Glow } from '../../world/props.ts';

export interface Sprite {
	/** UV rectangle in the atlas. */
	u0: number;
	v0: number;
	u1: number;
	v1: number;
	/** Bounds in units, relative to the anchor. */
	box: [number, number, number, number];
	glow?: Glow;
	kind: PropKind;
}

/** Atlas key for a prop: scene id + its index in that scene. */
export const spriteKey = (scene: string, index: number) => `${scene}:${index}`;

const PX_PER_UNIT = 3;
const PAD = 4;

export async function buildAtlas(markInner: string): Promise<{ canvas: HTMLCanvasElement; sprites: Map<string, Sprite> }> {
	const entries: { key: string; kind: PropKind; svg: string; box: [number, number, number, number]; glow?: Glow }[] = [];
	const add = (key: string, kind: PropKind, scene: (typeof SCENES)[number], size: number, layer: number, lit?: boolean, variant = 0) => {
		const look = propLook(kind, {
			size,
			sky: SKY[scene.sky],
			skyKey: scene.sky,
			land: SKY[scene.sky].ground[layer],
			lit,
			variant,
			// Drawn bright; the renderer tints the figure towards the land at night.
			mark: (x, y, s) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 400 400">${markInner}</svg>`,
		});
		const [x0, y0, x1, y1] = look.box;
		const w = x1 - x0;
		const h = y1 - y0;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * PX_PER_UNIT)}" height="${Math.ceil(h * PX_PER_UNIT)}" viewBox="${x0} ${y0} ${w} ${h}">${look.body}</svg>`;
		entries.push({ key, kind, svg, box: look.box, glow: look.glow });
	};

	for (const scene of SCENES) {
		scene.props.forEach((p, i) => add(spriteKey(scene.id, i), p.kind, scene, p.size, p.layer ?? 3, p.lit, i));
	}
	// The walker and the spring's drops, drawn once.
	const noon = SCENES.find((s) => s.sky === 'noon')!;
	add('walker', 'figure', noon, 84, 3);
	add('drop', 'drop', noon, 4, 3);
	add('bird', 'bird', noon, 12, 3);

	const images = await Promise.all(entries.map(async (e) => {
		const img = new Image();
		img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(e.svg)}`;
		await img.decode();
		return img;
	}));

	// Shelf packing, tallest first.
	const order = entries.map((_, i) => i).sort((a, b) => images[b].height - images[a].height);
	const W = 2048;
	let x = 0;
	let y = 0;
	let shelf = 0;
	const at: { x: number; y: number }[] = [];
	for (const i of order) {
		const img = images[i];
		if (x + img.width + PAD > W) {
			x = 0;
			y += shelf + PAD;
			shelf = 0;
		}
		at[i] = { x, y };
		x += img.width + PAD;
		shelf = Math.max(shelf, img.height);
	}
	const H = 1 << Math.ceil(Math.log2(y + shelf + PAD));
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;
	const sprites = new Map<string, Sprite>();
	entries.forEach((e, i) => {
		const img = images[i];
		ctx.drawImage(img, at[i].x, at[i].y);
		sprites.set(e.key, {
			u0: at[i].x / W,
			v0: at[i].y / H,
			u1: (at[i].x + img.width) / W,
			v1: (at[i].y + img.height) / H,
			box: e.box,
			glow: e.glow,
			kind: e.kind,
		});
	});
	return { canvas, sprites };
}

/** Points sampled inside the mark, normalised to 0..1, for the stars to gather into. */
export async function markPoints(markInner: string, count: number, rand: () => number): Promise<Float32Array> {
	const S = 160;
	const img = new Image();
	img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 400 400">${markInner}</svg>`)}`;
	await img.decode();
	const c = document.createElement('canvas');
	c.width = c.height = S;
	const ctx = c.getContext('2d', { willReadFrequently: true })!;
	ctx.drawImage(img, 0, 0);
	const data = ctx.getImageData(0, 0, S, S).data;
	const inside: number[] = [];
	for (let i = 0; i < S * S; i++) if (data[i * 4 + 3] > 140) inside.push(i);
	const out = new Float32Array(count * 2);
	for (let k = 0; k < count; k++) {
		const i = inside[Math.floor(rand() * inside.length)];
		out[k * 2] = ((i % S) + rand()) / S;
		out[k * 2 + 1] = (Math.floor(i / S) + rand()) / S;
	}
	return out;
}
