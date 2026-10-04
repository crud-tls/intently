// The frame budget decides early and once. Regression: it used to count only drawn frames, so its
// verdict could land minutes later, while the visitor scrolled back up, and swap the world out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameBudget } from './budget.ts';

const run = (b: FrameBudget, dt: number, n: number, start = 0) => {
	let d = 'measuring';
	for (let i = 0; i < n; i++) d = b.frame(dt, true, start + i * dt);
	return d;
};

test('a smooth device settles and never changes its mind', () => {
	const b = new FrameBudget();
	assert.equal(run(b, 16, 100), 'settled');
	assert.equal(run(b, 200, 300, 5000), 'settled');
	assert.ok(b.settled);
});

test('a slow device first lowers the resolution, then asks for the static landscapes', () => {
	const b = new FrameBudget();
	const seen: string[] = [];
	let t = 0;
	for (let i = 0; i < 400 && !b.settled; i++) {
		const d = b.frame(60, true, (t += 60));
		if (d !== 'measuring') seen.push(d);
	}
	assert.deepEqual(seen, ['lower', 'lower', 'static']);
});

test('a slightly slow device lowers the resolution but keeps the world', () => {
	const b = new FrameBudget();
	const seen: string[] = [];
	let t = 0;
	for (let i = 0; i < 400 && !b.settled; i++) {
		const d = b.frame(35, true, (t += 35));
		if (d !== 'measuring') seen.push(d);
	}
	assert.deepEqual(seen, ['lower', 'lower', 'settled']);
});

test('gaps (resting, hidden tab) are not counted as slow frames', () => {
	const b = new FrameBudget();
	for (let i = 0; i < 200; i++) assert.notEqual(b.frame(5000, false, i * 16), 'static');
});

test('after the window it never decides, however slow (scrolling back up much later)', () => {
	const b = new FrameBudget();
	run(b, 16, 10);
	assert.equal(run(b, 90, 500, 60_000), 'settled');
});
