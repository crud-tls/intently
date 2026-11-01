# Respite blog content guide

How to write or refresh a post in `src/content/blog/`. Goals, in order: be the best answer to the
searcher's question (SEO), be quotable by AI answer engines (AEO), earn the click (CTR), and turn readers
into installs (conversion). Never trade truth for any of them.

## Product facts (the only claims you may make about Respite)

- Respite puts a short, gentle pause before the apps (and on Chrome, the websites) you pick, so you open
  them on purpose. It also tracks usage, keeps streaks, and has daily limits and timers.
- Platforms: **iPhone, Android and Chrome** (the Chrome extension also works in other Chromium browsers).
  The iPhone app is built on Apple's Screen Time API; it adds an app lock that refreshes at midnight.
- Price: **free**. An optional **Respite Plus** upgrade adds sync across devices and extras (more
  schedules, longer focus sessions, richer insights). Don't quote Plus prices; they change.
- Account: **optional**. Everything core works without signing in. An account (Google or Apple sign-in)
  is only needed for sync / Plus on several devices. Say "no account needed" only with that nuance,
  e.g. "no account needed (sign in only if you want sync)". Never say "works fully offline forever" or
  "never collects any data". Say "usage history stays on your device unless you turn on sync".
- No ads.
- You **cannot** write your own pause messages or customize prompts per app. Don't promise custom
  messages, custom prompts or per-app prompt text.
- A game layer (acorns, streak freezes, the mascot Biscuit) exists in newer versions. Mention it lightly at
  most; don't promise leagues, friends or social features.
- Former names: Intently, Pawse. Don't use them in new copy, except "formerly Intently" when a post
  targets the query "intently app".

## Competitor facts

Keep what the post already states unless you know it's wrong. Don't invent prices, ratings, user counts or
studies. If unsure, soften ("around $50/year", "at the time of writing") or remove it. Be fair: every
alternatives post says honestly where the competitor is better.

## Frontmatter, per post

- `title` ≤ 60 characters, primary query first, the year where the query has it ("2026"), no
  "| Respite" suffix. It is also the H1, so it must read naturally.
- `description` 120–155 characters, contains the primary query, promises a concrete payoff, no clickbait.
- `answer` (new): 40–70 words that directly answer the main query in plain language, in the first sentence.
  It must stand alone when quoted by Google AI Overviews / ChatGPT / Perplexity. It names Respite only when
  Respite genuinely belongs in the answer (alternatives and app-choice posts); for health/how-to posts,
  answer the question itself.
- `keyTakeaways` (new): 3–5 lines, each ≤ 110 characters, each a fact or action, not fluff.
- `faq`: 4–6 Q&As phrased the way people search ("Is…", "How do I…", "What is the best…"). Answers 40–80
  words, self-contained. These become FAQPage schema.
- `howToSteps`: only on true how-to posts; 3–7 steps.
- `updatedDate`: set to today when you change the body meaningfully. Leave `pubDate` alone.
- Quote YAML strings with single quotes and double any single quote inside ('One Sec''s').

## Body

- Keep depth. A refresh must not shrink a post: aim for 1,000–1,500 words for comparison and how-to
  posts. Replace removed filler or invented claims with real substance (who it suits, setup steps,
  day-to-day scenarios, trade-offs), never with new numbers.

- No `# ` H1 in the body; the layout renders the title.
- Open with 2–4 sentences that speak to the reader's situation; don't restate the Quick answer.
- `##` headings: prefer the question or the task the reader has ("How do I stop scrolling at night?",
  "Is One Sec free?"). Keep the post's strongest existing structure; don't churn headings for nothing.
- Short paragraphs, lists and tables where they help comparison. At least one table in comparison posts.
- Internal links: 3–6 relevant links to other posts or tools, always in the `/path/` form with a trailing
  slash (`[quiz](/quiz/)`, `[One Sec alternatives](/blog/one-sec-alternatives/)`). `npm run build` fails
  on a link without the slash or to a page that doesn't exist.
- Conversion: the layout already adds a call to action mid-article and the sidebar has one. In the body,
  mention Respite where it naturally solves the problem being discussed, with at most two links to
  `/download/`. End with a short "Getting started" or "Next step" paragraph that links `/download/` once.
- Don't touch store links (apps.apple.com, play.google.com, chromewebstore…): the site tags them at runtime.
- Keep the voice: warm, direct, a little wry, never preachy or clinical. No "In today's fast-paced world".
- Health topics (ADHD, anxiety, mental health): no diagnosis or medical claims. Point to professionals
  where appropriate. Cite only well-known findings already in the post.

## Done means

`npm run build -w @intently/respite-site` passes (including the link check) and the post reads well.
