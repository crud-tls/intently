# House of brands: status and decisions

`liveintently.app` becomes the **Intently** studio hub; each app gets `<app>.liveintently.app`.
Full plan: phases 0–8 (scaffold, Pawse rebrand, shared legal, hub, app sites, cutover, backend
and Android follow-up, SEO).

## Decisions
- Monorepo, a Worker per site. Hub brand: Intently (studio). Pawse = "Pawse by Intently".
- The screen-time blog (58 posts) and tools move to Pawse with 301s from every old URL.
- Apps: Pawse (incl. **Pawse for Chrome**), Loop, Qit live; Mirror, TwoHearts, Hisab,
  PaceShift as coming-soon sites with legal pages.
- Email: one address per app on the apex (`pawse@`, `loop@`, `qit@` … `@liveintently.app`)
  through Cloudflare Email Routing; `support@`, `info@`, `noreply@` keep working.
- Pawse API host: `pawse-api.liveintently.app` (one level deep, so free Universal SSL covers it;
  `api.pawse.…` would need paid Advanced Certificate Manager). Future apps: `<app>-api`.
- `infocus.`, `health.` and `finances.liveintently.app` were experiments that mirror the old
  site (duplicate content): they 301 to the hub at cutover.

## Load-bearing external URLs
Play Console (Pawse privacy and account deletion, Loop privacy, Qit privacy) and the Chrome Web
Store (extension privacy) link to the apex today. `docs/legacy-urls.txt` lists every live path.

## Cloudflare (2026-10-02)
- Zone `liveintently.app` (Free). Workers: `intently` (the old site), `intently-api`,
  `pawse-site` (new, workers.dev only).
- Custom domains on `intently`: apex, `infocus.`, `loop.`, `health.`, `finances.`.
  `www.` has none.
- Auth is the `CLOUDFLARE_API_TOKEN` in the shell profile. It can manage Workers but not read
  DNS or Email Routing; the owner is adding Zone DNS:Read, Email Routing Rules:Edit and Email
  Routing Addresses:Read before cutover.
- The old site's contact form uses the `RESEND_API_KEY` secret on `intently`; a new Worker
  that hosts the form needs it set again (`wrangler secret put`).

## Status
- [x] Phase 0: token stripped from the git remote (revoked by the owner), baseline tag
  `pre-house-of-brands`, legacy URL inventory, Cloudflare inventory.
- [x] Phase 1: site moved to `apps/pawse` unchanged; preview at
  `https://pawse-site.fsadakathussain.workers.dev` serves all 123 legacy paths identically.
  Shared `packages/ui` is extracted in phase 4, when the hub is its second user.
