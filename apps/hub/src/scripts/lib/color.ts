/**
 * Small colour helpers shared by the build (sky bands, palette checks) and the browser (the sky
 * controller). Mixing happens in OKLab so a blend between two skies never goes muddy or grey.
 */
export type Rgb = [number, number, number];
type Lab = [number, number, number];

export function hexToRgb(hex: string): Rgb {
	const h = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
	const byte = (c: number) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0');
	return `#${byte(r)}${byte(g)}${byte(b)}`.toUpperCase();
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToLab(rgb: Rgb): Lab {
	const [r, g, b] = rgb.map(toLinear);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function labToRgb([L, a, b]: Lab): Rgb {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	].map(toGamma) as Rgb;
}

/** a → b by t (0..1), in OKLab. */
export function mix(a: string, b: string, t: number): string {
	const A = rgbToLab(hexToRgb(a));
	const B = rgbToLab(hexToRgb(b));
	return rgbToHex(labToRgb(A.map((v, i) => v + (B[i] - v) * t) as Lab));
}

/** The same hue, darker and a little calmer: bright skies seen by someone in dark mode. */
export function dim(hex: string, lightness = 0.9, chroma = 0.9): string {
	const [L, a, b] = rgbToLab(hexToRgb(hex));
	return rgbToHex(labToRgb([L * lightness, a * chroma, b * chroma]));
}

/** WCAG 2 contrast ratio. */
export function contrast(a: string, b: string): number {
	const lum = (hex: string) => {
		const [r, g, bl] = hexToRgb(hex).map(toLinear);
		return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
	};
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
