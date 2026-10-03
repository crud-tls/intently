import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propLook } from './props.ts';
import { SKY } from '../data/sky.ts';
import type { PropKind } from './scenes.ts';

const KINDS: PropKind[] = ['figure', 'tent', 'fire', 'phone', 'pill', 'bird', 'house', 'lantern', 'spring', 'drop', 'firefly'];

test('every prop draws something with sane bounds', () => {
	for (const kind of KINDS) {
		const look = propLook(kind, { size: 40, sky: SKY.dusk, skyKey: 'dusk', land: SKY.dusk.ground[3], lit: true, mark: () => '<g/>' });
		assert.ok(look.body.length > 0, kind);
		const [x0, y0, x1, y1] = look.box;
		assert.ok(x1 > x0 && y1 > y0, `${kind} box`);
		assert.ok(!look.body.includes('NaN') && !look.body.includes('undefined'), `${kind} markup`);
	}
});

test('things that give off light have a glow; unlit tents and houses do not', () => {
	const o = { size: 30, sky: SKY.night, skyKey: 'night' as const, land: SKY.night.ground[3], mark: () => '' };
	for (const kind of ['fire', 'phone', 'lantern', 'firefly'] as PropKind[]) assert.ok(propLook(kind, o).glow, kind);
	assert.equal(propLook('tent', { ...o, lit: false }).glow, undefined);
	assert.ok(propLook('house', { ...o, lit: true }).glow);
});
