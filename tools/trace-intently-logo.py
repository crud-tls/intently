"""Rebuilds the Intently logo kit from the original 512px raster (docs/brand/intently-logo-source.png),
whose only vector was a noisy auto-trace.

The two blues are separated into masks, smoothed and traced with potrace into closed Bezier
paths; the head is an exact circle. Everything is cropped to one tight square frame and written
from that single geometry:

  apps/hub/public/brand/intently-logo.svg           named parts, CSS colour variables
  apps/hub/public/brand/intently-logo-mono.svg      one colour (currentColor); a gap outlines the band
  apps/hub/public/brand/intently-lockup.svg         mark + "Intently" as outlined paths
  apps/hub/public/brand/intently-logo-animated.svg  CSS spin, fall and squish (no JS)
  apps/hub/public/art/intently-logo.json            the same animation as Lottie (600x1000 canvas,
                                                    logo lands in the bottom-centre 400x400)
  apps/hub/public/{logo.svg, favicon.svg, logo.png, favicon.ico, apple-touch-icon.png}

Needs numpy, opencv-python-headless, potracer, pillow, fonttools and brotli, e.g.:
    python3 -m venv /tmp/v && /tmp/v/bin/pip install numpy opencv-python-headless potracer pillow fonttools brotli
    /tmp/v/bin/python tools/trace-intently-logo.py
"""
import json
import os

import cv2
import numpy as np
import potrace
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "docs", "brand", "intently-logo-source.png")
PUBLIC = os.path.join(ROOT, "apps", "hub", "public")
BRAND = os.path.join(PUBLIC, "brand")
FONT = os.path.join(ROOT, "node_modules", "@fontsource-variable", "inter", "files", "inter-latin-wght-normal.woff2")
LIGHT, DARK, INK = "#03A9F4", "#2196F3", "#1D1B18"
SCALE = 4          # masks are traced at 4x the source resolution
UNITS = 400        # the logo's square frame, in SVG/Lottie units
PADDING = 0.06     # empty margin around the mark, as a share of the frame

# ------------------------------------------------------------------ masks

im = cv2.resize(cv2.imread(SRC, cv2.IMREAD_UNCHANGED), None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
b, g, r, a = cv2.split(im)
ink = (a > 128) & (b > 150) & (r < 120)            # any blue
dark = ink & (g < 158)                              # the darker inner band


def clean(mask, blur, open_r, close_r):
    m = mask.astype(np.uint8) * 255
    k = lambda rr: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rr + 1, 2 * rr + 1))  # noqa: E731
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k(close_r))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(open_r))
    m = cv2.GaussianBlur(m, (0, 0), blur) > 127
    # Drop specks left by the source's streaky texture, then fill pinholes.
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 2000:
            keep |= lab == i
    n, lab, stats, _ = cv2.connectedComponentsWithStats((~keep).astype(np.uint8))
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 4000:
            keep |= lab == i
    return keep


ink_m = clean(ink, 6, 3, 10)
dark_m = clean(dark, 24, 8, 24) & ink_m

# The head is a dot: an exact circle with the traced blob's area and centre.
n, lab, stats, cents = cv2.connectedComponentsWithStats(ink_m.astype(np.uint8))
head_id = min(range(1, n), key=lambda i: stats[i, cv2.CC_STAT_AREA])
head_c = cents[head_id]
head_r = (stats[head_id, cv2.CC_STAT_AREA] / np.pi) ** 0.5
ink_m &= lab != head_id
dark_m &= lab != head_id

# ------------------------------------------------------------------ frame

ys, xs = np.nonzero(ink_m | (lab == head_id))
side = max(xs.max() - xs.min(), ys.max() - ys.min()) / (1 - 2 * PADDING)
origin = np.array([(xs.min() + xs.max()) / 2 - side / 2, (ys.min() + ys.max()) / 2 - side / 2])
k = UNITS / side


def frame(x, y):
    """Mask pixels -> frame units."""
    return ((x - origin[0]) * k, (y - origin[1]) * k)


HEAD = (*frame(*head_c), head_r * k)

# ------------------------------------------------------------------ tracing to structured paths


