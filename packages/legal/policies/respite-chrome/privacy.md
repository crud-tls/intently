---
title: Privacy Policy for Respite for Chrome
updated: 2026-10-05
---

Respite: Screen Time Control is the browser extension of Respite, for Chrome and other
Chromium browsers. The iPhone app has [its own policy](/privacy).

**Developer:** MD Sadakat Hussain Fahad, publishing as Intently ·
**Contact:** [support@liveintently.app](mailto:support@liveintently.app)

Respite is a browser extension that pauses you before the websites you choose and
shows you how much time you spend on them. Everything it records stays in your
browser, on your device, unless you choose to share anonymous usage statistics.

## The short version

- Respite has no account and no server of its own.
- As installed it makes no network requests at all. Nothing leaves your device.
- There is one switch, off until you turn it on: "Share anonymous usage statistics"
  in Settings. What it sends is listed below.
- It records time only for the sites you add to it.
- You can export everything Respite has stored, or delete it all, from Settings.
- Removing the extension deletes everything it stored.

## What Respite stores, and where

All of this is kept in your browser's extension storage on this device.

| What | Why |
|---|---|
| The sites you chose and the daily limit for each | To know where to pause and what your goals are |
| Sessions on those sites: start, end, and active time by hour | Today's progress, streaks and the Stats page |
| How you responded to each pause (went back, continued, snoozed, how long you took, whether the timing was good) | To learn which kinds of pause help you, and when |
| Why a pause was shown or held back (a short log, kept 90 days) | So Respite's timing can be explained and checked |
| Your answers to the optional ten questions | To choose which pauses to try first |
| Streaks, streak freezes and daily totals | Goals and progress |
| How many Shorts, Reels or TikTok videos you watched today, and the ids of the ones already counted (only if you switch that limit on; today's only) | To hold you to the daily number you chose, counting each video once |
| Your first-week progress and which one-time notes you have already seen | So the quest and the celebrations on the Today page are shown once |
| Reminder settings, and which reminders were shown and when (kept 90 days) | To keep to three reminders a day and never show the same one twice |
| Your settings | Theme, pause length and so on |

Respite keeps sessions, daily totals and pause responses for 90 days, then deletes
them. Your sites, limits, streaks and settings are kept until you remove the
extension.

## What Respite can see, and what it does with it

**The address of the tab you are viewing.** Respite needs it to tell whether you
are on one of your sites. If you are not, nothing is recorded. To make "go back"
work, Respite remembers the last few pages of each open tab in the browser's
memory; that list is never written to disk and is gone when the browser closes.

**Whether you are at the computer.** Respite asks the browser whether the device
is idle or locked so that time away is not counted.

**The pages of your chosen sites.** Respite draws its pause, its lock and its
Shorts/Reels block on top of those pages. It does not read what is on them, with
one narrow exception: if you switch on the video limit for TikTok, a small script
runs on TikTok and notes when another video starts playing (the video's id, nothing
else), because TikTok's feed shows every video under one address. It runs on no
other site and is removed when you switch that limit off.

**Pages of a site you have locked.** If you switch on locking for a site, then once its
daily limit is used up the browser itself refuses to load that site's pages until
midnight, and Respite shows its own lock page instead. The rules that do this name only
the sites you chose to lock, stay in your browser, and are removed when the lock ends.
Respite does not use them to block ads, trackers or anything else.

**Your browsing history, once, if you allow it.** During setup you can let Respite
estimate where your last seven days went. It asks the browser only about a fixed
list of popular sites (YouTube, Instagram, Reddit and similar), counts visit times
on this device, shows you the estimate, and then gives the permission back. The
estimate is not saved. You can skip this step.

## Usage statistics (off unless you switch them on)

Respite can send anonymous statistics about how it is used, to help improve it. This is
off when you install Respite and stays off until you switch on "Share anonymous usage
statistics" in Settings. On Firefox, the browser asks you as well. You can switch it off
again at any time, here or in Firefox's own add-on settings.

**While it is off:** nothing is collected for sending, nothing is sent, and no identifier
exists. Respite makes no network requests.

**While it is on, Respite sends:**

- What happened inside Respite, as counts and choices: a pause was shown, you went back or
  continued and how long that took, a lock or a Shorts/Reels block was shown, a goal was met
  or missed, a streak grew or ended, a setting was changed, which Respite page was opened,
  a reminder was shown or clicked.
- A summary of each day from the day you switched it on: minutes and sessions per tracked
  site, your limit, and how many pauses you had. Earlier days are never sent.
- A few broad facts about your setup, in buckets: how long you have had Respite, how many
  sites you track, light or heavy use and how often you kept to your limits over the last
  seven days, your most-used tracked site (named only if it is a well-known one), your
  streak, your pause mode, whether strict mode and reminders are on, and which permissions
  Respite has.
- A random id made when you switch statistics on. It is not linked to you, your browser
  account or anything else, and it is deleted when you switch statistics off. Switching
  them on again makes a new one.

**How sites are named.** A well-known site from Respite's built-in list (YouTube,
Instagram and similar) is named. Any other site, including every address you typed in
yourself, is sent only as "other". Its address never leaves your device.

