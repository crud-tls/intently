"""Rebuilds the Intently logo as a clean vector from the original 512px raster
(docs/brand/intently-logo-source.png), whose only vector was a noisy auto-trace.

The two blues are separated into masks, smoothed, traced with potrace, and the head is
replaced by an exact circle. Writes apps/hub/public/{logo.svg, favicon.svg, logo.png,
favicon.ico, apple-touch-icon.png}.

Needs numpy, opencv-python-headless, potracer and pillow, e.g. in a throwaway venv:
    python3 -m venv /tmp/v && /tmp/v/bin/pip install numpy opencv-python-headless potracer pillow
    /tmp/v/bin/python tools/trace-intently-logo.py
"""
import os, numpy as np, cv2, potrace
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "docs", "brand", "intently-logo-source.png")
PUBLIC = os.path.join(ROOT, "apps", "hub", "public")
LIGHT, DARK = "#03A9F4", "#2196F3"
SCALE = 4
im = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)
im = cv2.resize(im, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
b, g, r, a = cv2.split(im)
ink = (a > 128) & (b > 150) & (r < 120)            # any blue
dark = ink & (g < 158)                              # the darker inner band

def clean(mask, blur, open_r, close_r):
    m = mask.astype(np.uint8) * 255
    k = lambda rr: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rr + 1, 2 * rr + 1))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k(close_r))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(open_r))
    m = cv2.GaussianBlur(m, (0, 0), blur)
    m = (m > 127)
    # Drop specks left by the texture.
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 2000:
            keep |= lab == i
    # Fill pinholes inside shapes.
    inv = (~keep).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 4000:
            keep |= lab == i
    return keep

ink_m = clean(ink, 6, 3, 10)
dark_m = clean(dark, 24, 8, 24) & ink_m

def trace(mask):
    bm = potrace.Bitmap(~mask)
    plist = bm.trace(turdsize=50, alphamax=1.1, opticurve=True, opttolerance=0.4)
    d = []
    f = lambda p: "%.1f,%.1f" % (p.x / SCALE, p.y / SCALE)
    for curve in plist:
        d.append("M" + f(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                d.append("L" + f(seg.c) + "L" + f(seg.end_point))
            else:
                d.append("C" + f(seg.c1) + " " + f(seg.c2) + " " + f(seg.end_point))
        d.append("Z")
    return "".join(d)

# The head is a dot: replace the traced blob with an exact circle of the same area and centre.
n, lab, stats, cents = cv2.connectedComponentsWithStats(ink_m.astype(np.uint8))
head = min(range(1, n), key=lambda i: stats[i, cv2.CC_STAT_AREA])
hx, hy = cents[head]
hr = (stats[head, cv2.CC_STAT_AREA] / np.pi) ** 0.5
ink_m &= lab != head
dark_m &= lab != head
head_svg = '<circle fill="#2196F3" cx="%.1f" cy="%.1f" r="%.1f"/>' % (hx / SCALE, hy / SCALE, hr / SCALE)

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
       '<path fill="%s" fill-rule="evenodd" d="%s"/>'
       '<path fill="%s" fill-rule="evenodd" d="%s"/>%s</svg>\n') % (LIGHT, trace(ink_m), DARK, trace(dark_m), head_svg)
for name in ("logo.svg", "favicon.svg"):
    with open(os.path.join(PUBLIC, name), "w") as f:
        f.write(svg)

# Rasters come from the same smoothed masks, so they match the vector.
def raster(size, background=None):
    big = Image.new("RGBA", ink_m.shape[::-1], background or (0, 0, 0, 0))
    rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    big.paste(Image.new("RGBA", big.size, rgb(LIGHT)), (0, 0), Image.fromarray(ink_m.astype(np.uint8) * 255))
    big.paste(Image.new("RGBA", big.size, rgb(DARK)), (0, 0), Image.fromarray(dark_m.astype(np.uint8) * 255))
    head_mask = np.zeros(ink_m.shape, np.uint8)
    cv2.circle(head_mask, (int(hx), int(hy)), int(hr), 255, -1, lineType=cv2.LINE_AA)
    big.paste(Image.new("RGBA", big.size, rgb(DARK)), (0, 0), Image.fromarray(head_mask))
    return big.resize((size, size), Image.LANCZOS)

raster(512).save(os.path.join(PUBLIC, "logo.png"))
raster(64).save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
raster(180, (255, 255, 255, 255)).convert("RGB").save(os.path.join(PUBLIC, "apple-touch-icon.png"))
print("wrote logo.svg, favicon.svg, logo.png, favicon.ico, apple-touch-icon.png (svg %d bytes)" % len(svg))
