/**
 * Draws a Frame with WebGL2: sky → stars-that-become-weeks → far land → props on the far layers →
 * foreground, water and lights → props in front → grain. Raw WebGL, no engine: one fullscreen
 * shader in three passes, one sprite batch, one point cloud.
 */
import { computeColumns, TREE_SLOTS, type Columns } from './columns.ts';
import { LAYERS } from '../../world/terrain.ts';
import { hexToRgb } from '../lib/color.ts';
import { FULLSCREEN_VS, LANDSCAPE_FS, SPRITE_VS, SPRITE_FS, POINTS_VS, POINTS_FS, GRAIN_FS } from './shaders.ts';
import type { Frame, SpriteDraw } from './timeline.ts';

type Uniforms = Record<string, WebGLUniformLocation | null>;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): { prog: WebGLProgram; u: Uniforms } {
	const shader = (type: number, src: string) => {
		const s = gl.createShader(type)!;
		gl.shaderSource(s, src);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
		return s;
	};
	const prog = gl.createProgram()!;
	gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
	gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
	const u: Uniforms = {};
	const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
	for (let i = 0; i < n; i++) {
		const info = gl.getActiveUniform(prog, i)!;
		const name = info.name.replace(/\[0\]$/, '');
		u[name] = gl.getUniformLocation(prog, info.name);
	}
	return { prog, u };
}

const rgb = (hex: string) => hexToRgb(hex);

export interface PointCloud {
	star: Float32Array;
	grid: Float32Array;
	mark: Float32Array;
	seed: Float32Array;
}

export class Renderer {
	gl: WebGL2RenderingContext;
	private land: ReturnType<typeof compile>;
	private sprite: ReturnType<typeof compile>;
	private pts: ReturnType<typeof compile>;
	private grain: ReturnType<typeof compile>;
	private quad: WebGLVertexArrayObject;
	private spriteVao: WebGLVertexArrayObject;
	private spriteBuf: WebGLBuffer;
	private spriteData = new Float32Array(256 * 6 * 10);
	private pointsVao: WebGLVertexArrayObject;
	private pointCount: number;
	private ridgeTex: WebGLTexture;
	private treeTex: WebGLTexture;
	private atlasTex: WebGLTexture;
	private columns: Columns | null = null;
	private columnsKey = '';
	dpr = 1;