**Never sent:** addresses of pages, page content, what you type, your answers to the ten
questions, or your browsing on sites you have not added.

**Where it goes.** To Google Analytics (Google LLC), directly from your browser, over
HTTPS, marked as not for ad personalisation. Google receives your IP address as part of
any connection; Respite does not send it as data and does not use Google's advertising
features. Statistics are sent in small batches about a minute after they happen.

**Switching it off** sends one last message saying so, then deletes the id and anything
not yet sent. What was already sent cannot be recalled from here; it carries only the
random id, which no longer exists on your device.

The full list of events and their fields is in the extension's source code.

## What Respite does not do

- It does not send anything anywhere unless you switch on usage statistics.
- It does not record sites you have not added.
- It does not read page content, forms, passwords or messages.
- It does not sell data, show ads or build a profile of you.

## Permissions

| Permission | Used for |
|---|---|
| Access to websites | Showing the pause on the sites you choose, whichever they are |
| Tabs, web navigation | Knowing which site the tab you are viewing is on |
| Scripting | Putting the pause, the lock or the Shorts/Reels block on the page; the video counter on TikTok when you switch its limit on |
| Block content on pages (declarativeNetRequestWithHostAccess) | Refusing to load a site you have locked once its daily limit is used up. Used for nothing else, and only on sites Respite already has access to |
| Idle | Not counting time when you are away |
| Alarms | Timekeeping while the browser is open, and the midnight rollover |
| Storage | Keeping your data on this device |
| History (optional) | The one-time seven-day estimate during setup |
| Notifications (optional) | Reminders, asked for only when you switch them on in Settings and handed back when you switch them off |

## Your data: a copy, or gone

**Export.** Settings → Your data → Export saves everything Respite has stored in this
browser as one file on your device (JSON, readable in any text editor). Nothing is
uploaded. The file does not include the short in-memory list of recently open pages
used for "go back", which is never stored.

**Delete.** Settings → Your data → Delete everything removes your sites, limits,
history, streaks, answers and settings from this browser, takes down anything Respite
had set up because of them (locks, reminders, the video counter), hands back the
optional permissions, and starts Respite over as if newly installed. If usage
statistics were on, the random id and anything not yet sent are deleted without
sending anything. This cannot be undone.

Remove a single site on the Sites page to stop tracking it. Removing the extension
from your browser also deletes everything Respite stored.

## Children

Respite is not directed at children under 13 and collects no personal information
from anyone.

## Changes

If a later version changes what can leave your device, this policy will be updated
first, and anything new will be off until you switch it on.

## Contact

Questions or problems: [support@liveintently.app](mailto:support@liveintently.app)
