/**
 * Faith: hold the lantern (or tap and let it brighten on its own). As its light grows the night
 * warms, the stars come out more, the fireflies drift towards it and the verse rises into the sky.
 * It doesn't fade when you let go: stay as long as you like.
 */
import type { Feel } from '../world/chapter.ts';
import { holdButton } from './hold.ts';

const SECONDS = 6;

export function mountFaith(doc: Document): Feel {
	const root = doc.querySelector<HTMLElement>('[data-feel="faith"]');
	if (!root) return {};
	const button = root.querySelector<HTMLButtonElement>('[data-lantern]')!;
	const cue = root.querySelector<HTMLElement>('[data-cue]')!;
	let say = '';
	const lamp = holdButton(button, SECONDS, {
		onFrame: (h) => {
			root.style.setProperty('--lit', h.level.toFixed(3));
			root.dataset.light = String(Math.round(h.level * 100));
			const text = h.level >= 1 ? 'Stay as long as you like.' : h.active ? 'Slowly…' : h.level > 0 ? 'Hold on a little longer, or tap to let it brighten.' : '';
			if (text !== say) cue.textContent = say = text;
		},
	});

	return {
		busy: () => lamp.active,
		patch(frame, { time }) {
			const L = lamp.level;
			let lx = 0;
			let ly = 0;
			for (const l of frame.lights) {
				if (l.kind !== 'lantern') continue;
				l.strength = Math.min(1, l.strength * (0.35 + L * 1.15));
				l.r *= 0.7 + L * 0.8;
				lx = l.x;
				ly = l.y;
			}
			frame.sky = { ...frame.sky, stars: Math.min(1.25, frame.sky.stars * (0.5 + L * 0.75)) };
			// The fireflies come closer to the light as it grows.
			for (const d of frame.sprites) {
				if (d.kind !== 'firefly' || !lx) continue;
				const pull = L * 0.55;
				d.x += (lx + Math.sin(time * 0.7 + d.y) * 70 - d.x) * pull;
				d.y += (ly - 40 + Math.cos(time * 0.5 + d.x) * 50 - d.y) * pull;
			}
		},
	};
}
