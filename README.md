# Intently sites

Intently is the studio; each app has its own site on a subdomain of `liveintently.app`.
This repo is an npm-workspaces monorepo with one Astro site per Cloudflare Worker, so deploying
one app's site can never break another app's privacy page.

| Workspace | Host | Worker |
|---|---|---|
| `apps/hub` | `liveintently.app` (preview: `intently-hub.fsadakathussain.workers.dev`) | `intently-hub` |
| `apps/respite` | `respite.liveintently.app` (preview: `respite-site.fsadakathussain.workers.dev`): Respite on iPhone, Android and Chrome, with the blog, tools, contact form and account deletion | `respite-site` |
| `apps/pawse` | being retired: `pawse.liveintently.app` becomes a 301 alias of Respite (see below) | `pawse-site` |
| `apps/redirects` | `www.`, `health.`, `finances.` and former app names (`pawse.`, `infocus.`, `qit.`) | `intently-redirects` |
| `apps/<id>` (loop, qandeel, mirror, paceshift, twohearts, hisab) | `<id>.liveintently.app` (preview: `<id>-site.fsadakathussain.workers.dev`) | `<id>-site` |

Shared packages: `packages/registry` (one record per app), `packages/legal` (each app's policies
and the component that renders them), `packages/ui` (base styles and the app-site layout,
landing, support and account-deletion sections).

## Adding an app

1. Add it to `packages/registry/src/apps.ts` (and its icon to `apps/hub/public/icons/`).
2. Write its policies in `packages/legal/policies/<id>/` from what the code actually does.
3. `node tools/create-app.mjs <id> [--accounts]`, then write `apps/<id>/src/content.ts`.
4. `npm install`, build, deploy the preview, then add the custom domain and its email alias.

More app sites arrive in later phases; see
`docs/house-of-brands.md` for the plan, decisions and status.

## Commands

```bash
npm install                                   # once, at the repo root
npm run dev:respite                           # local dev server for one site
npm run build                                 # build every site
npm run check                                 # build + type-check + wrangler dry-run, every site
npm run deploy -w @intently/respite-site      # deploy one site (ask first: it is production)
npm test -w @intently/hub-site                # hub unit tests (terrain, timeline, palettes, maths…)
npm run test:e2e -w @intently/hub-site        # hub end-to-end: desktop Chrome/Safari, Android, iPhone, iPad
npm test -w @intently/redirects               # alias redirects and their per-alias path maps
```

The hub's end-to-end tests need Playwright's browsers once: `npx playwright install chromium webkit`
(in `apps/hub`). They build the site and run it under `wrangler dev`, so redirects are the real ones.

Node 22+ (`.nvmrc`). npm only runs the install scripts listed in `allowScripts` in the root
`package.json`; workerd, esbuild and sharp need theirs to fetch native binaries.

## Pawse is now Respite

The Android and Chrome app formerly called Pawse is Respite, and its site is merged into
`apps/respite` (one site for iPhone, Android and Chrome). `apps/pawse` stays in the repo only
until the cutover is verified, then the owner deletes it: nothing new depends on it (only its old
`packages/legal/policies/pawse*` folders, which go with it). `pawse.liveintently.app` 301s to
Respite through `apps/redirects`, with a path map: `/privacy` and `/terms` go to
`/privacy/android` and `/terms/android`; every other path keeps its path.

Legal is separate per platform on `respite.liveintently.app`: `/privacy` and `/terms` are the
iPhone ones, `/privacy/android` and `/terms/android` the Android ones, `/privacy/chrome` the
extension's.

## Legacy URLs

The hub's `public/_redirects` is generated: `node tools/hub-redirects.mjs`. Check every legacy
URL with `node tools/verify-urls.mjs` (production) or `--preview` (workers.dev hosts).

## Rules
- Never break a URL in `docs/legacy-urls.txt`: Play Console, the Chrome Web Store and shipped
  app versions link to them. Each must end in a 200, directly or through a 301.
- A site's Worker gets its production custom domain only at cutover; until then it serves on
  workers.dev.
- Store-listing URLs (privacy, terms, account deletion) are contracts: change them only with a
  redirect in place.
