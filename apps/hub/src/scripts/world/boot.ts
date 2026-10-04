/**
 * Starts the live world on the home page. It runs only when the visitor hasn't asked for reduced
 * motion or to save data, and WebGL2 works; otherwise the static landscapes stay. It waits for the
 * first-visit splash, then: builds the sprite atlas, puts one fixed canvas behind the page, and
 * draws the day from the scroll position every frame. If frames are too slow it lowers the
 * resolution, and if that isn't enough it steps back to the static landscapes.
 */
import logo from '../../../public/brand/intently-logo.svg?raw';
import { SCENES } from '../../world/scenes.ts';
import { CHAPTERS } from '../../data/chapters.ts';
import { seeded } from '../lib/random.ts';
import { buildAtlas, markPoints } from './atlas.ts';
import { Renderer, MAX_POINTS, type PointCloud } from './renderer.ts';
import { frameAt } from './timeline.ts';
import { FrameBudget } from './budget.ts';

export const markInner = logo.replace(/^[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '').replace(/id="/g, 'id="w-');

export function canRun(): boolean {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
	if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
	if (new URLSearchParams(location.search).get('world') === 'static') return false;
	try {
		return !!document.createElement('canvas').getContext('webgl2');
	} catch {
		return false;
	}
}

function afterSplash(): Promise<void> {
	if (!document.documentElement.classList.contains('splashing')) return Promise.resolve();
	return new Promise((r) => document.addEventListener('intently:splash-done', () => r(), { once: true }));
}

export async function pointCloud(markInner: string): Promise<PointCloud> {
	const rand = seeded(4160);
	const star = new Float32Array(MAX_POINTS * 2);
	const seed = new Float32Array(MAX_POINTS);
	for (let i = 0; i < MAX_POINTS; i++) {
		star[i * 2] = rand();
		star[i * 2 + 1] = rand() ** 1.25;
		seed[i] = rand();
	}
	return { star, seed, mark: await markPoints(markInner, MAX_POINTS, rand) };
}

/** The static landscapes may load now: the world either runs or won't. */
const decided = () => document.documentElement.classList.remove('world-pending');

export async function start(): Promise<void> {
	try {
		await run();
	} finally {
		decided();
	}
}

async function run(): Promise<void> {
	if (!canRun()) return;
	await afterSplash();

	const root = document.documentElement;
	const scenes = SCENES.map((s) => document.querySelector<HTMLElement>(`[data-scene="${s.id}"]`));
	if (scenes.some((s) => !s)) return;
	const words = scenes.map((s) => s!.querySelector<HTMLElement>('.words'));
	const family = document.querySelector<HTMLElement>('.family-wrap');
	const constellation = document.querySelector<HTMLElement>('.constellation');
	const rail = new Map(CHAPTERS.map((c) => [c.id, document.querySelector<HTMLElement>(`[data-rail="${c.id}"]`)]));

	const [{ canvas: atlas, sprites }, cloud] = await Promise.all([buildAtlas(markInner), pointCloud(markInner)]);

	const canvas = document.createElement('canvas');
	canvas.className = 'world';
	canvas.setAttribute('aria-hidden', 'true');
	document.body.prepend(canvas);

	let renderer: Renderer;
	try {
		renderer = new Renderer(canvas, atlas, cloud);
	} catch (e) {
		canvas.remove();
		console.warn('[world] falling back to static landscapes:', e);
		return;
	}

	// The world is soft (gradients, glows, grain), so it needn't render at full device resolution.
	const coarse = matchMedia('(pointer: coarse)').matches;
	let dprCap = coarse ? 1 : 1.5;
	let onMeasure = () => {};
	let centers: number[] = [];
	let tops: number[] = [];
	let heights: number[] = [];
	const measure = () => {
		const y = scrollY;
		scenes.forEach((s, i) => {
			const r = s!.getBoundingClientRect();
			tops[i] = r.top + y;
			heights[i] = r.height;
			centers[i] = r.top + y + r.height / 2;
		});
		renderer.resize(canvas.clientWidth, canvas.clientHeight, Math.min(devicePixelRatio || 1, dprCap));
		// Keep the smooth scroller's idea of the page height in step (WebKit doesn't tell it).
		onMeasure();
	};

	const uAt = (y: number) => {
		const vc = y + innerHeight / 2;
		if (vc <= centers[0]) return 0;
		for (let i = 0; i < centers.length - 1; i++) {
			if (vc < centers[i + 1]) return i + (vc - centers[i]) / (centers[i + 1] - centers[i]);
		}
		return centers.length - 1;
	};

	const { default: Lenis } = await import('lenis');
	// The page grows when the world takes over (scenes get room to unfold); lay it out first, so the
	// smooth scroller below starts with the real height.
	root.classList.add('world-live');
	measure();

	// Smooth scrolling for wheels and trackpads; touch scrolling stays native. Anchor jumps (Start at
	// dawn, the day rail) are time-based, so they arrive on time even when frames are slow.
	const lenis = new Lenis({ autoRaf: false, anchors: { duration: 1.2 }, lerp: 0.09 });
	onMeasure = () => lenis.resize();
	const ro = new ResizeObserver(measure);
	ro.observe(document.body);
	addEventListener('resize', measure);
	document.fonts?.ready.then(measure);

	let running = true;
	let lastU = uAt(scrollY);
	let velocity = 0;
	let current = '';
	const budget = new FrameBudget();
	let lastDrawn = 0;
	let drewLastTick = false;
	let still = 0;
	const t0 = performance.now();

	// Read-only state for tests and debugging: what the world is drawing right now.
	// `hide` lets a test draw the scene without some sprites (to find exactly where they are).
	const state = { u: 0, scene: '', frames: 0, resting: false, zenith: '', walker: { x: 0, y: 0 }, scale: 1, hide: [] as string[] };
	(window as Window & { __intentlyWorld?: typeof state }).__intentlyWorld = state;

	const teardown = (why: string) => {
		running = false;
		lenis.destroy();
		ro.disconnect();
		canvas.remove();
		root.classList.remove('world-live');
		words.forEach((w) => w && (w.style.opacity = ''));
		console.warn('[world] back to static landscapes:', why);
	};

	canvas.addEventListener('webglcontextlost', (e) => {
		e.preventDefault();
		teardown('context lost');
	});

	const tick = (now: number) => {
		if (!running) return;
		requestAnimationFrame(tick);
		lenis.raf(now);
		if (document.hidden) {
			drewLastTick = false;
			return;
		}

		const y = scrollY;
		const u = uAt(y);
		velocity += (u - lastU - velocity) * 0.2;
		lastU = u;

		// Words fade in as their scene arrives and out as it leaves.
		const vc = y + innerHeight / 2;
		words.forEach((w, i) => {
			if (!w) return;
			const p = (vc - tops[i]) / heights[i];
			const o = i === 0 ? 1 - smoothstep(0.62, 0.86, p) : smoothstep(0.08, 0.24, p) * (1 - smoothstep(0.66, 0.86, p));
			const v = o.toFixed(3);
			if (w.style.opacity !== v) w.style.opacity = v;
		});

		// The day rail shows which hour it is.
		const nearest = SCENES[Math.round(u)]?.id;
		if (nearest !== current) {
			rail.forEach((a, id) => a && (id === nearest ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
			current = nearest;
		}

		state.u = u;
		state.scene = SCENES[Math.round(u)]?.id ?? '';

		// Once the app family covers the screen, the world can rest.
		state.resting = !!family && family.getBoundingClientRect().top <= 0;
		if (state.resting) {
			drewLastTick = false;
			return;
		}

		// When nothing moves, the clouds and stars can drift at half the frame rate.
		still = Math.abs(velocity) < 2e-5 ? still + 1 : 0;
		if (still > 30 && still % 2 === 1) return;

		const scale = innerHeight / 1000;
		let markRect: [number, number, number, number] | null = null;
		if (constellation) {
			const r = constellation.getBoundingClientRect();
			if (r.width > 0) markRect = [(r.left - innerWidth / 2) / scale, r.top / scale, r.width / scale, r.height / scale];
		}
		const cssH = canvas.clientHeight;
		const visW = (canvas.clientWidth / cssH) * 1000;
		const time = (now - t0) / 1000;
		const frame = frameAt({ u, visW, time, velocity, sprites, markRect: markRect && rescale(markRect, innerHeight, cssH) });
		const w = frame.sprites.find((d) => d.kind === 'walker');
		if (w) state.walker = { x: w.x, y: w.y };
		state.scale = cssH / 1000;
		if (state.hide.length) frame.sprites = frame.sprites.filter((d) => !state.hide.includes(d.kind ?? ''));
		renderer.render(frame, time);
		state.frames++;
		state.zenith = frame.sky.zenith;

		// Frame budget: decided early and once (see budget.ts).
		const decision = budget.frame(now - lastDrawn, drewLastTick && still <= 30, now - t0);
		lastDrawn = now;
		drewLastTick = true;
		if (decision === 'lower') {
			dprCap = Math.max(0.6, dprCap * 0.75);
			measure();
		} else if (decision === 'static') teardown('too slow');
	};
	requestAnimationFrame(tick);
}

/** The constellation is measured in viewport units; the canvas may be taller (100lvh). */
function rescale(r: [number, number, number, number], vh: number, ch: number): [number, number, number, number] {
	const k = vh / ch;
	return [r[0] * k, r[1] * k, r[2] * k, r[3] * k];
}

function smoothstep(a: number, b: number, x: number) {
	const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
	return t * t * (3 - 2 * t);
}
