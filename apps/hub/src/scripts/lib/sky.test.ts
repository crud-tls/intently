// Text over a sky sits in its top 40% (zenith → upper); content below a landscape sits on its
// foreground (the soil). Every pairing must reach WCAG AA: 4.5:1 for text, 3:1 for the accent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKY_KEYS, SKY } from '../../data/sky.ts';
import { contrast, mix } from './color.ts';

const check = (fg: string, bg: string, min: number, what: string) =>
	assert.ok(contrast(fg, bg) >= min, `${what} ${fg} on ${bg}: ${contrast(fg, bg).toFixed(2)} < ${min}`);

for (const key of SKY_KEYS) {
	test(`sky "${key}": text over the sky is readable`, () => {
		const s = SKY[key];
		for (const bg of [s.zenith, mix(s.zenith, s.upper, 0.5), s.upper]) {
			check(s.ink, bg, 4.5, `${key} ink`);
			check(s.ink2, bg, 4.5, `${key} ink2`);
			check(s.accent, bg, 3, `${key} accent`);
		}
	});

	test(`sky "${key}": text on the soil is readable`, () => {
		const s = SKY[key];
		check(s.soilInk, s.ground[3], 4.5, `${key} soilInk`);
		check(s.soilInk2, s.ground[3], 4.5, `${key} soilInk2`);
		check(s.soilAccent, s.ground[3], 3, `${key} soilAccent`);
	});
}

test('mix lands on its ends', () => {
	assert.equal(mix('#102030', '#F0E0D0', 0), '#102030');
	assert.equal(mix('#102030', '#F0E0D0', 1), '#F0E0D0');
});
