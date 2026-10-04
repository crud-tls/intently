/**
 * Attention: the morning is noisy. Holding the button for one slow breath (or tapping for a guided
 * one) quiets the notifications until they lift away as birds; let go early and the noise creeps
 * back. A slider shows what daily phone hours add up to over a year.
 */
import { hoursPerYear, wakingDays } from '../lib/math.ts';
import type { Feel } from '../world/chapter.ts';
import { holdButton } from './hold.ts';

const BREATH = 4;
const fmt = (n: number) => Math.floor(n).toLocaleString('en');

export function mountAttention(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="attention"]');
	if (!root) return {};
	const button = root.querySelector<HTMLButtonElement>('[data-breathe]')!;
	const cue = root.querySelector<HTMLElement>('[data-cue]')!;
	const hours = root.querySelector<HTMLInputElement>('[data-hours]')!;
	const out = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

	// noise: 1 a crowded morning, 0 quiet; the breath fills over four seconds and fades if let go early.
	let noise = 1;
	let say = '';
	const setCue = (text: string) => {
		if (text !== say) cue.textContent = say = text;
	};
	const breath = holdButton(button, BREATH, {
		decay: 6,
		onFrame: (h) => {
			noise = 1 - h.level;
			setCue(
				h.level >= 1 ? 'There. That is the gap between the urge and the tap.'
				: h.active ? (h.level < 0.5 ? 'Breathe in…' : '…and out.')
				: h.level > 0 ? 'Hold for one slow breath, or tap to be guided.'
				: '',
			);
			root.dataset.calm = String(Math.round(h.level * 100));
		},
	});

	const updateHours = () => {
		const h = +hours.value;
		const year = hoursPerYear(h);
		out('hours').textContent = String(h);
		out('year').textContent = fmt(year);
		out('days').textContent = fmt(wakingDays(year));
		for (const [k, v] of [['perDay', String(h)], ['year', fmt(year)], ['days', fmt(wakingDays(year))]]) {
			const el = doc.querySelector<HTMLElement>(`.feel [data-tally="${k}"]`);
			if (el) el.textContent = v;
		}
	};
	hours.addEventListener('input', updateHours);
	updateHours();

	return {
		busy: () => breath.active || (breath.level > 0 && breath.level < 1),
		patch(frame, { time, sprites }) {
			const wild = noise * noise;
			for (const d of frame.sprites) {
				if (d.kind !== 'pill') continue;
				// Restless while it's noisy, still and gone when it's quiet.
				d.x += Math.sin(time * 9 + d.y) * 4 * wild;
				d.y += Math.cos(time * 7 + d.x) * 3 * wild - (1 - noise) * 160;
				d.alpha *= Math.min(1, noise * 1.6);
			}
			for (const l of frame.lights) if (l.kind === 'phone') l.strength *= 0.25 + 0.75 * noise;
			// As the last notifications go, birds lift from where they were.
			const walker = frame.sprites.find((d) => d.kind === 'walker');
			const bird = sprites.get('bird');
			if (!walker || !bird || noise >= 0.35) return;
			const k = (0.35 - noise) / 0.35;
			for (let i = 0; i < 4; i++) {
				frame.sprites.push({
					sprite: bird,
					kind: 'bird',
					front: true,
					x: walker.x - 60 + i * 40 + Math.sin(time + i) * 10,
					y: walker.y - 120 - k * 260 - i * 18,
					scale: 0.9,
					scaleY: 0.6 + 0.4 * Math.sin(time * 9 + i),
					alpha: Math.min(1, k * 2) * (1 - Math.max(0, k - 0.8) * 5),
				});
			}
		},
	};
}
