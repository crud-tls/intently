# Intently brand: the logo kit

The Intently mark is a figure with a head dot, in two blues. It is rebuilt from the original
raster (`intently-logo-source.png`) by `tools/trace-intently-logo.py`, which writes every file
below from one traced geometry. Don't edit the outputs; change the script and rerun it.

| File (under `apps/hub/public/`) | Use |
|---|---|
| `brand/intently-logo.svg` | The logo. Parts: `#mark` (`#body`, `#band`) and `#head`. Colours via CSS: `--intently-light` (#03A9F4), `--intently-dark` (#2196F3). |
| `brand/intently-logo-mono.svg` | One colour (`currentColor`): inline it, or use it as a CSS mask, on dark or photo backgrounds and in print. As an `<img>` it renders black. |
| `brand/intently-lockup.svg` | Mark + "Intently" (Inter Bold, outlined, so no font needed). Word colour: `--intently-ink` (#1D1B18). |
| `brand/intently-logo-animated.svg` | The intro motion in pure CSS (spin, fall, squash, head pop; 1.4 s). Respects reduced motion. |
| `art/intently-logo.json` | The same motion as Lottie (600x1000 canvas; the logo lands in the bottom-centre 400x400). |
| `logo.svg`, `favicon.svg`, `logo.png`, `favicon.ico`, `apple-touch-icon.png` | Site icons and the Organization schema logo. |

All logo files share one square frame (400 units, 6% padding), so they line up: the splash on
liveintently.app flies the animation onto the hero's `<img>` without a jump.

## Regenerate

```bash
python3 -m venv /tmp/v
/tmp/v/bin/pip install numpy opencv-python-headless potracer pillow fonttools brotli
/tmp/v/bin/python tools/trace-intently-logo.py     # needs npm install (for the Inter font)
```

## The splash

`apps/hub/src/components/Splash.astro` plays on the home page once per browser session (never
with reduced motion or without JavaScript). The Lottie plays through lottie-web's SVG-only player
(about 47 KB compressed). It is served from the site and preloaded at high priority in the page
head with `art/intently-logo.json`, so it plays on a cold first visit too: from about 0.3 s on a
normal connection, and about 1.4 s at 1.5 Mbps. The controller is inline script, so it doesn't
wait for the page's bundle. If the player hasn't arrived within 3 s, the CSS-animated SVG plays
the same motion. After the animation and the page load (6 s cap), the logo moves onto the hero
logo and the overlay fades. Click, tap or Esc skips it.

## The world (liveintently.app)

The hub is one landscape walked through in a day (dawn to night), drawn two ways from the same data:

- **Postcards:** static SVGs per scene, wide and tall (`/world/<scene>-<wide|tall>.svg`, built by
  `apps/hub/src/world/render-svg.ts`). Shown without WebGL2, with reduced motion or Save-Data.
- **The live world:** raw WebGL2 (`apps/hub/src/scripts/world/`). Terrain heights come from the same
  functions (`src/world/terrain.ts`), props from the same SVG markup (`src/world/props.ts`), and the
  hours from the same palettes (`src/data/sky.ts`, with a contrast test for every text colour).

The Intently mark is the walker. Its colours come from `--intently-light` / `--intently-dark`, and
it takes on the land's colour at night. Everything that stands on the land rests on the lowest
ground under its base (tested in both renderers and in pixels on every device project).
