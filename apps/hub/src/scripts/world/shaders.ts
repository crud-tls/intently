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
uniform vec4 uLights[8];
uniform vec3 uLightColor[8];
uniform int uLightCount;
uniform float uRipple;
uniform float uWind;
uniform float uFlowers;

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

// The same, onto a premultiplied colour that may still be see-through.
void put(inout vec4 col, vec3 c, float a) {
	a = clamp(a, 0.0, 1.0);
	col = vec4(c * a + col.rgb * (1.0 - a), a + col.a * (1.0 - a));
}

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

	// Grass along the near ground, in patches: each blade leans with the breeze and with the walk,
	// and by day a few carry a flower. One hash per blade, sliced into its few numbers (the postcards
	// slice the same bits: src/world/render-svg.ts).
	float up = r.w - p.y;
	if (up > 0.0 && up < 19.0 && !(uLake.z > 0.0 && inLake)) {
		float wx = p.x + uCam;
		int c0 = int(floor(wx / 6.0));
		float dens = rnd(int(floor(float(c0) / 11.0)), 61);
		for (int k = -1; k <= 1; k++) {
			int c = c0 + k;
			uint bits = hashu(uint(c + 100000) ^ 0x51ED270BU);
			if (float(bits & 63U) / 63.0 > 0.2 + 0.6 * dens * dens) continue;
			float bx = (float(c) + 0.2 + 0.6 * float((bits >> 6) & 31U) / 31.0) * 6.0;
			float h = 4.0 + 11.0 * float((bits >> 11) & 63U) / 63.0 * (0.35 + 0.65 * dens);
			float tipX = bx + (sin(uTime * 1.3 + bx * 0.021) * 0.14 - uWind * 0.6) * h + (float((bits >> 17) & 31U) / 31.0 - 0.5) * 3.0;
			if (uFlowers > 0.0 && h > 8.5 && ((bits >> 22) & 31U) < 7U && length(vec2(wx - tipX, up - h)) < 1.7) {
				put(col, mix(vec3(1.0), uSunGlow, 0.25 + 0.6 * float((bits >> 27) & 31U) / 31.0), uFlowers);
				break;
			}
			if (up > h) continue;
			float t = up / h;
			if (abs(wx - mix(bx, tipX, t * t)) < 1.3 * (1.0 - t) + 0.3) { col = vec4(uGround[3], 1.0); break; }
		}
	}

	// A boardwalk across the lake: planks just above the water, a post every 80 units.
	if (uLake.z > 0.0 && inLake) {
		float top = uLake.z - 6.0;
		bool plank = p.y >= top && p.y <= top + 5.0;
		bool post = p.y > top && p.y < uLake.z + 26.0 && abs(mod(p.x - uLake.x, 80.0) - 40.0) < 2.5;
		if (plank || post) col = vec4(mix(uGround[3], uGround[2], 0.35), 1.0);
	}

	light(col, p);
	outColor = col;
}
`;

/**
 * The pond, drawn on its own over the finished land, and only where it is (the renderer scissors to
 * its box): the rest of the screen never pays for it. Premultiplied alpha.
 */
export const POND_FS = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;
uniform float uScale;
uniform float uTime;
uniform vec3 uZenith;
uniform vec3 uUpper;
uniform vec3 uHorizon;
uniform vec4 uSun;
uniform vec3 uSunCore;
uniform vec3 uGround[4];
uniform vec4 uPond;
uniform vec4 uPondRing;
uniform vec4 uPondJetty;
uniform float uPondGrown;

out vec4 outColor;

uint hashu(uint x) {
	x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
	return x;
}
float rnd(int i, int seed) {
	return float(hashu(uint(i + 100000) ^ (uint(seed) * 0x9E3779B9U))) / 4294967295.0;
}

void put(inout vec4 col, vec3 c, float a) {
	a = clamp(a, 0.0, 1.0);
	col = vec4(c * a + col.rgb * (1.0 - a), a + col.a * (1.0 - a));
}

// The shore by angle: not quite an ellipse (src/world/pond.ts has the same).
float shoreR(float a) { return 1.0 + 0.05 * sin(3.0 * a + 0.6) + 0.03 * sin(5.0 * a + 2.1); }

void main() {
	vec2 p = vec2((gl_FragCoord.x - uRes.x * 0.5) / uScale, (uRes.y - gl_FragCoord.y) / uScale);
	vec4 col = vec4(0.0);
	vec2 e = (p - uPond.xy) / uPond.zw;
	float len = max(length(e), 1e-4);
	float ang = atan(e.y, e.x);
	float R = shoreR(ang);
	// Distance to the shore in units (negative in the water), whichever way the ellipse is squashed.
	float grad = length(e / uPond.zw) / len;
	float sd = (len - R) / grad;

	// "If it grew": a dashed shoreline further out, like a high-water mark on a map.
	// (not above the ground line the pond lies under: that is the hill behind).
	if (uPondGrown > uPond.z + 3.0 && p.y > uPond.y - uPond.w * 1.08 - 6.0) {
		float gd = abs(len - R * uPondGrown / uPond.z) / grad;
		float dash = step(0.42, fract(ang * 5.6 + uTime * 0.03));
		put(col, mix(uGround[3], uHorizon, 0.62), smoothstep(1.5, 0.5, gd) * dash * 0.85);
	}

	// Wet earth around it, then the water.
	put(col, mix(uGround[3], uGround[2], 0.5), smoothstep(7.0, 5.0, sd));
	if (sd < 1.0) {
		float t = clamp(e.y / R * 0.5 + 0.5, 0.0, 1.0);
		// The far side mirrors the low sky; the near side is deeper and takes the zenith.
		vec3 w = mix(mix(uUpper, uHorizon, 0.6), mix(uZenith, uGround[3], 0.28), smoothstep(0.05, 1.0, t));

		// Sun on the water: a broken path of light below the sun, wider towards us.
		if (uSun.w > 0.0) {
			int row = int(floor(p.y / 2.4));
			float flick = floor(uTime * 1.4 + rnd(row, 85) * 5.0);
			float on = step(0.4, rnd(row + int(flick) * 131, 84));
			float mid = uSun.x + (rnd(row, 81) - 0.5) * (10.0 + 30.0 * t) + sin(uTime * 0.8 + float(row) * 1.7) * 2.0;
			float halfw = (2.5 + 9.0 * t) * (0.5 + rnd(row, 83));
			float gl = smoothstep(halfw, halfw * 0.5, abs(p.x - mid)) * on;
			w = mix(w, uSunCore, gl * 0.7 * uSun.w);
		}

		// Rings leaving the place where the drops land.
		if (uPondRing.z > 0.0) {
			float rl = length((p - uPondRing.xy) / vec2(1.0, uPond.w / uPond.z));
			float ring = smoothstep(0.78, 1.0, fract(rl / uPondRing.z - uPondRing.w));
			w += vec3(1.0) * ring * 0.38 * smoothstep(70.0, 6.0, rl);
		}

		// A light line where the water meets the far bank; the near bank casts a little shade.
		w = mix(w, vec3(1.0), smoothstep(-3.0, -0.6, sd) * 0.3 * (1.0 - t));
		w = mix(w, uGround[3], smoothstep(-6.0, 0.0, sd) * 0.3 * t);
		put(col, w, smoothstep(1.0, 0.0, sd));
	}

	// The jetty: a deck on short posts, and the posts' shadows on the water.
	if (uPondJetty.w > 0.0 && p.x > uPondJetty.x && p.x < uPondJetty.y) {
		float along = p.x - uPondJetty.x;
		bool isPost = abs(mod(along - 11.0, 22.0) - 11.0) < 1.6;
		float dy = p.y - uPondJetty.z;
		vec3 wood = mix(uGround[3], uGround[1], 0.6);
		if (isPost && dy > 0.0 && dy < 26.0) put(col, mix(uGround[3], uGround[2], 0.25), (dy < 11.0 ? 1.0 : 0.3 * (1.0 - (dy - 11.0) / 15.0)) * uPondJetty.w);
		if (dy > -2.0 && dy < 3.5) put(col, dy < -0.4 ? mix(wood, uHorizon, 0.4) : wood, uPondJetty.w);
		// A gap between planks, every so often.
		if (dy > -2.0 && dy < 3.5 && fract(along / 9.0) < 0.08) put(col, uGround[3], 0.5 * uPondJetty.w);
	}
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
// Weeks: how many there are (years x 52), how many are lived, which one is now.
uniform int uTotal;
uniform float uLived;
uniform float uYears;
out float vAlpha;
out float vLived;
out float vNow;
void main() {
	int id = gl_VertexID;
	if (id >= uTotal) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); gl_PointSize = 0.0; return; }
	// One column per year, one row per week.
	vec2 cell = vec2(float(id / 52) / max(uYears - 1.0, 1.0), float(id % 52) / 51.0);
	vec2 star = vec2((aStar.x - 0.5) * uVisW, aStar.y * 620.0);
	vec2 grid = uGridRect.xy + cell * uGridRect.zw;
	vec2 mark = uMarkRect.xy + aMark * uMarkRect.zw;
	float g = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uGridMix);
	float m = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uMarkMix);
	vec2 p = mix(mix(star, grid, g), mark, m);
	p += vec2(sin(uTime * 0.7 + aSeed * 40.0), cos(uTime * 0.6 + aSeed * 31.0)) * 1.5 * (1.0 - max(g, m));
	vec2 px = vec2(p.x * uScale + uRes.x * 0.5, p.y * uScale);
	gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
	float fid = float(id);
	vLived = clamp(uLived - fid, 0.0, 1.0);
	vNow = 1.0 - clamp(abs(fid - floor(uLived)) , 0.0, 1.0);
	gl_PointSize = uSize * (0.8 + aSeed * 0.5) * (1.0 + vNow * 1.6);
	vAlpha = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 1.7) + aSeed * 60.0);
}
`;

