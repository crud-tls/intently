/**
 * Health: breathe with the sun, a box breath of four counts in, hold, out, hold, and see what
 * everyday steps add up to: each marathon's worth a marker on the hills.
 */
import { kmPerYear, marathons, STRIDE_M } from '../lib/math.ts';
import { groundAt } from '../world/columns.ts';
import type { Feel } from '../world/chapter.ts';

const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'] as const;
const COUNT = 4;
const ROUNDS = 4;
const MAX_MARKERS = 120;

export function mountHealth(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="health"]');
	if (!root) return {};
	const button = root.querySelector<HTMLButtonElement>('[data-pace]')!;
	const cue = root.querySelector<HTMLElement>('[data-cue]')!;
	const steps = root.querySelector<HTMLInputElement>('[data-steps]')!;
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	let startedAt = 0;
	let running = false;
	let lungs = 0;
	let say = '';
	let marks = 0;

	const stop = (finished: boolean) => {
		running = false;
		button.textContent = 'Breathe with the sun';
		button.setAttribute('aria-pressed', 'false');
		say = finished ? 'Four rounds. Notice how you feel.' : '';
		cue.textContent = say;
		root.dataset.breathing = 'false';
	};
	button.addEventListener('click', () => {
		if (running) return stop(false);
		running = true;
		startedAt = performance.now();
		button.textContent = 'Stop';
		button.setAttribute('aria-pressed', 'true');
		root.dataset.breathing = 'true';
	});

	const update = () => {
		const s = +steps.value;
		const km = kmPerYear(s);
		marks = Math.round(marathons(km));
		out('steps').textContent = s.toLocaleString('en');
		out('day').textContent = ((s * STRIDE_M) / 1000).toLocaleString('en', { maximumFractionDigits: 1 });
		out('year').textContent = Math.round(km).toLocaleString('en');
		out('marathons').textContent = String(marks);
		root.dataset.marathons = String(marks);
		for (const [k, v] of [['steps', s.toLocaleString('en')], ['day', ((s * STRIDE_M) / 1000).toLocaleString('en', { maximumFractionDigits: 1 })], ['year', Math.round(km).toLocaleString('en')], ['marathons', String(marks)]]) {
			const el = doc.querySelector<HTMLElement>(`.feel [data-tally="${k}"]`);
			if (el) el.textContent = v;
		}
	};
	steps.addEventListener('input', update);
	update();

	// The breath runs on its own clock (with or without the live world).
	const step = (now: number) => {
		if (running) {
			const t = (now - startedAt) / 1000;
			const phase = Math.floor(t / COUNT) % 4;
			const left = COUNT - Math.floor(t % COUNT);
			if (t >= COUNT * 4 * ROUNDS) stop(true);
			else {
				const text = `${PHASES[phase]}… ${left}`;
				if (text !== say) cue.textContent = say = text;
				root.dataset.phase = String(phase);
				const k = (t % COUNT) / COUNT;
				lungs = phase === 0 ? k : phase === 1 ? 1 : phase === 2 ? 1 - k : 0;
			}
		} else lungs += (0 - lungs) * 0.05;
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);

	return {
		busy: () => running,
		patch(frame, { time }) {
			// The sun breathes with you.
			const e = lungs * lungs * (3 - 2 * lungs);
			frame.sky = { ...frame.sky, sun: { ...frame.sky.sun, r: frame.sky.sun.r * (1 + e * 0.35), spread: frame.sky.sun.spread * (1 + e * 0.45) } };
			// A marker for each marathon's worth of walking, along the hills ahead.
			const n = Math.min(MAX_MARKERS, marks);
			if (n === 0) {
				frame.dots = null;
				return;
			}
			const dots = new Float32Array(n * 4);
			const left = -frame.visW * 0.48;
			const span = frame.visW * 0.96;
			for (let k = 0; k < n; k++) {
				const x = left + (span * (k + 0.5)) / n;
				dots[k * 4] = x;
				dots[k * 4 + 1] = groundAt(3, x, frame.cam, frame.lake) - 6;
				dots[k * 4 + 2] = 7;
				dots[k * 4 + 3] = 0.8 + 0.2 * Math.sin(time * 2 + k);
			}
			frame.dots = dots;
			frame.dotColor = [1, 0.95, 0.7];
		},
	};
}
