/**
 * Sliders in the chapter interactives show how far along they are: the track is filled up to the
 * thumb. WebKit has no pseudo-element for that, so the share is a custom property (--fill) kept in
 * step here; Firefox uses its own ::-moz-range-progress and ignores it.
 */
export function syncRange(el: HTMLInputElement): void {
	const min = +el.min || 0;
	const max = +el.max || 100;
	const share = max > min ? (+el.value - min) / (max - min) : 0;
	el.style.setProperty('--fill', `${(Math.min(1, Math.max(0, share)) * 100).toFixed(2)}%`);
}

/** Keeps every slider under `root` in step, now and as it moves. */
export function watchRanges(root: ParentNode): void {
	const ranges = root.querySelectorAll<HTMLInputElement>('input[type="range"]');
	for (const el of ranges) {
		syncRange(el);
		el.addEventListener('input', () => syncRange(el));
	}
}