export const POINTS_FS = `#version 300 es
precision highp float;
uniform float uAlpha;
uniform vec3 uColor;
uniform vec3 uLivedColor;
uniform float uLivedOn;
uniform float uTime;
in float vAlpha;
in float vLived;
in float vNow;
out vec4 outColor;
void main() {
	float d = length(gl_PointCoord - 0.5) * 2.0;
	float soft = smoothstep(1.0, 0.2, d);
	// Without a lived count every star looks alike; with one, weeks ahead are dimmer.
	float ahead = mix(1.0, 0.38, uLivedOn * (1.0 - vLived));
	vec3 c = mix(uColor, uLivedColor, uLivedOn * vLived);
	float pulse = vNow * uLivedOn * (0.6 + 0.4 * sin(uTime * 4.0));
	float a = soft * uAlpha * (0.6 + 0.4 * vAlpha) * ahead + pulse * soft;
	outColor = vec4(mix(c, vec3(1.0, 0.85, 0.55), pulse) * a, a);
}
`;

/** Free-placed glowing dots (visits ahead, small acts): x, y, size (units), alpha per dot. */
export const DOTS_VS = `#version 300 es
in vec4 aDot;
uniform vec2 uRes;
uniform float uScale;
out float vAlpha;
void main() {
	vec2 px = vec2(aDot.x * uScale + uRes.x * 0.5, aDot.y * uScale);
	gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
	gl_PointSize = aDot.z * uScale;
	vAlpha = aDot.w;
}
`;

export const DOTS_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;
in float vAlpha;
out vec4 outColor;
void main() {
	float d = length(gl_PointCoord - 0.5) * 2.0;
	float core = smoothstep(0.45, 0.25, d);
	float halo = smoothstep(1.0, 0.0, d) * 0.45;
	float a = (core + halo) * vAlpha;
	outColor = vec4(mix(uColor, vec3(1.0), core * 0.5) * a, a);
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
