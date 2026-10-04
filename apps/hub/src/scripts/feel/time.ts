/**
 * Time: your age and a life length (an assumption) become a frame of weeks. In the live hero the
 * weeks fill the dawn sky; without it, the still grid below the hero redraws.
 */
import { lifeWeeks, weeksLived } from '../lib/math.ts';
import type { Feel } from '../world/chapter.ts';

const fmt = (n: number) => Math.round(n).toLocaleString('en');

export function mountTime(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="time"]');
	if (!root) return {};
	const age = root.querySelector<HTMLInputElement>('[data-age]')!;
	const life = root.querySelector<HTMLInputElement>('[data-life]')!;
	const stage = root.querySelector<HTMLElement>('[data-stage]')!;
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	let target = weeksLived(+age.value);
	let shown = 0;
	let total = lifeWeeks(+life.value);

	const update = () => {
		const a = +age.value;
		const l = +life.value;
		target = weeksLived(a);
		total = lifeWeeks(l);
		out('age').textContent = String(a);
		out('life').textContent = String(l);
		out('lived').textContent = fmt(Math.min(target, total));
		out('ahead').textContent = fmt(Math.max(0, total - target));
		root.querySelector<HTMLElement>('[data-past]')!.hidden = a < l;
		root.querySelector<HTMLElement>('[data-ahead-line]')!.hidden = a >= l;
		stage.style.aspectRatio = `${l} / 52`;
		redrawStill(doc, target, total);
	};
	age.addEventListener('input', update);
	life.addEventListener('input', update);
	update();

	return {
		busy: () => Math.abs(shown - target) > 0.5,
		patch(frame, { dt, toUnits }) {
			// The lived weeks fill in, quickly at first and gently at the end.
			shown += (target - shown) * Math.min(1, dt * 3.2);
			const r = stage.getBoundingClientRect();
			const grid = toUnits(r);
			frame.points = { gridMix: 1, markMix: 0, alpha: 1, grid, mark: grid, total, lived: Math.min(shown, total), livedOn: 1 };
		},
	};
}

/** Without the live world, the still frame of weeks below the hero shows the same numbers. */
function redrawStill(doc: Document, lived: number, total: number) {
	const svg = doc.querySelector<SVGSVGElement>('.feel svg.weeks');
	if (!svg) return;
	const P = 10;
	const left = 34;
	const rows = Math.ceil(total / 52);
	const full = Math.floor(Math.min(lived, total) / 52);
	const rest = Math.min(lived, total) % 52;
	svg.setAttribute('viewBox', `0 0 ${left + 52 * P} ${rows * P + 4}`);
	svg.querySelector('[data-ahead]')?.setAttribute('height', String(rows * P));
	svg.querySelector('[data-lived]')?.setAttribute('height', String(full * P));
	const r = svg.querySelector('[data-lived-rest]');
	r?.setAttribute('y', String(full * P));
	r?.setAttribute('width', String(rest * P));
	const now = svg.querySelector('[data-now]');
	now?.setAttribute('cx', String(left + rest * P + P / 2));
	now?.setAttribute('cy', String(full * P + P / 2));
	now?.toggleAttribute('hidden', lived >= total);
	svg.setAttribute('aria-label', `${total.toLocaleString('en')} weeks in a ${total / 52}-year life, ${Math.min(lived, total).toLocaleString('en')} of them lived.`);
}
