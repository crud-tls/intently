/**
 * Where the day's scenes happen in the world and what is in them. The camera moves along the
 * foreground one SPACING per scene; everything else in the landscape follows with its layer's
 * parallax. Props are placed by composition: `fx` is a fraction of the visible width (so a phone
 * and a wide screen both see them), and they stand on their layer's ridge.
 *
 * Units: the scene is 1000 units tall; x is in the same units (isotropic).
 */
import type { SkyKey } from '../data/sky.ts';
import type { ChapterId } from '../data/chapters.ts';

export type SceneId = 'prologue' | ChapterId | 'finale';

export type PropKind = 'figure' | 'tent' | 'fire' | 'phone' | 'pill' | 'bird' | 'house' | 'lantern' | 'spring' | 'drop' | 'firefly';

export interface Placement {
	kind: PropKind;
	/** Fraction of the visible width. */
	fx: number;
	/** Extra offset in units, for props that keep their distance from another (a lantern in a hand). */
	dx?: number;
	/** Stands on this layer's ridge (0 far … 3 foreground); omit for things in the sky. */
	layer?: 0 | 1 | 2 | 3;
	/** For sky things: fraction of the scene height. For grounded things: lift above the ridge, in units. */
	y?: number;
	/** Height in units. */
	size: number;
	flip?: boolean;
	tilt?: number;
	lit?: boolean;
}

export interface Water {
	/** Water line, as a fraction of the scene height. */
	level: number;
	/** Visible-width fractions it spans; `dx` widens (pond: half-width) or shifts its far end, in units. */
	from: number;
	to: number;
	dx?: number;
	kind: 'lake' | 'pond';
}

export interface Scene {
	id: SceneId;
	sky: SkyKey;
	/** Camera position along the foreground, in scenes. */
	cam: number;
	/** Which side of the screen the words sit on (props go on the other). */
	words: 'left' | 'center' | 'right';
	props: Placement[];
	water?: Water;
}

/** Foreground distance between two scenes, in units. */
export const SPACING = 1600;

/** The visible width a static landscape is composed for (wide screens, tall phones). */
export const VARIANTS = {
	wide: { width: 2800, visible: 1600 },
	tall: { width: 760, visible: 480 },
} as const;
export type Variant = keyof typeof VARIANTS;

const pills = (cx: number): Placement[] =>
	[[-0.1, 0.6], [0.08, 0.57], [-0.14, 0.68], [0.13, 0.66], [-0.03, 0.52], [0.16, 0.75], [-0.17, 0.77], [0.04, 0.63]]
		.map(([dx, y], i) => ({ kind: 'pill', fx: cx + dx, y, size: 24 + (i % 3) * 4, tilt: (i % 2 ? 1 : -1) * (4 + i) }));

export const SCENES: Scene[] = [
	{
		id: 'prologue', sky: 'night', cam: 0, words: 'center',
		props: [
			{ kind: 'tent', fx: 0.56, dx: 96, layer: 3, size: 84, lit: true },
			{ kind: 'fire', fx: 0.56, dx: 176, layer: 3, size: 20 },
			{ kind: 'figure', fx: 0.56, layer: 3, size: 78 },
		],
	},
	{
		id: 'time', sky: 'dawn', cam: 1, words: 'left',
		props: [
			{ kind: 'figure', fx: 0.62, layer: 3, size: 84 },
			{ kind: 'bird', fx: 0.76, y: 0.4, size: 12 },
			{ kind: 'bird', fx: 0.8, y: 0.43, size: 9 },
		],
	},
	{
		id: 'attention', sky: 'morning', cam: 2, words: 'right',
		props: [
			{ kind: 'figure', fx: 0.3, layer: 3, size: 84 },
			{ kind: 'phone', fx: 0.3, dx: 22, layer: 3, y: 40, size: 13, lit: true },
			...pills(0.3),
		],
	},
	{
		id: 'health', sky: 'noon', cam: 3, words: 'left',
		props: [
			{ kind: 'figure', fx: 0.64, layer: 3, size: 84, tilt: -10 },
			{ kind: 'bird', fx: 0.74, y: 0.3, size: 12 },
			{ kind: 'bird', fx: 0.71, y: 0.33, size: 9 },
			{ kind: 'bird', fx: 0.77, y: 0.34, size: 10 },
		],
	},
	{
		id: 'wealth', sky: 'afternoon', cam: 4, words: 'left',
		props: [
			{ kind: 'spring', fx: 0.69, dx: 150, layer: 3, size: 64 },
			{ kind: 'figure', fx: 0.69, dx: -150, layer: 3, size: 82 },
		],
		water: { level: 0.9, from: 0.69, to: 0.69, dx: 120, kind: 'pond' },
	},
	{
		id: 'relationships', sky: 'dusk', cam: 5, words: 'right',
		props: [
			{ kind: 'house', fx: 0.32, dx: -170, layer: 2, size: 40, lit: true },
			{ kind: 'figure', fx: 0.32, dx: -40, layer: 3, size: 82 },
			{ kind: 'figure', fx: 0.32, dx: 46, layer: 3, size: 70, flip: true },
		],
	},
	{
		id: 'self', sky: 'bluehour', cam: 6, words: 'center',
		props: [{ kind: 'figure', fx: 0.74, dx: 20, layer: 3, size: 80, flip: true }],
		water: { level: 0.84, from: -0.2, to: 0.74, dx: -70, kind: 'lake' },
	},
	{
		id: 'faith', sky: 'lantern', cam: 7, words: 'left',
		props: [
			{ kind: 'figure', fx: 0.64, layer: 3, size: 84 },
			{ kind: 'lantern', fx: 0.64, dx: 38, layer: 3, y: 34, size: 28, lit: true },
			...[[0.58, 0.7], [0.74, 0.62], [0.8, 0.74], [0.62, 0.58], [0.86, 0.66], [0.55, 0.78]]
				.map(([fx, y]) => ({ kind: 'firefly' as const, fx, y, size: 3 })),
		],
	},
	{
		id: 'finale', sky: 'night', cam: 8, words: 'center',
		props: [
			{ kind: 'tent', fx: 0.52, dx: 86, layer: 3, size: 84, lit: true },
			{ kind: 'figure', fx: 0.52, dx: -10, layer: 3, size: 78 },
		],
	},
];

export function scene(id: SceneId): Scene {
	const found = SCENES.find((s) => s.id === id);
	if (!found) throw new Error(`Unknown scene: ${id}`);
	return found;
}
