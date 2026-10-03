// The worked examples in src/data/chapters.ts must match the maths the pages run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as m from './math.ts';

test('time: an eighty-year life is about 4,160 weeks', () => {
	assert.equal(m.lifeWeeks(80), 4160);
	assert.equal(m.weeksLived(30), 1560);
	assert.equal(m.weeksLived(-1), 0);
});

test('attention: four hours a day is 1,460 hours, about 91 waking days', () => {
	assert.equal(m.hoursPerYear(4), 1460);
	assert.equal(Math.floor(m.wakingDays(1460)), 91);
	assert.equal(m.phoneYearsAhead(4, 30, 80), 12.5);
});

test('health: 6,000 steps a day is about 1,643 km and 39 marathons a year', () => {
	assert.equal(Math.round(m.kmPerYear(6000)), 1643);
	assert.equal(Math.round(m.marathons(m.kmPerYear(6000))), 39);
});

test('wealth: five a day is 1,825 a year and 18,250 in ten years', () => {
	assert.equal(m.setAside(5, 1), 1825);
	assert.equal(m.setAside(5, 10), 18250);
	assert.equal(m.withGrowth(5, 10, 0), 18250);
	assert.ok(m.withGrowth(5, 10, 0.05) > 18250);
});

test('relationships: sixty, four times a year, is about a hundred visits', () => {
	assert.equal(m.visitsLeft(60, 4), 100);
	assert.equal(m.visitsLeft(90, 4), 0);
});
