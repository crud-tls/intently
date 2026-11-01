// Copy for Respite's site. Respite runs on iPhone, Android and Chrome, and the three are not the
// same product: keep every claim to what that platform's app does. iPhone features come from the
// iOS app (Apple's Screen Time); Reels and Shorts blocking, widgets and the accessibility service
// are Android-only; the Chrome extension tracks and pauses websites.

export interface Feature {
	title: string;
	body: string;
}

export interface Faq {
	q: string;
	a: string;
}

export type PlatformId = 'ios' | 'android' | 'chrome';

export interface PlatformContent {
	id: PlatformId;
	/** Short label for cards and tags. */
	name: string;
	/** Title of the platform's card on the home page. */
	title: string;
	summary: string;
	/** What this platform's app does, and only that. */
	features: string[];
	/** Paths of this platform's legal pages. */
	privacy: string;
	terms?: string;
}

export interface SiteContent {
	headline: string;
	subhead: string;
	/** What the pause does, which is true on every platform. */
	features: Feature[];
	platforms: PlatformContent[];
	faq: Faq[];
	/** Which legal pages the site has. */
	legal: { privacy: boolean; terms: boolean };
	/** How to delete an account and its data (Play and the App Store require a web page). */
	accountDeletion: { inApp: string; byEmail: string; whatIsDeleted: string[] };
}

export const content: SiteContent = {
	headline: 'A short pause before the apps that eat your day.',
	subhead: 'Respite puts a gentle check-in in front of the apps you pick, so opening them becomes a choice instead of a reflex. Set daily limits you can keep and watch your streaks grow, on iPhone, Android and Chrome.',
	features: [
		{ title: 'A pause when you open an app', body: 'A short, friendly check-in covers a tracked app. Leave, or continue after a moment.' },
		{ title: 'Limits you can keep', body: 'Set a daily limit for each app you track and see your day at a glance.' },
		{ title: 'Streaks, not guilt', body: 'Every day you choose presence over scrolling, your streak grows. No lectures.' },
		{ title: 'Private by design', body: 'No ads, and we never sell your data. What each version collects is spelled out in its privacy policy.' },
	],
	platforms: [
		{
			id: 'ios',
			name: 'iPhone',
			title: 'iPhone and iPad',
			summary: "Built on Apple's Screen Time, which keeps the apps you pick private, even from Respite. App names never leave your iPhone.",
			features: [
				'A pause when you open an app you picked',
				'Three ways to pause: every time, Smart timing, or a time budget',
				"Daily limits and an app lock that covers an app once today's time is used",
				"Built on Apple's Screen Time, so app names stay on your iPhone",
			],
			privacy: '/privacy/',
			terms: '/terms/',
		},
		{
			id: 'android',
			name: 'Android',
			title: 'Android',
			summary: 'A mindful pause before the apps you choose, daily limits, usage analytics and streaks.',
			features: [
				'A pause before the apps you choose',
				'Usage analytics and daily limits',
				'Optional Reels and Shorts blocking, using the Accessibility service',
				'Streaks and home screen widgets',
			],
			privacy: '/privacy/android/',
			terms: '/terms/android/',
		},
		{
			id: 'chrome',
			name: 'Chrome',
			title: 'Chrome extension',
			summary: 'The same pause for the websites that pull you in on a laptop.',
			features: ['Website time tracking', 'Focus mode', 'Usage insights', 'Quick settings'],
			privacy: '/privacy/chrome/',
		},
	],
	faq: [
		{ q: 'Do I need an account?', a: 'No. The core features work without signing in, on every platform. An account (Google or Apple sign-in) is only needed if you want to sync across your devices with Respite Plus, the optional upgrade.' },
		{ q: 'Which devices does it run on?', a: 'iPhone and iPad (iOS 17.4 or later), Android phones, and Chrome on your computer. Each is its own app with its own settings.' },
		{ q: 'Can Respite see what I do inside my apps?', a: "No. On iPhone, Apple's Screen Time tells Respite how many minutes you have used an app you picked, never what you do in it, and not even the app's name. On Android, Respite reads which app is in front so it can pause it, never what is on screen, unless you turn on the optional Reels and Shorts blocking, which uses the Accessibility service." },
		{ q: 'Does Respite have ads or sell data?', a: 'No ads, and we never sell your data. What each version collects, if anything, is listed in its privacy policy.' },
		{ q: 'Does it sync between my phone and my computer?', a: 'Without an account, each device keeps its own history and settings on that device. Sync across devices is part of the optional Respite Plus upgrade and needs you to sign in.' },
		{ q: 'Is Respite free?', a: 'Yes. Respite is free with no ads. An optional upgrade, Respite Plus, adds sync across devices and extras such as more schedules, longer focus sessions and richer insights.' },
	],
	legal: { privacy: true, terms: true },
	accountDeletion: {
		inApp: 'On iPhone, open Respite, go to You, then Account & backup, and choose Delete account. Your account and everything backed up to it are deleted right away, and Respite\'s access to your Apple ID is revoked.',
		byEmail: 'No longer have the app, or signed in on Android?',
		whatIsDeleted: ['Your account and its sign-in link (Apple, Google or Facebook)', 'Backed-up goals, streaks and daily totals', 'Backed-up pause answers and settings'],
	},
};
