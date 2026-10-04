/**
 * Decides, early and once, whether this device draws the live world well enough. It watches the
 * frame interval of consecutive drawn frames (median, so one hitch doesn't count), first lowers the
 * render resolution, and only as a last resort, and only within the first seconds, asks for the
 * static landscapes. After that window it never changes its mind: switching mid-journey (for
 * example while the visitor scrolls back up) is worse than a few slow frames.
 */
export type Decision = 'measuring' | 'lower' | 'static' | 'settled';

export interface BudgetOptions {
	/** Drawn frames to skip first (shader warm-up, first texture uploads). */
	warmup: number;
	/** Frames per verdict. */
	samples: number;
	/** Median interval (ms) above which the resolution steps down. */
	target: number;
	/** Median interval (ms) at the lowest resolution above which the world gives up. */
	giveUp: number;
	/** Only decide within this many ms of starting. */
	window: number;
	/** How many times the resolution may step down. */
	steps: number;
}

export const DEFAULTS: BudgetOptions = { warmup: 10, samples: 40, target: 28, giveUp: 45, window: 12000, steps: 2 };

export class FrameBudget {
	private seen = 0;
	private dts: number[] = [];
	private lowered = 0;
	private done = false;
	private opts: BudgetOptions;

	constructor(opts: BudgetOptions = DEFAULTS) {
		this.opts = opts;
	}

	get settled(): boolean {
		return this.done;
	}

	/**
	 * One drawn frame. `dt` is the time since the previous drawn frame; `consecutive` is false when
	 * frames were skipped in between (resting, hidden tab), which makes `dt` meaningless.
	 */
	frame(dt: number, consecutive: boolean, elapsed: number): Decision {
		if (this.done) return 'settled';
		if (elapsed > this.opts.window) {
			this.done = true;
			return 'settled';
		}
		this.seen++;
		if (this.seen <= this.opts.warmup || !consecutive || dt > 250) return 'measuring';
		this.dts.push(dt);
		if (this.dts.length < this.opts.samples) return 'measuring';

		const sorted = [...this.dts].sort((a, b) => a - b);
		const median = sorted[sorted.length >> 1];
		this.dts = [];
		if (median <= this.opts.target) {
			this.done = true;
			return 'settled';
		}
		if (this.lowered < this.opts.steps) {
			this.lowered++;
			this.seen = 0;
			return 'lower';
		}
		this.done = true;
		return median > this.opts.giveUp ? 'static' : 'settled';
	}
}