def trace(mask):
    """Closed paths as lists of nodes {v, i, o} (i/o are handles relative to v)."""
    paths = []
    for curve in potrace.Bitmap(~mask).trace(turdsize=50, alphamax=1.1, opticurve=True, opttolerance=0.4):
        p = lambda q: np.array(frame(q.x, q.y))  # noqa: E731
        nodes = [{"v": p(curve.start_point), "i": np.zeros(2), "o": np.zeros(2)}]
        for seg in curve.segments:
            if seg.is_corner:
                nodes.append({"v": p(seg.c), "i": np.zeros(2), "o": np.zeros(2)})
                nodes.append({"v": p(seg.end_point), "i": np.zeros(2), "o": np.zeros(2)})
            else:
                nodes[-1]["o"] = p(seg.c1) - nodes[-1]["v"]
                end = p(seg.end_point)
                nodes.append({"v": end, "i": p(seg.c2) - end, "o": np.zeros(2)})
        # The last node closes back onto the first: keep one, with the incoming handle.
        nodes[0]["i"] = nodes[-1]["i"]
        nodes.pop()
        paths.append(nodes)
    return paths


BODY = trace(ink_m)                 # the whole light silhouette
BAND = trace(dark_m)                # the darker figure drawn over it
# One colour: the whole silhouette, with a thin gap along the band's edge so the figure still reads.
_edge = dark_m ^ cv2.erode(dark_m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
_gap = cv2.dilate(_edge.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 23))).astype(bool)
_gap &= cv2.erode(ink_m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(bool)
BODY_CUT = trace(ink_m & ~_gap)

# ------------------------------------------------------------------ SVG


def fmt(x):
    return ("%.1f" % x).rstrip("0").rstrip(".")


def svg_d(paths, dx=0.0, dy=0.0, s=1.0):
    out = []
    pt = lambda q: "%s %s" % (fmt(q[0] * s + dx), fmt(q[1] * s + dy))  # noqa: E731
    for nodes in paths:
        out.append("M" + pt(nodes[0]["v"]))
        for a_, b_ in zip(nodes, nodes[1:] + nodes[:1]):
            if not a_["o"].any() and not b_["i"].any():
                out.append("L" + pt(b_["v"]))
            else:
                out.append("C%s %s %s" % (pt(a_["v"] + a_["o"]), pt(b_["v"] + b_["i"]), pt(b_["v"])))
        out.append("Z")
    return "".join(out)


def paint(color):
    # var() is only honoured in CSS, not in presentation attributes, so variables go in style.
    return 'style="fill:%s"' % color if color.startswith("var(") else 'fill="%s"' % color


def mark_svg(light, dark, head, mono=False, dx=0.0, dy=0.0, s=1.0, ids=True):
    hx, hy, hr = HEAD
    head_el = '<circle%s cx="%s" cy="%s" r="%s" %s/>' % (
        ' id="head"' if ids else "", fmt(hx * s + dx), fmt(hy * s + dy), fmt(hr * s), paint(head))
    if mono:
        return '<path%s %s fill-rule="evenodd" d="%s"/>%s' % (
            ' id="body"' if ids else "", paint(light), svg_d(BODY_CUT, dx, dy, s), head_el)
    return ('<g%s><path%s %s fill-rule="evenodd" d="%s"/><path%s %s fill-rule="evenodd" d="%s"/></g>%s'
            % (' id="mark"' if ids else "", ' id="body"' if ids else "", paint(light), svg_d(BODY, dx, dy, s),
               ' id="band"' if ids else "", paint(dark), svg_d(BAND, dx, dy, s), head_el))


def svg_doc(body, w=UNITS, h=UNITS, extra=""):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-labelledby="t">'
            '<title id="t">Intently</title>%s%s</svg>\n' % (w, h, extra, body))


COLOR = mark_svg("var(--intently-light, %s)" % LIGHT, "var(--intently-dark, %s)" % DARK, "var(--intently-dark, %s)" % DARK)
MONO = mark_svg("currentColor", None, "currentColor", mono=True)

