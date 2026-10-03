/**
 * The day's landscapes as static SVG files (/world/<scene>-<wide|tall>.svg), built once and shared by
 * the home page and the chapter pages. A <picture> picks the variant, so a phone downloads only its own.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import logo from '../../../public/brand/intently-logo.svg?raw';
import { SCENES, VARIANTS, type Scene, type Variant } from '../../world/scenes.ts';
import { renderScene } from '../../world/render-svg.ts';

export const prerender = true;

const markInner = logo
	.replace(/^[\s\S]*?<\/title>/, '')
	.replace(/<\/svg>\s*$/, '')
	.replace(/id="/g, 'id="m-');

export const getStaticPaths = (() =>
	SCENES.flatMap((scene) =>
		(Object.keys(VARIANTS) as Variant[]).map((variant) => ({
			params: { file: `${scene.id}-${variant}` },
			props: { scene, variant },
		})),
	)) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
	const { scene, variant } = props as { scene: Scene; variant: Variant };
	return new Response(renderScene(scene, variant, markInner), {
		headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
	});
};
