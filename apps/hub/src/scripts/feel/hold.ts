/**
 * A press-and-hold control that fills a 0..1 level over `seconds`: hold the button (pointer,
 * Space or Enter), or tap it once to have it fill on its own. Used by the breath (attention) and the
 * lantern (faith). Runs on real time, so slow frames don't slow it down.
 */
export interface Hold {
	readonly level: number;
	readonly active: boolean;
	set(level: number): void;
}

export function holdButton(button: HTMLButtonElement, seconds: number, opts: { decay?: number; onFrame?: (h: Hold) => void } = {}): Hold {
	let level = 0;
	let holding = false;
	let guided = false;
	let pressedAt = 0;

	const begin = () => {
		holding = true;
		pressedAt = performance.now();
		button.setAttribute('aria-pressed', 'true');
	};
	const end = () => {
		if (!holding) return;
		holding = false;
		button.setAttribute('aria-pressed', 'false');
		// A tap rather than a hold: fill it for them. Letting go at the very end counts as full.
		if (performance.now() - pressedAt < 300) guided = true;
		if (level > 0.9) level = 1;
	};
	button.addEventListener('pointerdown', (e) => {
		button.setPointerCapture(e.pointerId);
		begin();
	});
	button.addEventListener('pointerup', end);
	button.addEventListener('pointercancel', end);
	button.addEventListener('keydown', (e) => {
		if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
			e.preventDefault();
			begin();
		}
	});
	button.addEventListener('keyup', (e) => {
		if (e.key === ' ' || e.key === 'Enter') end();
	});
	button.addEventListener('contextmenu', (e) => e.preventDefault());

	const hold: Hold = {
		get level() {
			return level;
		},
		get active() {
			return holding || guided;
		},
		set(v: number) {
			level = v;
		},
	};

	let last = performance.now();
	const step = (now: number) => {
		// Real time, but not across a hidden tab.
		const dt = Math.min(0.5, (now - last) / 1000);
		last = now;
		if (holding || guided) {
			level = Math.min(1, level + dt / seconds);
			if (level >= 1) guided = false;
		} else if (opts.decay && level > 0 && level < 1) level = Math.max(0, level - dt / opts.decay);
		opts.onFrame?.(hold);
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
	return hold;
}
