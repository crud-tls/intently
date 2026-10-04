/**
 * Self: the reflection in the lake is blurred while you move (the pointer, the page) and sharpens
 * when you hold still. Choose the small acts you want more of; each becomes a light around the
 * figure, and in its reflection: who you're becoming, built from small things.
 */
import type { Feel } from '../world/chapter.ts';

const STILL_AFTER = 2.5;

export function becoming(acts: string[]): string {
	if (acts.length === 0) return '…';
	if (acts.length === 1) return acts[0];
	return `${acts.slice(0, -1).join(', ')} and ${acts[acts.length - 1]}`;
}

export function mountSelf(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="self"]');
	if (!root) return {};
	const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-act]')];
	const sentence = root.querySelector<HTMLElement>('[data-becoming]')!;
	const cue = root.querySelector<HTMLElement>('[data-cue]')!;

	let movedAt = performance.now();
	let stillness = 0;
	let chosen: string[] = [];
	const glow = new Map<string, number>();

	const moved = () => (movedAt = performance.now());
	addEventListener('pointermove', moved, { passive: true });
	addEventListener('scroll', moved, { passive: true });
	addEventListener('keydown', moved);

	const update = () => {
		chosen = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.act!);
		const text = becoming(chosen);
		sentence.textContent = text;
		const still = doc.querySelector<HTMLElement>('.feel [data-becoming]');
		if (still) still.textContent = text;
		root.dataset.acts = String(chosen.length);
	};
	for (const chip of chips) {
		chip.addEventListener('click', () => {
			chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
			moved();
			update();
		});
	}
	update();

	let say = '';
	const step = (now: number) => {
		const quiet = (now - movedAt) / 1000;
		stillness = Math.min(1, Math.max(0, (quiet - 0.4) / STILL_AFTER));
		root.dataset.stillness = String(Math.round(stillness * 100));
		const text = stillness >= 1 ? 'There you are.' : quiet > 0.6 ? 'Hold still…' : '';
		if (text !== say) cue.textContent = say = text;
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);

	return {
		busy: () => stillness < 1 || [...glow.values()].some((g) => g < 1),
		patch(frame, { dt, time }) {
			// The reflection: blurred while you move, sharp when you're still.
			for (const d of frame.sprites) if (d.kind === 'walker' && d.flipY) d.blur = 0.2 + (1 - stillness) * 4.2;
			for (const act of chosen) glow.set(act, Math.min(1, (glow.get(act) ?? 0) + dt * 1.5));
			for (const [act, g] of glow) if (!chosen.includes(act)) glow.set(act, Math.max(0, g - dt * 2));
			const lit = [...glow.entries()].filter(([, g]) => g > 0.01);
			const walker = frame.sprites.find((d) => d.kind === 'walker' && !d.flipY);
			if (!walker || lit.length === 0) {
				frame.dots = null;
				return;
			}
			// Each act a light on an arc around the figure, risen from it, and mirrored in the lake.
			const level = frame.lake?.level;
			const dots = new Float32Array(lit.length * 8);
			lit.forEach(([, g], i) => {
				const a = Math.PI * (0.15 + (0.7 * (i + 0.5)) / Math.max(lit.length, 6)) + Math.sin(time * 0.6 + i) * 0.03;
				const r = 92 + 20 * (i % 2);
				const x = walker.x - Math.cos(a) * r;
				const y = walker.y - 42 - Math.sin(a) * r * g;
				dots.set([x, y, 22, g], i * 8);
				dots.set(level ? [x, 2 * level - y, 18, g * 0.4] : [0, 0, 0, 0], i * 8 + 4);
			});
			frame.dots = dots;
			frame.dotColor = [0.85, 0.8, 1];
		},
	};
}
