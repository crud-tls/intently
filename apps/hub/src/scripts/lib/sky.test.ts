// Every sky's text and accent must stay readable on both its overhead and horizon colours, in
// light and dark mode: WCAG AA (4.5:1) for text, 3:1 for the accent (focus rings, large links).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKY_KEYS, SKY, dimmed } from '../../data/sky.ts';
import { contrast, mix } from './color.ts';

for (const key of SKY_KEYS) {
	test(`sky "${key}" is readable`, () => {
		for (const s of [SKY[key], dimmed(key)]) {
			for (const bg of [s.top, s.bottom, mix(s.top, s.bottom, 0.5)]) {
				assert.ok(contrast(s.ink, bg) >= 4.5, `${key} ink on ${bg}: ${contrast(s.ink, bg).toFixed(2)}`);
				assert.ok(contrast(s.ink2, bg) >= 4.5, `${key} ink2 on ${bg}: ${contrast(s.ink2, bg).toFixed(2)}`);
				assert.ok(contrast(s.accent, bg) >= 3, `${key} accent on ${bg}: ${contrast(s.accent, bg).toFixed(2)}`);
			}
		}
	});
}

test('mix lands on its ends', () => {
	assert.equal(mix('#102030', '#F0E0D0', 0), '#102030');
	assert.equal(mix('#102030', '#F0E0D0', 1), '#F0E0D0');
});
