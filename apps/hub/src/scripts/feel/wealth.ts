/**
 * Wealth: a small daily amount, simply set aside. Each drop from the spring is a day and each stone
 * on the shore a year; the pond is as wide as the total, and things come to live in it as it fills
 * (src/world/pond.ts). Growth is an optional illustration (before inflation and fees, not advice):
 * it only draws a dashed shoreline further out, and the main number never includes it.
 */
import { setAside, withGrowth } from '../lib/math.ts';
import { pondFill, pondStage } from '../../world/pond.ts';
import { drawPond } from '../world/pond.ts';
import { syncRange } from './range.ts';
import type { Feel } from '../world/chapter.ts';

export const GROWTH = 0.05;

/** What the pond says about itself, by what has arrived (PondLife.stage). */
export const POND_NOTES = [
	'A puddle, for now.',
	'Reeds have found it.',
	'The first lily pads.',
	'Someone has built a jetty.',
	'A paper boat, moored at the end.',
	'The lilies are in flower.',
];

/** The slider's range for a currency: the same small daily amounts, in that currency's size. */
const RANGE = { min: 0.5, max: 50, step: 0.5 };

/** An amount in a currency (or none): whole numbers stay whole, small change keeps its cents. */
export function money(n: number, currency: string): string {
	const digits = n < 100 && !Number.isInteger(n) ? 2 : 0;
	const fraction = { minimumFractionDigits: digits, maximumFractionDigits: digits };
	try {
		return new Intl.NumberFormat('en', currency ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol', ...fraction } : fraction).format(n);
	} catch {
		return Math.round(n).toLocaleString('en');
	}
}

/** While "show it growing" is on, the note explains the one new thing in the picture. */
export const GROWN_NOTE = 'The dashed line is where it would reach, grown.';

/** Which of the pond's notes fits a total set aside (in the slider's base units). */
export const pondNote = (total: number) => POND_NOTES[pondStage(pondFill(total))];

export function mountWealth(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="wealth"]');
	if (!root) return {};
	const amount = root.querySelector<HTMLInputElement>('[data-amount]')!;
	const years = root.querySelector<HTMLInputElement>('[data-years]')!;
	const currency = root.querySelector<HTMLSelectElement>('[data-currency]')!;
	const growth = root.querySelector<HTMLInputElement>('[data-growth]')!;
	const leaks = [...root.querySelectorAll<HTMLButtonElement>('[data-leak]')];
	const note = doc.querySelector<HTMLElement>('[data-pond-note]');
	const hero = doc.querySelector<HTMLElement>('.hero');
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	/** How many of this currency make one of the slider's base units (1 for dollars, 20 for taka). */
	const scaleOf = () => +(currency.selectedOptions[0]?.dataset.scale ?? 1) || 1;
	let scale = scaleOf();

	// On wide screens the pond's note is set down in the scene, above the figure on the bank. The
	// world works from the hero's corner; the note is laid out wherever the page puts it, so measure
	// where that is (its place before it was moved), then move it. It never sits on the controls.
	let moved: [number, number] = [0, 0];
	const placeNote = ([x, y]: [number, number]) => {
		if (!note || !hero) return;
		const h = hero.getBoundingClientRect();
		const n = note.getBoundingClientRect();
		const panel = root.getBoundingClientRect();
		const origin = [n.left - h.left - moved[0], n.top - h.top - moved[1]];
		let left = Math.min(Math.max(8, x - 18), h.width - n.width - 8);
		let top = y - n.height;
		const under = left < panel.right - h.left && left + n.width > panel.left - h.left;
		if (under) top = Math.max(top, panel.bottom - h.top + 6);
		moved = [Math.round(left - origin[0]), Math.round(top - origin[1])];
		note.style.transform = `translate(${moved[0]}px, ${moved[1]}px)`;
		note.classList.add('placed');
	};

	let total = 0;
	let perDay = 0;
	let target = { fill: 0, years: 0, grown: 1 };
	const shown = { fill: 0, years: 0, grown: 1 };

	const update = () => {
		perDay = +amount.value;
		const y = +years.value;
		const cur = currency.value;
		total = setAside(perDay, y);
		const grown = withGrowth(perDay, y, GROWTH);
		out('amount').textContent = money(perDay, cur);
		out('years').textContent = String(y);
		out('perDay').textContent = money(perDay, cur);
		out('year').textContent = money(setAside(perDay, 1), cur);
		out('total').textContent = money(total, cur);
		out('yearsAgain').textContent = String(y);
		out('grown').textContent = money(grown, cur);
		root.querySelector<HTMLElement>('[data-growth-line]')!.hidden = !growth.checked;
		root.dataset.total = String(Math.round(total));
		for (const [k, v] of [['perDay', money(perDay, cur)], ['year', money(setAside(perDay, 1), cur)], ['ten', money(setAside(perDay, 10), cur)]]) {
			const el = doc.querySelector<HTMLElement>(`.feel [data-tally="${k}"]`);
			if (el) el.textContent = v;
		}
		// The pond is sized in the slider's base units, so a taka pond and a dollar pond fill alike.
		const fill = pondFill(total / scale);
		// "If it grew" is drawn as a shoreline around that many times the water (at least 1: no growth).
		target = { fill, years: y, grown: growth.checked && total > 0 ? grown / total : 1 };
		root.dataset.pond = String(pondStage(fill));
		const says = growth.checked ? GROWN_NOTE : pondNote(total / scale);
		if (note && note.textContent !== says) note.textContent = says;
		for (const b of leaks) {
			const v = +b.dataset.leak! * scale;
			b.querySelector('[data-leak-amount]')!.textContent = money(v, cur);
			b.setAttribute('aria-pressed', String(v === perDay));
		}
		syncRange(amount);
		syncRange(years);
	};

	// A currency brings its own range: the amount keeps its place on the slider.
	const rescale = () => {
		const next = scaleOf();
		const base = +amount.value / scale;
		scale = next;
		amount.min = String(RANGE.min * scale);
		amount.max = String(RANGE.max * scale);
		amount.step = String(RANGE.step * scale);
		amount.value = String(base * scale);
		update();
	};

	for (const el of [amount, years, growth]) el.addEventListener('input', update);
	currency.addEventListener('input', rescale);
	for (const b of leaks) {
		b.addEventListener('click', () => {
			amount.value = String(+b.dataset.leak! * scale);
			update();
		});
	}
	rescale();
	// The pond is already there when the page opens; it only moves when the visitor does.
	Object.assign(shown, target);

	return {
		busy: () => Math.abs(target.fill - shown.fill) > 0.003 || Math.abs(target.years - shown.years) > 0.02 || Math.abs(target.grown - shown.grown) > 0.003,
		patch(frame, { dt, time, sprites, toPx }) {
			const k = Math.min(1, dt * 2.2);
			shown.fill += (target.fill - shown.fill) * k;
			shown.grown += (target.grown - shown.grown) * k;
			shown.years += (target.years - shown.years) * Math.min(1, dt * 5);
			if (!frame.pondSite) return;
			// More drops, faster, for a larger daily amount.
			const base = perDay / scale;
			drawPond(frame, sprites, frame.pondSite, {
				fill: shown.fill,
				years: shown.years,
				drops: base > 0 ? 2 + Math.min(6, Math.round(Math.log2(1 + base))) : 0,
				rate: 0.3 + Math.min(1.6, Math.log10(1 + base) * 0.9),
				grown: shown.grown,
				wind: Math.sin(time * 0.23) * 0.25,
			}, time);
			// The pond's note sits just above the figure on the bank, like a caption in a picture book.
			const walker = frame.sprites.find((d) => d.kind === 'walker');
			if (note && walker && hero) {
				if (getComputedStyle(note).position === 'absolute') placeNote(toPx(walker.x + 14, walker.y - 96));
				else if (moved[0] || moved[1]) {
					// Back on a narrow screen it is a caption under the controls again.
					moved = [0, 0];
					note.style.transform = '';
				}
			}
		},
	};
}
