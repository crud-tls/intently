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
with reduced motion or without JavaScript). It plays the Lottie if its player is ready within
450 ms, otherwise the CSS-animated SVG, waits for the page to load (4 s cap), then moves the logo
onto the hero logo and fades away. Click, tap or Esc skips it.
