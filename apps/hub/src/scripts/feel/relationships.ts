/**
 * Relationships: someone you love, their age and how often you see them. The visits ahead light
 * the path from the two figures on the hill towards the setting sun, nearest first, each one a
 * light. Without the live world, the still dots below the hero follow the same numbers.
 */
import { visitsLeft } from '../lib/math.ts';
import type { Feel } from '../world/chapter.ts';

const LIFESPAN = 85;
const MAX_DOTS = 2000;
const fmt = (n: number) => Math.round(n).toLocaleString('en');

export function mountRelationships(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="relationships"]');
	if (!root) return {};
	const age = root.querySelector<HTMLInputElement>('[data-their-age]')!;
	const per = root.querySelector<HTMLInputElement>('[data-per-year]')!;
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	let target = 0;
	let shown = 0;
	const dots = new Float32Array(MAX_DOTS * 4);

	const update = () => {
		const a = +age.value;
		const p = +per.value;
		target = visitsLeft(a, p, LIFESPAN);
		out('age').textContent = String(a);
		out('per').textContent = String(p);
		out('visits').textContent = fmt(target);
		root.dataset.visits = String(target);
		root.querySelector<HTMLElement>('[data-some]')!.hidden = target === 0;
		root.querySelector<HTMLElement>('[data-none]')!.hidden = target !== 0;
		redrawStill(doc, target);
	};
	age.addEventListener('input', update);
	per.addEventListener('input', update);
	update();

	return {
		busy: () => Math.abs(shown - target) > 0.5,
		patch(frame, { dt, time }) {
			shown += (target - shown) * Math.min(1, dt * 2.5);
			const n = Math.min(MAX_DOTS, Math.round(shown));
			if (n === 0) {
				frame.dots = null;
				return;
			}
			// From just past the two figures to the horizon under the sun, nearest visits first.
			const figures = frame.sprites.filter((d) => d.kind === 'walker' || d.kind === 'figure');
			const x0 = Math.max(...figures.map((d) => d.x)) + 50;
			const y0 = Math.max(...figures.map((d) => d.y)) + 4;
			const x1 = (frame.sky.sun.x - 0.5) * frame.visW;
			const y1 = frame.sky.sun.y * 1000 + 40;
			for (let k = 0; k < n; k++) {
				const t = (k + 0.5) / n;
				const e = Math.pow(t, 0.7);
				const o = k * 4;
				dots[o] = x0 + (x1 - x0) * e + Math.sin(e * Math.PI * 2.4) * 70 * (1 - e);
				dots[o + 1] = y0 + (y1 - y0) * Math.pow(e, 0.85);
				dots[o + 2] = 11 - 8.5 * e;
				dots[o + 3] = (1 - 0.45 * e) * (0.85 + 0.15 * Math.sin(time * 2 + k));
			}
			frame.dots = dots.subarray(0, n * 4);
			frame.dotColor = [1, 0.84, 0.58];
		},
	};
}

/** The still dots below the hero: one per visit (20 to a row). */
function redrawStill(doc: Document, n: number) {
	const svg = doc.querySelector<SVGSVGElement>('.feel svg.visits');
	if (!svg) return;
	const COLS = 20;
	const P = 22;
	const rows = Math.max(1, Math.ceil(n / COLS));
	svg.setAttribute('viewBox', `0 0 ${COLS * P} ${rows * P}`);
	svg.setAttribute('aria-label', `${n} dots, one for each visit ahead.`);
	const ns = 'http://www.w3.org/2000/svg';
	svg.replaceChildren(...Array.from({ length: n }, (_, i) => {
		const c = doc.createElementNS(ns, 'circle');
		c.setAttribute('cx', String((i % COLS) * P + P / 2));
		c.setAttribute('cy', String(Math.floor(i / COLS) * P + P / 2));
		c.setAttribute('r', String(P * 0.32));
		return c;
	}));
}