	constructor(private canvas: HTMLCanvasElement, atlas: HTMLCanvasElement, points: PointCloud) {
		const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true, alpha: false, powerPreference: 'high-performance' });
		if (!gl) throw new Error('no webgl2');
		this.gl = gl;
		this.land = compile(gl, FULLSCREEN_VS, LANDSCAPE_FS);
		this.sprite = compile(gl, SPRITE_VS, SPRITE_FS);
		this.pts = compile(gl, POINTS_VS, POINTS_FS);
		this.grain = compile(gl, FULLSCREEN_VS, GRAIN_FS);

		// One triangle that covers the screen.
		this.quad = gl.createVertexArray()!;
		gl.bindVertexArray(this.quad);
		const qb = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, qb);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		for (const p of [this.land.prog, this.grain.prog]) {
			const loc = gl.getAttribLocation(p, 'aPos');
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
		}

		// Sprites: pos(2) uv(2) tint(4) fx(2) per vertex.
		this.spriteVao = gl.createVertexArray()!;
		gl.bindVertexArray(this.spriteVao);
		this.spriteBuf = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.byteLength, gl.DYNAMIC_DRAW);
		const attr = (name: string, size: number, offset: number) => {
			const loc = gl.getAttribLocation(this.sprite.prog, name);
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 40, offset * 4);
		};
		attr('aPos', 2, 0);
		attr('aUV', 2, 2);
		attr('aTint', 4, 4);
		attr('aFx', 2, 8);

		// Points.
		this.pointsVao = gl.createVertexArray()!;
		gl.bindVertexArray(this.pointsVao);
		this.pointCount = points.seed.length;
		const buf = (name: string, data: Float32Array, size: number) => {
			const b = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, b);
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
			const loc = gl.getAttribLocation(this.pts.prog, name);
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
		};
		buf('aStar', points.star, 2);
		buf('aGrid', points.grid, 2);
		buf('aMark', points.mark, 2);
		buf('aSeed', points.seed, 1);
		gl.bindVertexArray(null);

		const tex = () => {
			const t = gl.createTexture()!;
			gl.bindTexture(gl.TEXTURE_2D, t);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			return t;
		};
		this.ridgeTex = tex();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		this.treeTex = tex();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		this.atlasTex = tex();
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}

	resize(cssW: number, cssH: number, dpr: number) {
		this.dpr = dpr;
		const w = Math.round(cssW * dpr);
		const h = Math.round(cssH * dpr);
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
			this.columnsKey = '';
		}
	}

	private uploadColumns(frame: Frame) {
		const gl = this.gl;
		const cols = Math.ceil(this.canvas.width / this.dpr);
		const key = `${cols}|${frame.cam.toFixed(2)}|${frame.visW.toFixed(1)}|${frame.lake ? frame.lake.a.toFixed(1) + frame.lake.b.toFixed(1) : ''}`;
		if (key === this.columnsKey) return;
		this.columnsKey = key;
		this.columns = computeColumns(cols, frame.visW, frame.cam, frame.lake, this.columns ?? undefined);
		gl.bindTexture(gl.TEXTURE_2D, this.ridgeTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cols, 1, 0, gl.RGBA, gl.FLOAT, this.columns.ridges);
		gl.bindTexture(gl.TEXTURE_2D, this.treeTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TREE_SLOTS, 2, 0, gl.RGBA, gl.FLOAT, this.columns.trees);
	}

	render(frame: Frame, time: number) {
		const gl = this.gl;
		const W = this.canvas.width;
		const H = this.canvas.height;
		const scale = H / 1000;
		gl.viewport(0, 0, W, H);
		this.uploadColumns(frame);
		const s = frame.sky;

		// ——— Landscape uniforms (shared by the three passes) ———
		const L = this.land;
		gl.useProgram(L.prog);
		gl.uniform2f(L.u.uRes, W, H);
		gl.uniform1f(L.u.uScale, scale);
		gl.uniform1f(L.u.uTime, time);
		gl.uniform1f(L.u.uCam, frame.cam);
		gl.uniform3fv(L.u.uZenith, rgb(s.zenith));
		gl.uniform3fv(L.u.uUpper, rgb(s.upper));
		gl.uniform3fv(L.u.uHorizon, rgb(s.horizon));
		gl.uniform4f(L.u.uSun, (s.sun.x - 0.5) * frame.visW, s.sun.y * 1000, s.sun.r * 1000, s.sun.show);
		gl.uniform3fv(L.u.uSunCore, rgb(s.sun.core));
		gl.uniform3fv(L.u.uSunGlow, rgb(s.sun.glow));
		gl.uniform1f(L.u.uSunSpread, s.sun.spread);
		gl.uniform4f(L.u.uMoon, (s.moon.x - 0.5) * frame.visW, s.moon.y * 1000, s.moon.r * 1000, s.moon.show);
		gl.uniform1f(L.u.uStars, s.stars);
		gl.uniform3fv(L.u.uCloud, rgb(s.cloud));
		gl.uniform1f(L.u.uCloudOpacity, s.cloudOpacity);
		gl.uniform3fv(L.u.uGround, s.ground.flatMap(rgb));
		const c1 = LAYERS[1].trees!.cell * 1600;
		const c2 = LAYERS[2].trees!.cell * 1600;
		gl.uniform2f(L.u.uTreeCell, c1, c2);
		gl.uniform2f(L.u.uTreeOffset, frame.cam * LAYERS[1].parallax, frame.cam * LAYERS[2].parallax);
		gl.uniform2i(L.u.uTreeFirst, this.columns!.firstCell[0], this.columns!.firstCell[1]);
		gl.uniform3f(L.u.uLake, frame.lake?.a ?? 0, frame.lake?.b ?? 0, frame.lake?.level ?? -1);
		gl.uniform4fv(L.u.uPond, frame.pond ?? [0, 0, 0, 0]);
		const lights = new Float32Array(32);
		const lightColors = new Float32Array(24);
		frame.lights.forEach((l, i) => {
			lights.set([l.x, l.y, l.r, l.strength], i * 4);
			lightColors.set(l.color, i * 3);
		});
		gl.uniform4fv(L.u.uLights, lights);
		gl.uniform3fv(L.u.uLightColor, lightColors);
		gl.uniform1i(L.u.uLightCount, frame.lights.length);
		gl.uniform1f(L.u.uRipple, frame.ripple);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.ridgeTex);
		gl.uniform1i(L.u.uRidges, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.treeTex);
		gl.uniform1i(L.u.uTrees, 1);

		const pass = (n: number) => {
			gl.useProgram(L.prog);
			gl.uniform1i(L.u.uPass, n);
			gl.bindVertexArray(this.quad);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		gl.disable(gl.BLEND);
		pass(0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		this.drawPoints(frame, time, scale, W, H);
		pass(1);
		this.drawSprites(frame.sprites.filter((d) => !d.front), scale, W, H);
		pass(2);
		this.drawSprites(frame.sprites.filter((d) => d.front), scale, W, H);

		// Grain, multiplied in at 2x.
		gl.useProgram(this.grain.prog);
		gl.uniform1f(this.grain.u.uTime, time);
		gl.uniform1f(this.grain.u.uAmount, 0.07);
		gl.blendFunc(gl.DST_COLOR, gl.SRC_COLOR);
		gl.bindVertexArray(this.quad);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.bindVertexArray(null);
	}

	private drawPoints(frame: Frame, time: number, scale: number, W: number, H: number) {
		const p = frame.points;
		if (p.alpha <= 0.01) return;
		const gl = this.gl;
		const P = this.pts;
		gl.useProgram(P.prog);
		gl.uniform2f(P.u.uRes, W, H);
		gl.uniform1f(P.u.uScale, scale);
		gl.uniform1f(P.u.uVisW, frame.visW);
		gl.uniform4fv(P.u.uGridRect, p.grid);
		gl.uniform4fv(P.u.uMarkRect, p.mark);
		gl.uniform1f(P.u.uGridMix, p.gridMix);
		gl.uniform1f(P.u.uMarkMix, p.markMix);
		gl.uniform1f(P.u.uTime, time);
		gl.uniform1f(P.u.uAlpha, p.alpha);
		const gridSize = (p.grid[2] / 80) * 0.62;
		const markSize = (p.mark[2] / 160) * 1.1;
		gl.uniform1f(P.u.uSize, Math.max(1.5, (gridSize + (markSize - gridSize) * p.markMix) * scale));
		gl.uniform3f(P.u.uColor, 1, 0.95, 0.85);
		gl.bindVertexArray(this.pointsVao);
		gl.drawArrays(gl.POINTS, 0, this.pointCount);
	}

	private drawSprites(list: SpriteDraw[], scale: number, W: number, H: number) {
		if (!list.length) return;
		const gl = this.gl;
		const d = this.spriteData;
		let n = 0;
		for (const s of list.slice(0, 256)) {
			const [x0, y0, x1, y1] = s.sprite.box;
			const sx = s.scale * (s.flip ? -1 : 1);
			const sy = s.scale * (s.scaleY ?? 1) * (s.flipY ? -1 : 1);
			const a = ((s.tilt ?? 0) * Math.PI) / 180;
			const cos = Math.cos(a);
			const sin = Math.sin(a);
			const corner = (cx: number, cy: number, u: number, v: number) => {
				const px = cx * sx;
				const py = cy * sy;
				d.set([s.x + px * cos - py * sin, s.y + px * sin + py * cos, u, v, ...(s.tint ?? [0, 0, 0, 0]), s.alpha, s.blur ?? 0], n);
				n += 10;
			};
			const { u0, v0, u1, v1 } = s.sprite;
			corner(x0, y0, u0, v0);
			corner(x1, y0, u1, v0);
			corner(x0, y1, u0, v1);
			corner(x1, y0, u1, v0);
			corner(x1, y1, u1, v1);
			corner(x0, y1, u0, v1);
		}
		const S = this.sprite;
		gl.useProgram(S.prog);
		gl.uniform2f(S.u.uRes, W, H);
		gl.uniform1f(S.u.uScale, scale);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
		gl.uniform1i(S.u.uAtlas, 2);
		gl.bindVertexArray(this.spriteVao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n);
		gl.drawArrays(gl.TRIANGLES, 0, n / 10);
	}
}
