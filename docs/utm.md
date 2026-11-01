# UTM and campaign links

One naming scheme for every link that brings people to a Respite page or sends them to a store. With it,
Ahrefs Web Analytics, Play Console, App Store Connect and the Chrome Web Store dashboard all report the
same names. The site's code is in `apps/respite/src/lib/attribution.ts`.

## Rules

- Lowercase, words joined with `_`, no spaces: `reddit`, not `Reddit` or `reddit.com`.
- `utm_source` = **where** the link sits (the site or app): `reddit`, `x`, `producthunt`, `newsletter`.
- `utm_medium` = **what kind** of channel: one of the values in the table below. Don't invent new ones.
- `utm_campaign` = **why** it exists: a dated push or a standing placement, e.g. `launch_2026_11`, `bio`.
- `utm_content` = **which** link or creative, when one campaign has several: `top_comment`, `video_1`.
- Never tag internal links (respite.liveintently.app → respite.liveintently.app). It resets the
  visitor's source in analytics. The site carries the visitor's source forward by itself.

| utm_medium | Use for |
|---|---|
| `social` | Organic posts and comments: Reddit, X, Threads, LinkedIn, Facebook groups |
| `bio` | Profile links (X bio, Instagram link-in-bio, GitHub profile) |
| `email` | Newsletters and outreach emails you send |
| `app` | Links inside the Respite apps and extension (support, "visit site") |
| `store_listing` | The website link on a store listing |
| `referral` | Our own other sites (the liveintently.app hub) |
| `partner` | Guest posts, directories, listicles that link to us |
| `paid_social` / `cpc` | Paid ads, if ever |
| `qr` | Printed QR codes |

## Ready-made links

| Where | Link |
|---|---|
| Play listing › website | `https://respite.liveintently.app/?utm_source=google_play&utm_medium=store_listing&utm_campaign=listing` |
| App Store › marketing URL | `https://respite.liveintently.app/?utm_source=app_store&utm_medium=store_listing&utm_campaign=listing` |
| App Store › support URL | `https://respite.liveintently.app/support/?utm_source=app_store&utm_medium=store_listing&utm_campaign=support` |
| Chrome Web Store › website | `https://respite.liveintently.app/?utm_source=chrome_web_store&utm_medium=store_listing&utm_campaign=listing` |
| Android app › about/support | `https://respite.liveintently.app/support/?utm_source=respite_android&utm_medium=app&utm_campaign=settings` |
| iOS app › about/support | `https://respite.liveintently.app/support/?utm_source=respite_ios&utm_medium=app&utm_campaign=settings` |
| Extension › popup/options | `https://respite.liveintently.app/?utm_source=respite_chrome&utm_medium=app&utm_campaign=popup` |
| Hub (liveintently.app) card | `https://respite.liveintently.app/?utm_source=liveintently_hub&utm_medium=referral&utm_campaign=hub` |
| Reddit post | `https://respite.liveintently.app/blog/<slug>/?utm_source=reddit&utm_medium=social&utm_campaign=<push>&utm_content=<subreddit>` |
| X / Threads bio | `https://respite.liveintently.app/?utm_source=x&utm_medium=bio&utm_campaign=bio` |

Leave untagged any privacy-policy link a store *requires* (Play's privacy field, the App Store privacy
URL). Reviewers and automated checks compare those literally.

## What the site does with them

1. The first `utm_*` set a visitor arrives with is kept for their session.
2. Untagged visitors get a source from the referrer: `google` + `organic`, or `<site>` + `referral`.
3. When a page loads, every store link on it is rewritten:

   | Store | Parameters | Where to read it |
   |---|---|---|
   | Google Play | `referrer=utm_source=…&utm_medium=…&utm_campaign=…&utm_content=…` | Play Console › Grow › Store performance › Acquisition |
   | Chrome Web Store | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` | Developer Dashboard › Analytics › Acquisition |
   | App Store | `pt=<provider token>&ct=<source>.<page>&mt=8` | App Store Connect › App Analytics › Acquisition › Campaigns |

   With no inbound tags, the values are `utm_source=respite_site`, `utm_medium=web`,
   `utm_campaign=<section>` (`home`, `blog`, `tools`, `download`, …), and
   `utm_content=<page slug>__<placement>`. The placement is `hero`, `nav`, `article`, `sidebar`,
   `footer` or `body`, or whatever the nearest `data-placement` attribute says.
4. Each click on a store link sends the Ahrefs custom event **`store_click`** with the props `store`,
   `page`, `section`, `placement`, `source` and `medium`. Set it up once in Ahrefs: Web Analytics ›
   Tracked events › add Custom event `store_click`. Then filter by its props.

## Still to do

- **App Store provider token**: set `APPLE_PROVIDER_TOKEN` in `apps/respite/src/lib/attribution.ts`.
  Find it in App Store Connect › App Analytics › Acquisition › Campaigns › Generate a campaign link;
  it's the `pt=` number. Until then App Store links stay untagged.
- Put the ready-made links above into the three store listings and the apps' settings screens.
