/**
 * GLSL for the live world. Units match the static landscapes: the screen is 1000 units tall, x is
 * measured from the centre in the same units, y from the top. Colours mirror src/world/render-svg.ts
 * (sky stops, sun and moon glows, haze, water) so the two renderers look alike.
 */

export const FULLSCREEN_VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const LANDSCAPE_FS = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;
uniform float uScale;
uniform int uPass;
uniform float uTime;
uniform float uCam;

uniform vec3 uZenith;
uniform vec3 uUpper;
uniform vec3 uHorizon;
uniform vec4 uSun;
uniform vec3 uSunCore;
uniform vec3 uSunGlow;
uniform float uSunSpread;
uniform vec4 uMoon;
uniform float uStars;
uniform vec3 uCloud;
uniform float uCloudOpacity;
uniform vec3 uGround[4];

uniform sampler2D uRidges;
uniform sampler2D uTrees;
uniform ivec2 uTreeFirst;
uniform vec2 uTreeCell;
uniform vec2 uTreeOffset;

uniform vec3 uLake;
uniform vec4 uPond;
uniform vec4 uLights[8];
uniform vec3 uLightColor[8];
uniform int uLightCount;
uniform float uRipple;

out vec4 outColor;

uint hashu(uint x) {
	x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
	return x;
}
float rnd(int i, int seed) {
	return float(hashu(uint(i + 100000) ^ (uint(seed) * 0x9E3779B9U))) / 4294967295.0;
}
float rnd2(ivec2 c, int seed) { return rnd(c.x * 7919 + c.y * 104729, seed); }

vec4 ridgesAt(float x) {
	return texture(uRidges, vec2(x * uScale / uRes.x + 0.5, 0.5));
}

bool treeHit(int row, vec2 p) {
	float lx = uTreeOffset[row] + p.x;
	int idx = int(floor(lx / uTreeCell[row])) - uTreeFirst[row];
	for (int k = -1; k <= 1; k++) {
		int s = idx + k;
		if (s < 0 || s >= 256) continue;
		vec4 t = texelFetch(uTrees, ivec2(s, row), 0);
		if (t.w < 0.5) continue;
		float d = p.y - t.y;
		if (d < 0.0 || d > t.z + 4.0) continue;
		float dd = min(d, t.z - 0.001);
		float w = dd * 0.32 * (0.72 + 0.28 * fract(dd / t.z * 3.0));
		if (d > t.z) w *= (t.z + 4.0 - d) / 4.0;
		if (abs(p.x - t.x) < w) return true;
	}
	return false;
}

// Over-composite a colour with alpha onto an opaque colour.
vec3 over(vec3 base, vec3 c, float a) { return mix(base, c, clamp(a, 0.0, 1.0)); }

vec3 sky(vec2 p) {
	vec3 c = p.y < 400.0 ? mix(uZenith, uUpper, clamp(p.y / 400.0, 0.0, 1.0))
	                     : mix(uUpper, uHorizon, clamp((p.y - 400.0) / 260.0, 0.0, 1.0));

	// Stars: one chance per cell, drifting very slowly with the walk.
	if (uStars > 0.01 && p.y < 640.0) {
		vec2 q = p + vec2(uCam * 0.02, 0.0);
		ivec2 cell = ivec2(floor(q / 18.0));
		float h = rnd2(cell, 3);
		if (h < 0.32) {
			vec2 at = (vec2(cell) + vec2(rnd2(cell, 5), rnd2(cell, 7))) * 18.0;
			float r = 0.7 + pow(rnd2(cell, 9), 3.0) * 2.0;
			float tw = 0.75 + 0.25 * sin(uTime * (0.6 + rnd2(cell, 11) * 2.0) + h * 40.0);
			float a = smoothstep(r + 0.8, r - 0.4, length(q - at)) * (0.35 + rnd2(cell, 13) * 0.65) * tw;
			a *= smoothstep(640.0, 520.0, p.y);
			c = over(c, vec3(1.0, 0.973, 0.925), a * uStars);
		}
	}

	// Moon: a soft halo and a crescent.
	if (uMoon.w > 0.0) {
		float d = length(p - uMoon.xy);
		float halo = max(0.0, 1.0 - d / (uMoon.z * 5.0));
		c = over(c, vec3(0.91, 0.933, 1.0), 0.35 * halo * uMoon.w);
		float disc = smoothstep(uMoon.z + 1.0, uMoon.z - 1.0, d);
		float bite = smoothstep(uMoon.z * 0.86 - 1.0, uMoon.z * 0.86 + 1.0, length(p - uMoon.xy - vec2(0.42, -0.18) * uMoon.z));
		c = over(c, vec3(0.965, 0.945, 0.894), disc * bite * uMoon.w);
	}

	// Sun: the same four-stop glow as the static landscapes, then its disc.
	if (uSun.w > 0.0) {
		float d = length(p - uSun.xy) / (uSunSpread * 1000.0);
		vec4 g;
		if (d < 0.07) g = mix(vec4(uSunCore, 0.95), vec4(uSunGlow, 0.7), d / 0.07);
		else if (d < 0.3) g = mix(vec4(uSunGlow, 0.7), vec4(uSunGlow, 0.22), (d - 0.07) / 0.23);
		else g = mix(vec4(uSunGlow, 0.22), vec4(uSunGlow, 0.0), clamp((d - 0.3) / 0.7, 0.0, 1.0));
		c = over(c, g.rgb, g.a * uSun.w);
		c = over(c, uSunCore, smoothstep(uSun.z + 1.0, uSun.z - 1.0, length(p - uSun.xy)) * uSun.w);
	}

	// Clouds: a few soft clusters per stretch of sky, drifting.
	if (uCloudOpacity > 0.03 && p.y < 520.0) {
		float cx = p.x + uCam * 0.06 + uTime * 5.0;
		int i0 = int(floor(cx / 520.0));
		float a = 0.0;
		for (int k = -1; k <= 1; k++) {
			int i = i0 + k;
			if (rnd(i, 21) > 0.72) continue;
			float x = (float(i) + rnd(i, 22)) * 520.0;
			float y = 100.0 + rnd(i, 23) * 320.0;
			float w = 70.0 + rnd(i, 24) * 120.0;
			for (int e = 0; e < 4; e++) {
				float dx = (float(e) - 1.5) * w * 0.42;
				float ry = w * (0.16 + rnd(i * 4 + e, 25) * 0.12) * ((e == 1 || e == 2) ? 1.35 : 1.0);
				vec2 rel = (vec2(cx, p.y) - vec2(x + dx, y - ry * 0.3)) / vec2(w * 0.42, ry);
				float soft = 14.0 / ry;
				a = max(a, smoothstep(1.0 + soft, 1.0 - soft, length(rel)));
			}
		}
		c = over(c, uCloud, a * uCloudOpacity);
	}
	return c;
}

