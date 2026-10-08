// The pond is a tally: wider for more set aside, a stone for each year, and its life arrives in a
// fixed order as it fills. Both renderers draw from this, so it has to be steady and deterministic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARRIVES, BANK, EXAMPLE, MAX_YEARS, POND_REACH, pondAt, pondFill, pondGround, pondLife, pondRx, shore, shorePath, shorePoint } from './pond.ts';
import { setAside } from '../scripts/lib/math.ts';

const at = (fill: number) => pondAt(0, 850, pondRx(fill));
const count = (fill: number, years: number, kind: string) => pondLife(at(fill), fill, years).items.filter((i) => i.kind === kind && i.alpha > 0.5).length;

test('the pond is a puddle for a few hundred and full for half a million', () => {
	assert.equal(pondFill(0), 0);
	assert.equal(pondFill(100), 0);
	assert.ok(pondFill(setAside(EXAMPLE.perDay, EXAMPLE.years)) > 0.5);
	assert.equal(pondFill(1e7), 1);
	for (let t = 100; t < 1e6; t *= 1.7) assert.ok(pondFill(t * 1.7) >= pondFill(t), 'more set aside never shrinks it');
	assert.ok(pondRx(1) > pondRx(0));
});

test('it lies on the ground: the whole shore is below the ground line, and on screen', () => {
	for (const fill of [0, 0.3, 0.6, 1]) {
		const p = at(fill);
		for (let a = -Math.PI; a < Math.PI; a += 0.1) {
			const [, y] = shorePoint(p, a);
			assert.ok(y > 850, `fill ${fill}: shore at ${y.toFixed(1)} is below the ground`);
			assert.ok(y < 1000, `fill ${fill}: shore at ${y.toFixed(1)} is on screen`);
			assert.ok(shore(a) > 0.9 && shore(a) < 1.1);
		}
	}
	// On a slope it rests at the lowest ground under its widest reach.
	assert.equal(pondGround((x) => 850 + x * 0.05, 0), 850 + POND_REACH * 0.05);
	assert.equal(pondGround((x) => 850 - x * 0.05, 0), 850 + POND_REACH * 0.05);
});

test('a strip of bank lies between the ground line and the water', () => {
	// The walker's footing is plain ground: the far shore is a bank's width below it, at any size.
	for (const fill of [0, 0.5, 1]) {
		const p = at(fill);
		let top = Infinity;
		for (let a = -Math.PI; a < 0; a += 0.02) top = Math.min(top, shorePoint(p, a)[1]);
		assert.ok(top - 850 > BANK - 7 && top - 850 < BANK + 6, `fill ${fill}: far shore ${(top - 850).toFixed(1)} below the ground`);
	}
	assert.ok(BANK >= 18, 'further below the feet than a ground edge is looked for (tests/e2e/grounding.spec.ts)');
});

test('on a narrow screen the pond is smaller throughout, and still grows', () => {
	const room = 140;
	assert.ok(pondRx(1, room) < pondRx(1));
	assert.ok(pondRx(0, room) < pondRx(0.5, room) && pondRx(0.5, room) < pondRx(1, room));
	assert.equal(pondRx(0.37, 5000), pondRx(0.37), 'with room to spare it is its full size');
});

test('one stone on the shore for each year, never more than the slider allows', () => {
	for (const years of [1, 2, 10, 30]) assert.equal(count(0.6, years, 'stone'), years);
	assert.equal(count(0.6, 99, 'stone'), MAX_YEARS);
	// A year still arriving fades in.
	const half = pondLife(at(0.6), 0.6, 3.5).items.filter((i) => i.kind === 'stone');
	assert.equal(half.length, 4);
	assert.equal(half[3].alpha, 0.5);
});

test('life arrives in order as the pond fills, and leaves in reverse', () => {
	const stage = (fill: number) => pondLife(at(fill), fill, 10).stage;
	assert.deepEqual([0.05, 0.2, 0.35, 0.5, 0.6, 0.9].map(stage), [0, 1, 2, 3, 4, 5]);
	assert.equal(count(ARRIVES.reeds - 0.01, 10, 'reed'), 0);
	assert.ok(count(1, 10, 'reed') > count(0.3, 10, 'reed'));
	assert.equal(count(ARRIVES.lilies - 0.01, 10, 'lily'), 0);
	assert.ok(count(1, 10, 'lily') >= count(0.5, 10, 'lily'));
	assert.equal(pondLife(at(0.3), 0.3, 10).jetty, null);
	assert.ok(pondLife(at(0.6), 0.6, 10).jetty);
	assert.equal(count(0.5, 10, 'boat'), 0);
	assert.equal(count(0.7, 10, 'boat'), 1);
	assert.equal(count(0.7, 10, 'bloom'), 0);
	assert.ok(count(1, 10, 'bloom') > 0);
});

test('the same pond every time, with everything in or beside the water', () => {
	const p = at(0.8);
	const a = pondLife(p, 0.8, 12);
	assert.deepEqual(a, pondLife(p, 0.8, 12));
	for (const it of a.items) {
		assert.ok(Number.isFinite(it.x) && Number.isFinite(it.y) && it.size > 0, it.kind);
		assert.ok(Math.abs(it.x - p.cx) < p.rx * 1.2 && Math.abs(it.y - p.cy) < p.ry * 1.5, `${it.kind} is at the pond`);
	}
	// The jetty starts on the bank and ends over the water.
	assert.ok(a.jetty!.x0 < p.cx - p.rx * 0.8 && a.jetty!.x1 > p.cx - p.rx * 0.6 && a.jetty!.x1 < p.cx);
});

test('reeds keep clear of where the walker stands and the spring pours', () => {
	const p = at(1);
	const avoid: [number, number][] = [[p.cx - 200, p.cx - 120], [p.cx + 60, p.cx + 200]];
	for (const it of pondLife(p, 1, 10, avoid).items.filter((i) => i.kind === 'reed')) {
		assert.ok(!avoid.some(([a, b]) => it.x > a && it.x < b), `reed at ${it.x.toFixed(0)}`);
	}
});

test('the shore draws as a closed path with no broken numbers', () => {
	const d = shorePath(at(0.5), 6);
	assert.ok(d.startsWith('M') && d.endsWith('Z'));
	assert.ok(!/NaN|undefined|Infinity/.test(d));
});
