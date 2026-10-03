---
title: Privacy Policy for Pawse (iPhone and iPad)
updated: 2026-10-03
---

Pawse helps you notice and cut back on compulsive app use by showing a short pause before the
apps you choose. This policy explains what the iPhone and iPad app collects, why, and where it
goes. The [Android app](/privacy) and the [Chrome extension](/privacy/chrome) have their own
policies.

**Developer:** MD Sadakat Hussain Fahad, publishing as Intently ·
**Contact:** [pawse@liveintently.app](mailto:pawse@liveintently.app)

## The short version

- Pawse works through Apple's **Screen Time** framework. Apple doesn't tell Pawse which apps you
  picked or what you do in them, and app names never leave your device.
- Your history is stored **on your device**. You don't need an account.
- If you choose to **sign in with Apple**, your progress is backed up to our server so you can
  restore it on a new or reset device.
- Pawse has **no analytics, advertising or tracking SDKs**. We don't show ads and we don't sell
  your data.

## How Pawse sees your app use

When you allow Screen Time access, you pick apps in Apple's own picker. Pawse receives an
opaque, encrypted token for each app, not its name; the system draws the name and icon for Pawse
inside the app only. Apple tells Pawse when you pass time thresholds in those apps (for example
"15 minutes today"), which is how Pawse counts your minutes and decides when to pause or lock an
app. Pawse never sees what you do inside an app.

## What stays on your device

- **The apps you chose** (as Screen Time tokens) and the limits, locks and settings you set.
- **Daily minutes** per chosen app, and how you answered each pause (left, continued, snoozed)
  and whether you rated its timing.
- **Streaks, achievements, your wellbeing score** and your answers to the optional "Smart timing"
  questions, plus what Pawse learned about which kind of pause helps you.

This stays in Pawse's private storage and its shared App Group storage (used by Pawse's Screen
Time extensions and widget). Deleting Pawse deletes it.

## Information that leaves your device

### If you sign in with Apple (optional)

Apple shares an **account identifier** and your **email address**, which can be a private relay
address if you choose "Hide My Email". Pawse doesn't ask for your name and never sees your
password. Apple also gives us a token that we keep only so we can revoke Pawse's access to your
Apple ID when you delete your account.

While you are signed in, Pawse backs up to our server: your goals and streaks, daily minutes per
chosen app, your pause answers, recovery progress, your settings and smart-timing answers, and
your Screen Time selection. Apps are identified only by a random ID that Pawse creates and by
Apple's encrypted token; no app name is ever uploaded. Backups happen when you sign in and then
at most every six hours while you use Pawse.

Our server runs on **Cloudflare** (Workers and D1 database). Data is encrypted in transit
(HTTPS) and at rest by Cloudflare.

### Nothing else

Pawse sends no analytics events, crash reports or advertising identifiers. If you have chosen in
iOS Settings to share analytics with app developers, Apple may share anonymous crash and usage
reports with us under Apple's own privacy policy.

## Permissions and why Pawse needs them

- **Screen Time:** to pause and lock the apps you choose and count your time in them, as above.
- **Notifications (optional):** for daily reminders, your goals summary and the lock-override
  prompt.

## Sharing

We don't sell or rent your data, and we don't share it for advertising. Data reaches only the
service providers above, acting on our behalf: Apple (Sign in with Apple, only if you choose it)
and Cloudflare (our server). We may disclose information if the law requires it.

## Retention and deletion

- On your device: until you delete Pawse.
- Backed-up data: until you delete your account. In the app, go to **You › Account & backup ›
  Delete account**; this immediately deletes your account and everything backed up to it and
  revokes Pawse's access to your Apple ID. Data on your device is kept. You can also ask at
  [pawse.liveintently.app/delete-account](/delete-account).
- Signing out stops backing up but keeps your backup until you delete the account.

## Your rights

Depending on where you live (for example under the GDPR or CCPA) you can ask to access, correct,
export or delete your data, or object to its processing. Email
[pawse@liveintently.app](mailto:pawse@liveintently.app) and we'll reply within 30 days.

## Children

Pawse is not directed at children under 13 and we don't knowingly collect their data. If you
believe a child has given us data, contact us and we'll delete it.

## Changes

We'll post any change here with a new date, and tell you in the app when the change is
significant.