float hazeAt(float y) {
	if (y < 500.0 || y > 800.0) return 0.0;
	return y < 665.0 ? 0.42 * (y - 500.0) / 165.0 : 0.42 * (800.0 - y) / 135.0;
}

// The land behind the foreground: layers 0..2 over the sky (alpha 0 where only sky shows).
vec4 back(vec2 p, vec4 r) {
	vec4 col = vec4(0.0);
	if (p.y >= r.x) col = vec4(uGround[0], 1.0);
	float hz = hazeAt(p.y);
	col = col.a > 0.0 ? vec4(mix(col.rgb, uHorizon, hz), 1.0) : vec4(uHorizon * hz, hz);
	if (p.y >= r.y || treeHit(0, p)) col = vec4(uGround[1], 1.0);
	if (p.y >= r.z || treeHit(1, p)) col = vec4(uGround[2], 1.0);
	return col;
}

void light(inout vec4 col, vec2 p) {
	for (int i = 0; i < 8; i++) {
		if (i >= uLightCount) break;
		vec4 L = uLights[i];
		float d = length(p - L.xy) / L.z;
		if (d >= 1.0) continue;
		// The warm gradient: bright core, soft shoulder, nothing at the edge.
		vec4 g = d < 0.3 ? mix(vec4(1.0, 0.827, 0.541, 0.9), vec4(uLightColor[i], 0.35), d / 0.3)
		                 : mix(vec4(uLightColor[i], 0.35), vec4(uLightColor[i], 0.0), (d - 0.3) / 0.7);
		float a = g.a * L.w;
		col = vec4(g.rgb * a + col.rgb * (1.0 - a), a + col.a * (1.0 - a));
	}
}

