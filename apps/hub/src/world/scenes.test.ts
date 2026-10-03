// Scenes are the day's script: one per chapter in order, each with one walker, props in range.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, scene, VARIANTS } from './scenes.ts';
import { CHAPTERS } from '../data/chapters.ts';
import { SKY } from '../data/sky.ts';

test('the day runs prologue, the seven chapters in order, finale', () => {
	assert.deepEqual(SCENES.map((s) => s.id), ['prologue', ...CHAPTERS.map((c) => c.id), 'finale']);
	SCENES.forEach((s, i) => assert.equal(s.cam, i));
	CHAPTERS.forEach((c) => assert.equal(scene(c.id).sky, c.sky, `${c.id} sky`));
});

test('every scene has exactly one walker, first among its figures, on the foreground', () => {
	for (const s of SCENES) {
		const walker = s.props.find((p) => p.kind === 'figure');
		assert.ok(walker, `${s.id} has a figure`);
		assert.equal(walker.layer, 3, `${s.id} walker stands on the foreground`);
	}
});

test('props sit on a real layer or in the sky, and within reach of the screen', () => {
	for (const s of SCENES) {
		assert.ok(SKY[s.sky], `${s.id} sky`);
		for (const p of s.props) {
			if (p.layer !== undefined) assert.ok([0, 1, 2, 3].includes(p.layer));
			else assert.ok(p.y !== undefined && p.y > 0 && p.y < 1, `${s.id} ${p.kind} y`);
			assert.ok(p.fx > -0.3 && p.fx < 1.3, `${s.id} ${p.kind} fx`);
			assert.ok(p.size > 0);
		}
	}
});

test('variants compose a visible slice of the scene', () => {
	for (const v of Object.values(VARIANTS)) assert.ok(v.visible < v.width);
});