# Spin in from above, land, squash, stretch, settle; then the head drops in and bounces. The
# timings match the Lottie file (84 frames at 60 fps = 1.4 s).
ANIMATION_CSS = """<style>
@media (prefers-reduced-motion: no-preference) {
  #mark { transform-box: fill-box; transform-origin: 50% 100%; animation: intently-mark 1.4s both; }
  #head { transform-box: fill-box; transform-origin: 50% 50%; animation: intently-head 1.4s both; }
}
@keyframes intently-mark {
  0%   { transform: translateY(-130%) rotate(-200deg) scale(.75); animation-timing-function: cubic-bezier(.45,0,.85,1); }
  31%  { transform: translateY(0) rotate(0) scale(1); animation-timing-function: ease-out; }
  39%  { transform: scale(1.18,.8); animation-timing-function: ease-in-out; }
  50%  { transform: scale(.93,1.08); animation-timing-function: ease-out; }
  64%, 100% { transform: none; }
}
@keyframes intently-head {
  0%, 43% { transform: translateY(-350%) scale(0); animation-timing-function: cubic-bezier(.45,0,.85,1); }
  57%  { transform: translateY(0) scale(1.15); animation-timing-function: ease-out; }
  62%  { transform: translateY(-25%) scale(1.05); animation-timing-function: ease-in; }
  67%, 100% { transform: none; }
}
</style>"""


