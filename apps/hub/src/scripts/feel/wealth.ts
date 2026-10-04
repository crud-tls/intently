/**
 * Wealth: a small daily amount, simply set aside. Drops fall from the spring as fast as the amount
 * is large, and the pond grows with the total over the years you choose. Growth is an optional
 * illustration (before inflation and fees, not advice); the main number never includes it.
 */
import { setAside, withGrowth } from '../lib/math.ts';
import { SCENES } from '../../world/scenes.ts';
import type { Feel } from '../world/chapter.ts';

export const GROWTH = 0.05;
const SPRING_SIZE = SCENES.find((s) => s.id === 'wealth')!.props.find((p) => p.kind === 'spring')!.size;

export function money(n: number, currency: string): string {
	try {
		return new Intl.NumberFormat('en', currency ? { style: 'currency', currency, maximumFractionDigits: n < 100 ? 2 : 0 } : { maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
	} catch {
		return Math.round(n).toLocaleString('en');
	}
}

export function mountWealth(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="wealth"]');
	if (!root) return {};
	const amount = root.querySelector<HTMLInputElement>('[data-amount]')!;
	const years = root.querySelector<HTMLInputElement>('[data-years]')!;
	const currency = root.querySelector<HTMLSelectElement>('[data-currency]')!;
	const growth = root.querySelector<HTMLInputElement>('[data-growth]')!;
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	let total = 0;
	let perDay = 0;
	let pond = 0;
	let pondTarget = 0;

	const update = () => {
		perDay = +amount.value;
		const y = +years.value;
		const cur = currency.value;
		total = setAside(perDay, y);
		out('amount').textContent = money(perDay, cur);
		out('years').textContent = String(y);
		out('perDay').textContent = money(perDay, cur);
		out('year').textContent = money(setAside(perDay, 1), cur);
		out('total').textContent = money(total, cur);
		out('yearsAgain').textContent = String(y);
		out('grown').textContent = money(withGrowth(perDay, y, GROWTH), cur);
		root.querySelector<HTMLElement>('[data-growth-line]')!.hidden = !growth.checked;
		root.dataset.total = String(Math.round(total));
		for (const [k, v] of [['perDay', money(perDay, cur)], ['year', money(setAside(perDay, 1), cur)], ['ten', money(setAside(perDay, 10), cur)]]) {
			const el = doc.querySelector<HTMLElement>(`.feel [data-tally="${k}"]`);
			if (el) el.textContent = v;
		}
	};
	for (const el of [amount, years, currency, growth]) el.addEventListener('input', update);
	update();

	return {
		busy: () => Math.abs(pondTarget - pond) > 0.005,
		patch(frame, { dt, time, sprites }) {
			// The pond grows with the total: from a puddle (a few hundred) to a wide pool (half a million).
			pondTarget = Math.min(1, Math.max(0, (Math.log10(Math.max(total, 1)) - 2) / 3.8));
			pond += (pondTarget - pond) * Math.min(1, dt * 2);
			if (frame.pond) {
				const rx = 90 + 170 * pond;
				frame.pond = [frame.pond[0], frame.pond[1], rx, rx * 0.15];
			}
			// More drops, faster, for a larger daily amount.
			const spring = frame.sprites.find((d) => d.kind === 'spring');
			const drop = sprites.get('drop');
			frame.sprites = frame.sprites.filter((d) => d.kind !== 'drop');
			if (!spring || !drop || perDay <= 0) return;
			const rate = 0.3 + Math.min(1.6, Math.log10(1 + perDay) * 0.9);
			const count = 2 + Math.min(6, Math.round(Math.log2(1 + perDay)));
			const s = SPRING_SIZE;
			for (let n = 0; n < count; n++) {
				const t = (time * rate + n / count) % 1;
				frame.sprites.push({
					sprite: drop,
					kind: 'drop',
					front: true,
					x: spring.x - s * 0.4 - t * s * 0.9,
					y: spring.y - s * 0.7 + t * t * s * 0.75,
					scale: 1,
					alpha: Math.min(1, (1 - t) * 4),
				});
			}
		},
	};
}
