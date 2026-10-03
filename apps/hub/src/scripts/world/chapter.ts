/**
 * The live world in a chapter page's hero: that hour's scene, alive (clouds drift, lights flicker),
 * with the chapter's interactive playing inside it. The visitor's controls always work; when the
 * world can't run (reduced motion, no WebGL2, a slow device) they drive the still example below
 * the hero instead.
 */
import { SCENES, type SceneId } from '../../world/scenes.ts';
import { buildAtlas, type Sprite } from './atlas.ts';
import { Renderer } from './renderer.ts';
import { frameAt, type Frame } from './timeline.ts';
import { FrameBudget } from './budget.ts';
import { canRun, markInner, pointCloud } from './boot.ts';

export interface FeelContext {
	time: number;
	dt: number;
	/** An element's box in world units (for drawing into a spot the page lays out). */
	toUnits: (r: DOMRect) => [number, number, number, number];
	/** The atlas, for adding sprites (a bird, a light). */
	sprites: Map<string, Sprite>;
}

export interface Feel {
	/** Adjust the frame for the visitor's input: the world's side of the interactive. */
	patch?(frame: Frame, ctx: FeelContext): void;
	/** Something is still moving (an animation the visitor started); keep drawing at full rate. */
	busy?(): boolean;
}

/** The world's state on this page, for tests and debugging. */
export interface HeroState {
	frames: number;
	live: boolean;
}

export async function startChapter(id: SceneId, feel: Feel): Promise<void> {
	const root = document.documentElement;
	const hero = document.querySelector<HTMLElement>('.hero');
	const state: HeroState = { frames: 0, live: false };
	(window as Window & { __intentlyHero?: HeroState }).__intentlyHero = state;
	if (!hero || !canRun()) return;

	const index = SCENES.findIndex((s) => s.id === id);
	const [{ canvas: atlas, sprites }, cloud] = await Promise.all([buildAtlas(markInner), pointCloud(markInner)]);
	const canvas = document.createElement('canvas');
	canvas.className = 'hero-world';
	canvas.setAttribute('aria-hidden', 'true');
	hero.prepend(canvas);

	let renderer: Renderer;
	try {
		renderer = new Renderer(canvas, atlas, cloud);
	} catch (e) {
		canvas.remove();
		console.warn('[world] chapter hero stays still:', e);
		return;
	}

	let dprCap = matchMedia('(pointer: coarse)').matches ? 1 : 1.5;
	const measure = () => renderer.resize(canvas.clientWidth, canvas.clientHeight, Math.min(devicePixelRatio || 1, dprCap));
	measure();
	const ro = new ResizeObserver(measure);
	ro.observe(hero);

	let visible = true;
	const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
	io.observe(hero);

	const budget = new FrameBudget();
	const t0 = performance.now();
	let last = t0;
	let drewLast = false;
	let lastDrawn = t0;
	let ticksSince = 0;
	let tick = 0;
	let running = true;

	const stop = (why: string) => {
		running = false;
		ro.disconnect();
		io.disconnect();
		canvas.remove();
		root.classList.remove('hero-live');
		state.live = false;
		console.warn('[world] chapter hero stays still:', why);
	};
	canvas.addEventListener('webglcontextlost', (e) => {
		e.preventDefault();
		stop('context lost');
	});

	const loop = (now: number) => {
		if (!running) return;
		requestAnimationFrame(loop);
		tick++;
		ticksSince++;
		if (!visible || document.hidden) {
			drewLast = false;
			return;
		}
		// The hero only drifts when nobody is touching it: half rate is plenty.
		if (!feel.busy?.() && tick % 2 === 1) return;

		const cssH = canvas.clientHeight;
		const visW = (canvas.clientWidth / cssH) * 1000;
		const scale = cssH / 1000;
		const top = canvas.getBoundingClientRect();
		const toUnits = (r: DOMRect): [number, number, number, number] => [
			(r.left - top.left - top.width / 2) / scale,
			(r.top - top.top) / scale,
			r.width / scale,
			r.height / scale,
		];
		const time = (now - t0) / 1000;
		const frame = frameAt({ u: index, visW, time, velocity: 0, sprites, markRect: null });
		feel.patch?.(frame, { time, dt: Math.min(0.1, (now - last) / 1000), toUnits, sprites });
		last = now;
		renderer.render(frame, time);
		state.frames++;
		if (!state.live) {
			state.live = true;
			root.classList.add('hero-live');
		}

		// Judge the time per display frame, whether we draw every frame or every other one.
		const decision = budget.frame((now - lastDrawn) / ticksSince, drewLast, now - t0);
		lastDrawn = now;
		ticksSince = 0;
		drewLast = true;
		if (decision === 'lower') {
			dprCap = Math.max(0.6, dprCap * 0.75);
			measure();
		} else if (decision === 'static') stop('too slow');
	};
	requestAnimationFrame(loop);
}