def lockup():
    """Mark plus "Intently" set in Inter Bold, converted to paths so no font is needed."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    font = instantiateVariableFont(TTFont(FONT), {"wght": 700})
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    upem = font["head"].unitsPerEm
    size = UNITS * 0.42                      # text height relative to the mark
    scale = size / upem
    cap = font["OS/2"].sCapHeight * scale
    baseline = UNITS / 2 + cap / 2           # cap height centred on the mark
    x = UNITS * 1.06
    parts = []
    for ch in "Intently":
        glyph = glyphs[cmap[ord(ch)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        parts.append(pen.getCommands())
        x += glyph.width * scale
    width = int(x + UNITS * 0.06)
    text = '<path id="wordmark" %s d="%s"/>' % (paint("var(--intently-ink, %s)" % INK), "".join(parts))
    return svg_doc(COLOR + text, w=width)


os.makedirs(BRAND, exist_ok=True)
outputs = {
    os.path.join(BRAND, "intently-logo.svg"): svg_doc(COLOR),
    os.path.join(BRAND, "intently-logo-mono.svg"): svg_doc(MONO),
    os.path.join(BRAND, "intently-logo-animated.svg"): svg_doc(COLOR, extra=ANIMATION_CSS).replace(
        "<svg ", '<svg overflow="visible" ', 1),
    os.path.join(BRAND, "intently-lockup.svg"): lockup(),
    os.path.join(PUBLIC, "logo.svg"): svg_doc(COLOR),
    os.path.join(PUBLIC, "favicon.svg"): svg_doc(COLOR),
}
for path, text in outputs.items():
    with open(path, "w") as f:
        f.write(text)

# ------------------------------------------------------------------ Lottie

FPS, FRAMES = 60, 84
# The canvas is taller and wider than the logo so the spin and fall aren't clipped: the logo lands
# in the bottom-centre 400x400 square, which is what the splash lines up with the hero logo.
CANVAS_W, CANVAS_H = UNITS + 200, UNITS + 600
SHIFT = np.array([100.0, 600.0])
EASE_IN = {"o": {"x": [0.45], "y": [0]}, "i": {"x": [0.85], "y": [1]}}
EASE_OUT = {"o": {"x": [0.15], "y": [0]}, "i": {"x": [0.35], "y": [1]}}
EASE = {"o": {"x": [0.4], "y": [0]}, "i": {"x": [0.6], "y": [1]}}


def anim(keys):
    """keys: [(frame, value, easing to the next key)]; the last key has no easing."""
    out = []
    for n_, (t, value, ease) in enumerate(keys):
        kf = {"t": t, "s": value if isinstance(value, list) else [value]}
        if n_ < len(keys) - 1:
            kf.update({"o": ease["o"], "i": ease["i"]})
        out.append(kf)
    return {"a": 1, "k": out}


def static(value):
    return {"a": 0, "k": value}


def lottie_path(nodes):
    r2 = lambda q: [round(float(q[0]), 2), round(float(q[1]), 2)]  # noqa: E731
    return {"ty": "sh", "ks": static({"c": True, "v": [r2(n_["v"] + SHIFT) for n_ in nodes],
                                      "i": [r2(n_["i"]) for n_ in nodes], "o": [r2(n_["o"]) for n_ in nodes]})}


def group(name, paths, color):
    rgb = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
    return {"ty": "gr", "nm": name, "it": [lottie_path(p) for p in paths] + [
        {"ty": "fl", "c": static(rgb), "o": static(100), "r": 2},
        {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0), "o": static(100)},
    ]}


def layer(ind, name, shapes, anchor, position, scale, rotation=static(0), ip=0):
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1, "ip": ip, "op": FRAMES, "st": 0, "bm": 0, "ao": 0,
            "ks": {"o": static(100), "r": rotation, "p": position, "a": static(anchor + [0]), "s": scale},
            "shapes": shapes}


bottom_y = float(max(n_["v"][1] for p in BODY for n_ in p)) + SHIFT[1]
center_x = float(np.mean([n_["v"][0] for p in BODY for n_ in p])) + SHIFT[0]
foot = [round(center_x, 2), round(bottom_y, 2)]
hx, hy, hr = round(float(HEAD[0] + SHIFT[0]), 2), round(float(HEAD[1] + SHIFT[1]), 2), round(float(HEAD[2]), 2)

mark_layer = layer(
    2, "mark", [group("band", BAND, DARK), group("body", BODY, LIGHT)], foot,
    position=anim([(0, [foot[0], foot[1] - 520, 0], EASE_IN), (26, [foot[0], foot[1], 0], EASE)]),
    scale=anim([(0, [75, 75, 100], EASE_IN), (26, [100, 100, 100], EASE), (33, [118, 80, 100], EASE),
                (42, [93, 108, 100], EASE_OUT), (54, [100, 100, 100], EASE)]),
    rotation=anim([(0, -200, EASE_OUT), (26, 0, EASE)]),
)
head_layer = layer(
    1, "head", [{"ty": "gr", "nm": "head", "it": [
        {"ty": "el", "p": static([hx, hy]), "s": static([hr * 2, hr * 2])},
        {"ty": "fl", "c": static([int(DARK[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]), "o": static(100), "r": 1},
        {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0), "o": static(100)},
    ]}], [hx, hy],
    position=anim([(36, [hx, hy - 140, 0], EASE_IN), (48, [hx, hy, 0], EASE_OUT), (52, [hx, hy - 10, 0], EASE_IN),
                   (56, [hx, hy, 0], EASE)]),
    scale=anim([(36, [0, 0, 100], EASE_OUT), (44, [115, 115, 100], EASE), (56, [100, 100, 100], EASE)]),
    ip=36,
)
lottie = {"v": "5.7.4", "fr": FPS, "ip": 0, "op": FRAMES, "w": CANVAS_W, "h": CANVAS_H, "nm": "intently-logo",
          "ddd": 0, "assets": [], "layers": [head_layer, mark_layer]}
with open(os.path.join(PUBLIC, "art", "intently-logo.json"), "w") as f:
    json.dump(lottie, f, separators=(",", ":"))

# ------------------------------------------------------------------ rasters (same masks, same frame)


def raster(size, background=None):
    head_mask = np.zeros(ink_m.shape, np.uint8)
    cv2.circle(head_mask, (int(head_c[0]), int(head_c[1])), int(head_r), 255, -1, lineType=cv2.LINE_AA)
    full = Image.new("RGBA", ink_m.shape[::-1], background or (0, 0, 0, 0))
    rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)  # noqa: E731
    for mask, color in ((ink_m.astype(np.uint8) * 255, LIGHT), (dark_m.astype(np.uint8) * 255, DARK), (head_mask, DARK)):
        full.paste(Image.new("RGBA", full.size, rgb(color)), (0, 0), Image.fromarray(mask))
    x0, y0 = int(round(origin[0])), int(round(origin[1]))
    # crop() pads with transparency (or the background) if the frame runs past the source edge.
    framed = Image.new("RGBA", (int(round(side)),) * 2, background or (0, 0, 0, 0))
    framed.alpha_composite(full.crop((x0, y0, x0 + int(round(side)), y0 + int(round(side)))))
    return framed.resize((size, size), Image.LANCZOS)


raster(512).save(os.path.join(PUBLIC, "logo.png"))
raster(64).save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
raster(180, (255, 255, 255, 255)).convert("RGB").save(os.path.join(PUBLIC, "apple-touch-icon.png"))
print("frame %.0fpx -> %d units; wrote %d SVGs, intently-logo.json, logo.png, favicon.ico, apple-touch-icon.png"
      % (side / SCALE, UNITS, len(outputs)))
