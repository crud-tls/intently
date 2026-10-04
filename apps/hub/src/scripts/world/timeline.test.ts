// The frame for a scroll position depends only on that position: scrolling down or up to the same
// place draws the same world. At each scene's centre the light is exactly that hour's palette.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameAt, skyAt, onBoardwalk } from './timeline.ts';
import { groundAt } from './columns.ts';
import { SCENES } from '../../world/scenes.ts';
import { SKY } from '../../data/sky.ts';
import { propLook } from '../../world/props.ts';
import { spriteKey, type Sprite } from './atlas.ts';
import type { PropKind } from '../../world/scenes.ts';

const sprites = new Map<string, Sprite>();
const add = (key: string, kind: PropKind, size: number, lit?: boolean) => {
	const look = propLook(kind, { size, sky: SKY.noon, skyKey: 'noon', land: SKY.noon.ground[3], lit, mark: () => '' });
	sprites.set(key, { u0: 0, v0: 0, u1: 1, v1: 1, box: look.box, glow: look.glow, kind });
};
SCENES.forEach((s) => s.props.forEach((p, i) => add(spriteKey(s.id, i), p.kind, p.size, p.lit)));
add('walker', 'figure', 84);
add('drop', 'drop', 4);
add('bird', 'bird', 12);

const at = (u: number, extra: Partial<Parameters<typeof frameAt>[0]> = {}) =>
	frameAt({ u, visW: 1600, time: 3, velocity: 0, sprites, markRect: null, ...extra });

test('at each scene the light is exactly that hour', () => {
	SCENES.forEach((s, i) => {
		const f = at(i);
		assert.equal(f.sky.zenith, SKY[s.sky].zenith, s.id);
		assert.equal(f.sky.ink, SKY[s.sky].ink, s.id);
		assert.deepEqual(skyAt(i).ground, SKY[s.sky].ground);
	});
});

test('the same scroll position draws the same frame, whichever way the visitor came', () => {
	const order = [0, 2.5, 6.2, 3.7, 8, 1.1, 6.2, 2.5, 0];
	const first = new Map<number, string>();
	for (const u of order) {
		const f = at(u);
		const sig = JSON.stringify({ z: f.sky.zenith, cam: f.cam, s: f.sprites.map((d) => [d.kind, d.x.toFixed(3), d.y.toFixed(3), d.alpha.toFixed(3)]), p: f.points.alpha });
		if (first.has(u)) assert.equal(sig, first.get(u), `u=${u}`);
		else first.set(u, sig);
	}
});

// Everything that stands on the land touches it: the lowest point of the ground under its base is
// exactly where it stands (never above: floating; the uphill side may meet the ground early).
for (const visW of [2400, 1600, 900, 460]) {
	test(`everything grounded touches the ground (visible width ${visW})`, () => {
		for (let u = 0; u <= 8.0001; u += 0.02) {
			for (const velocity of [0, 0.02]) {
				const f = at(u, { visW, velocity });
				const grounded = f.sprites.filter((d) => d.ground && d.alpha > 0.01);
				assert.ok(grounded.some((d) => d.kind === 'walker'), `walker at ${u}`);
				for (const d of grounded) {
					const { layer, half } = d.ground!;
					// The planks only exist across the lake (the shader draws them 110 units past each end);
					// anywhere else the walker is on the land. Restated here, not imported, on purpose.
					const planks = d.kind === 'walker' && !!f.lake && d.x > f.lake.a - 110 && d.x < f.lake.b + 110;
					const land = (x: number) => {
						const g = groundAt(layer, x, f.cam, layer === 3 ? f.lake : null);
						return planks ? Math.min(g, f.lake!.level - 6) : g;
					};
					const gaps = [d.x - half, d.x, d.x + half].map((x) => land(x) - d.y);
					const worst = Math.max(...gaps);
					assert.ok(Math.abs(worst) < 0.01, `${d.kind} at u=${u.toFixed(2)} on ${visW}: lowest foot is ${worst.toFixed(2)} units off the ground`);
				}
				const w = f.sprites.find((d) => d.kind === 'walker')!;
				assert.ok(Math.abs(w.x) < visW / 2, `walker on screen at ${u}`);
				assert.equal(w.tilt, undefined, 'the walker leans, never rotates');
			}
		}
	});
}

test('weeks appear at dawn, the mark at the end, and nothing in between', () => {
	assert.equal(at(1).points.alpha, 1);
	assert.equal(at(1).points.gridMix, 1);
	assert.equal(at(4).points.alpha, 0);
	assert.equal(at(8).points.markMix, 1);
	assert.ok(at(8).points.alpha > 0.5);
});

test('notifications crowd the morning and are gone by noon', () => {
	const pills = (u: number) => at(u).sprites.filter((d) => d.kind === 'pill').reduce((a, d) => a + d.alpha, 0);
	assert.ok(pills(2) > 4);
	assert.equal(pills(3), 0);
	assert.equal(pills(0.5), 0);
});

test('lights are capped for the shader, and only lit things glow', () => {
	for (let u = 0; u <= 8; u += 0.25) assert.ok(at(u).lights.length <= 8);
	assert.ok(at(7).lights.some((l) => l.r > 150), 'the lantern lights the night');
});


test('regression: after the lake, the walker is back on the land, not held at plank height', () => {
	for (const visW of [1600, 460]) {
		const f = at(7, { visW });
		const w = f.sprites.find((d) => d.kind === 'walker')!;
		assert.equal(onBoardwalk(w.x, f.lake), false, 'the night scene is past the lake');
		assert.ok(f.lake === null || w.y > f.lake.level - 6 + 1, `walker at ${w.y} is on the land, not the planks (${f.lake?.level})`);
	}
});

test('on a phone the moon rides above the words', () => {
	for (const u of [0, 6, 7, 8]) {
		const f = at(u, { visW: 460 });
		if (f.sky.moon.show > 0) assert.ok(f.sky.moon.y <= 0.1, `moon at ${f.sky.moon.y} on a phone at u=${u}`);
	}
	assert.ok(at(7).sky.moon.y > 0.15, 'wide screens keep the composed moon');
});
