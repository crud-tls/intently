# Intently sites

Intently is the studio; each app has its own site on a subdomain of `liveintently.app`.
This repo is an npm-workspaces monorepo with one Astro site per Cloudflare Worker, so deploying
one app's site can never break another app's privacy page.

| Workspace | Host | Worker |
|---|---|---|
| `apps/pawse` | `pawse.liveintently.app` (preview: `pawse-site.fsadakathussain.workers.dev`) | `pawse-site` |

More apps and the `liveintently.app` hub arrive in later phases; see
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

## Rules
- Never break a URL in `docs/legacy-urls.txt`: Play Console, the Chrome Web Store and shipped
  app versions link to them. Each must end in a 200, directly or through a 301.
- A site's Worker gets its production custom domain only at cutover; until then it serves on
  workers.dev.
- Store-listing URLs (privacy, terms, account deletion) are contracts: change them only with a
  redirect in place.
