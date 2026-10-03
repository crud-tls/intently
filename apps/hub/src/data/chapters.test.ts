import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { CHAPTERS, chapter, neighbours } from './chapters.ts';

test('seven chapters, each with its own page file', () => {
	assert.equal(CHAPTERS.length, 7);
	const pages = readdirSync(new URL('../pages/', import.meta.url));
	for (const c of CHAPTERS) {
		assert.equal(c.path, `/${c.id}/`);
		assert.ok(pages.includes(`${c.id}.astro`), `${c.id}.astro`);
	}
	assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, 7);
});

test('every chapter is complete', () => {
	for (const c of CHAPTERS) {
		assert.ok(c.title && c.home && c.deeper && c.meta.title && c.meta.description, c.id);
		assert.ok(c.meta.description.length <= 200, `${c.id} description length`);
		assert.equal(c.reflection.length, 3, `${c.id} reflection`);
		assert.ok(c.practice.body.length > 0);
		assert.ok(c.apps.length > 0);
		assert.match(c.clock, /^\d{1,2}:\d{2} (am|pm)$/);
	}
	assert.ok(chapter('faith').verse?.arabic, 'faith has its verse');
});

test('the day loops: after the night comes dawn', () => {
	assert.equal(neighbours('faith').next.id, 'time');
	assert.equal(neighbours('time').prev.id, 'faith');
	assert.equal(neighbours('health').prev.id, 'attention');
});