void main() {
	vec2 p = vec2((gl_FragCoord.x - uRes.x * 0.5) / uScale, (uRes.y - gl_FragCoord.y) / uScale);

	if (uPass == 0) {
		outColor = vec4(sky(p), 1.0);
		return;
	}

	vec4 r = ridgesAt(p.x);

	if (uPass == 1) {
		outColor = back(p, r);
		return;
	}

	// Pass 2: water, the foreground, and every light in the scene. Premultiplied alpha.
	vec4 col = vec4(0.0);
	bool inLake = p.x > uLake.x - 110.0 && p.x < uLake.y + 110.0;
	if (uLake.z > 0.0 && p.y >= uLake.z && inLake) {
		float depth = p.y - uLake.z;
		float wob = sin(p.y * 0.35 - uTime * 1.6) * (0.6 + uRipple * 7.0) + sin(p.y * 0.09 + uTime * 0.7) * uRipple * 10.0;
		vec2 q = vec2(p.x + wob * (0.25 + depth * 0.012), 2.0 * uLake.z - p.y);
		vec4 rb = back(q, ridgesAt(q.x));
		vec3 refl = rb.rgb + sky(q) * (1.0 - rb.a);
		vec3 tint = mix(uHorizon, uGround[2], 0.45);
		vec3 w = mix(tint, refl, 0.62);
		// Ripple glints, fewer and fainter with depth.
		float glint = smoothstep(0.985, 1.0, sin(p.y * 1.3 + sin(p.x * 0.01 + uTime * 0.4) * 3.0)) * 0.18 * exp(-depth * 0.02);
		col = vec4(w + glint, 1.0);
	}
	if (p.y >= r.w) col = vec4(uGround[3], 1.0);

	// A boardwalk across the lake: planks just above the water, a post every 80 units.
	if (uLake.z > 0.0 && inLake) {
		float top = uLake.z - 6.0;
		bool plank = p.y >= top && p.y <= top + 5.0;
		bool post = p.y > top && p.y < uLake.z + 26.0 && abs(mod(p.x - uLake.x, 80.0) - 40.0) < 2.5;
		if (plank || post) col = vec4(mix(uGround[3], uGround[2], 0.35), 1.0);
	}

	if (uPond.z > 0.0) {
		vec2 e = (p - uPond.xy) / uPond.zw;
		float d = length(e);
		if (d < 1.0 + 6.0 / uPond.z) col = vec4(mix(uGround[3], uGround[2], 0.5), 1.0);
		if (d < 1.0) {
			float t = clamp((p.y - (uPond.y - uPond.w)) / (2.0 * uPond.w), 0.0, 1.0);
			vec3 w = t < 0.6 ? mix(mix(uZenith, uGround[3], 0.35), mix(uUpper, uGround[2], 0.25), t / 0.6)
			                 : mix(mix(uUpper, uGround[2], 0.25), uHorizon, (t - 0.6) / 0.4);
			// Rings spreading from where the drops land.
			vec2 rp = (p - uPond.xy - vec2(uPond.z * 0.35, 0.0)) / vec2(1.0, 0.18);
			float ring = fract(length(rp) / (uPond.z * 0.32) - uTime * 0.6);
			w += vec3(1.0) * smoothstep(0.92, 1.0, ring) * 0.35 * smoothstep(uPond.z * 0.7, 0.0, length(rp));
			col = vec4(w, 1.0);
		}
	}

	light(col, p);
	outColor = col;
}
`;

export const SPRITE_VS = `#version 300 es
in vec2 aPos;
in vec2 aUV;
in vec4 aTint;
in vec2 aFx;
uniform vec2 uRes;
uniform float uScale;
out vec2 vUV;
out vec4 vTint;
out vec2 vFx;
void main() {
	vUV = aUV;
	vTint = aTint;
	vFx = aFx;
	vec2 px = vec2(aPos.x * uScale + uRes.x * 0.5, aPos.y * uScale);
	gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
}
`;

export const SPRITE_FS = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
in vec2 vUV;
in vec4 vTint;
in vec2 vFx;
out vec4 outColor;
void main() {
	// vFx.x: opacity; vFx.y: blur, as a mip bias.
	vec4 t = texture(uAtlas, vUV, vFx.y);
	vec3 rgb = mix(t.rgb, vTint.rgb * t.a, vTint.a);
	outColor = vec4(rgb, t.a) * vFx.x;
}
`;

export const POINTS_VS = `#version 300 es
in vec2 aStar;
in vec2 aGrid;
in vec2 aMark;
in float aSeed;
uniform vec2 uRes;
uniform float uScale;
uniform float uVisW;
uniform vec4 uGridRect;
uniform vec4 uMarkRect;
uniform float uGridMix;
uniform float uMarkMix;
uniform float uTime;
uniform float uSize;
out float vAlpha;
void main() {
	vec2 star = vec2((aStar.x - 0.5) * uVisW, aStar.y * 620.0);
	vec2 grid = uGridRect.xy + aGrid * uGridRect.zw;
	vec2 mark = uMarkRect.xy + aMark * uMarkRect.zw;
	float g = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uGridMix);
	float m = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uMarkMix);
	vec2 p = mix(mix(star, grid, g), mark, m);
	p += vec2(sin(uTime * 0.7 + aSeed * 40.0), cos(uTime * 0.6 + aSeed * 31.0)) * 1.5 * (1.0 - max(g, m));
	vec2 px = vec2(p.x * uScale + uRes.x * 0.5, p.y * uScale);
	gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
	gl_PointSize = uSize * (0.8 + aSeed * 0.5);
	vAlpha = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 1.7) + aSeed * 60.0);
}
`;

export const POINTS_FS = `#version 300 es
precision highp float;
uniform float uAlpha;
uniform vec3 uColor;
in float vAlpha;
out vec4 outColor;
void main() {
	float d = length(gl_PointCoord - 0.5) * 2.0;
	float a = smoothstep(1.0, 0.2, d) * uAlpha * (0.6 + 0.4 * vAlpha);
	outColor = vec4(uColor * a, a);
}
`;

export const GRAIN_FS = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uAmount;
out vec4 outColor;
uint hashu(uint x) { x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }
void main() {
	uvec2 c = uvec2(gl_FragCoord.xy);
	float n = float(hashu(c.x * 1973U + c.y * 9277U + uint(uTime * 24.0) * 26699U)) / 4294967295.0;
	// Multiplied in at 2x: 0.5 leaves a pixel as it is.
	outColor = vec4(vec3(0.5 + (n - 0.5) * uAmount), 1.0);
}
`;
