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
- [x] Phase 2: Pawse rebrand on the preview. Name, slugs (`pawse-vs-*` with 301s), canonical host
  `pawse.liveintently.app`, warm palette with Nunito and Biscuit, privacy claims rewritten
  to match the app, fake stats/ratings/testimonials removed, `/privacy/chrome`, and
  `/delete-account/confirm` (the API email linked a page that never existed).
- [x] Phase 3: `packages/registry` + `packages/legal`. Policies written from each app's code
  (Pawse, Pawse for Chrome, Loop, Qandeel, Mirror, PaceShift). Hisab and TwoHearts wait for
  their code location. Pawse's privacy, Chrome privacy and terms render from the package.

- [x] Phase 4: hub at `intently-hub` (preview). Studio landing with app cards from the
  registry, About, Contact (routes to each app's inbox), website privacy/terms under `/legal`.
  The legacy layer (`tools/hub-redirects.mjs`) sends every old path to Pawse in one 301 and keeps
  `?token=`; `/privacy`, `/terms`, `/delete-account` stay valid for the Play listing. The apex no
  longer serves Pawse's `assetlinks.json`, so studio links don't open the Pawse app; installed
  versions keep their verification until the next update moves App Links to the subdomain.
  `tools/verify-urls.mjs --preview`: 122/123 (Loop's site is phase 5).

- [x] Phase 5: `packages/ui` app-site template + `tools/create-app.mjs`; static sites for Loop,
  Qandeel, Mirror, PaceShift (with terms and account-deletion pages), TwoHearts and Hisab
  (pitch only, no code yet). Copy is limited to what each app's code does. Legacy check:
  123/123 on previews. The hub's logo is the original Intently mark, re-traced
  (`tools/trace-intently-logo.py`).

## Open follow-ups found along the way
- Pawse analytics toggle: the policy no longer promises one; adding it is deferred (owner).
- The Chrome extension still syncs through Supabase and sends tracked-site domains to Google
  Analytics without an opt-out; the Chrome policy now says so. Consider moving its sync to the
  Cloudflare API and adding an analytics switch before the Pawse for Chrome rename.
- Sentry was removed from the Android app (it attached screenshots to crash reports).
