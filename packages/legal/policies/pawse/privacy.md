---
title: Privacy Policy for Pawse (Android)
updated: 2026-10-02
---

Pawse (formerly Intently) helps you notice and cut back on compulsive app use by showing a short
pause before the apps you choose. This policy explains what the Android app collects, why, and
where it goes. The [Chrome extension](/privacy/chrome) has its own policy, and so does our iPhone and
iPad app, [Respite](https://respite.liveintently.app/privacy/).

**Developer:** MD Sadakat Hussain Fahad, publishing as Intently ·
**Contact:** [pawse@liveintently.app](mailto:pawse@liveintently.app)

## The short version

- Your app-usage history is tracked and stored **on your phone**.
- You don't need an account. If you sign in, your Pawse data syncs to our server so you can back
  it up and use it on more than one device.
- The app sends **analytics events** and **crash reports** to Google Firebase to help fix bugs and
  improve the app.
- We don't show ads and we don't sell your data.

## What stays on your phone

Pawse keeps this in its private storage on your device:

- **Which apps you chose to track** and the limits and goals you set.
- **Usage sessions:** when you opened a tracked app, for how long, and how you responded to each
  pause (went back, continued, snoozed).
- **Daily statistics, streaks and achievements** built from those sessions.
- **Settings and preferences.**

Usage sessions older than 90 days are deleted automatically. Uninstalling Pawse deletes everything
stored on the phone.

## Information that leaves your phone

### If you sign in (optional)

You can sign in with Google, Facebook or Apple. We then receive your **email address**, the
**account identifier** from that provider and your **name** if the provider shares it. We never
see your password.

While you are signed in and sync is on, Pawse uploads your goals, usage sessions and events,
daily statistics, intervention results, streak recoveries, your baseline and your settings to
our server, which runs on **Cloudflare** (Workers and D1 database). This lets you restore your
data and use Pawse on another device. Data is encrypted in transit (HTTPS) and at rest by
Cloudflare.

### Analytics (Google Firebase Analytics)

Pawse sends usage events to Firebase Analytics, such as when a pause is shown, what you chose,
when you finish onboarding, and which features you use. Events are tied to a random app-instance
ID, not your name or email, and include basic device information (model, Android version,
country from your IP). When an event is about a tracked app, it names the app if it is a widely
used one (for example Instagram or YouTube); any other app is reported only by its category
(such as "game" or "social"). Analytics is not collected from development builds.

### Crash reports (Firebase Crashlytics)

If Pawse crashes, a crash report (the error, the code location, device model and Android version,
and a random installation ID) is sent to Firebase Crashlytics.

### App updates and messages (Firebase Remote Config and Cloud Messaging)

Pawse checks Firebase Remote Config for app-update and feature settings, and can receive push
messages through Firebase Cloud Messaging. These use a device token, not your personal data.

## Permissions and why Pawse needs them

- **Usage access** (`PACKAGE_USAGE_STATS`): to see which app is in the foreground and for how
  long, so Pawse can pause before tracked apps and count your time. It never reads what you do
  inside an app.
- **Display over other apps** (`SYSTEM_ALERT_WINDOW`): to show the pause and timer screens.
- **Accessibility service (optional):** if you turn on Reels and Shorts blocking, Pawse's
  accessibility service reads the on-screen layout of the supported apps (such as Instagram and
  YouTube) to recognise the short-video feed and cover it. It looks only for that feed, keeps
  nothing it reads, and sends nothing it reads off the phone.
- **Foreground service, notifications, wake lock, start at boot:** to keep monitoring running
  and show its required notification.
- **See installed apps** (`QUERY_ALL_PACKAGES`): to list your apps so you can choose which to
  track.
- **Ignore battery optimisation (asked only when you tap it):** so Android doesn't stop
  monitoring.
- **Internet:** for sign-in, sync, analytics, crash reports and update checks.
- **Vibrate:** for gentle haptic feedback.

## Sharing

We don't sell or rent your data, and we don't share it for advertising. Data reaches only the
service providers above, acting on our behalf: Google (Firebase Analytics, Crashlytics, Remote
Config, Cloud Messaging, Google Sign-In), Meta (Facebook Login, only if you choose it), Apple
(Sign in with Apple, only if you choose it) and Cloudflare (our server). We may disclose
information if the law requires it.

## Retention and deletion

- On the phone: usage sessions after 90 days; everything when you uninstall.
- Synced data: until you delete your account. You can delete it in the app (Account) or at
  [pawse.liveintently.app/delete-account](/delete-account); we confirm by email and then delete
  your account and all synced data.
- Firebase keeps analytics and crash data according to Google's retention settings (analytics
  events for up to 14 months).

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
