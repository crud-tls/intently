# Intently sites

Intently is the studio; each app has its own site on a subdomain of `liveintently.app`.
This repo is an npm-workspaces monorepo with one Astro site per Cloudflare Worker, so deploying
one app's site can never break another app's privacy page.

| Workspace | Host | Worker |
|---|---|---|
| `apps/hub` | `liveintently.app` (preview: `intently-hub.fsadakathussain.workers.dev`) | `intently-hub` |
| `apps/pawse` | `pawse.liveintently.app` (preview: `pawse-site.fsadakathussain.workers.dev`) | `pawse-site` |
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
npm run dev:pawse                             # local dev server for one site
npm run build                                 # build every site
npm run check                                 # build + type-check + wrangler dry-run, every site
npm run deploy -w @intently/pawse-site        # deploy one site (ask first: it is production)
```

Node 22+ (`.nvmrc`). npm only runs the install scripts listed in `allowScripts` in the root
`package.json`; workerd, esbuild and sharp need theirs to fetch native binaries.

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
