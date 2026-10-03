import type { SiteContent } from '@intently/ui/site';

// Copy for Respite's site. Keep every claim to what the iOS app actually does.
export const content: SiteContent = {
	headline: 'A short pause before the apps that eat your day.',
	subhead: 'Respite puts a gentle check-in in front of the apps you pick, so opening them becomes a choice instead of a reflex. Set daily limits you can keep, lock an app when its time is up, and watch your streaks grow.',
	features: [
		{ title: 'A pause when you open an app', body: 'A short, friendly check-in covers a tracked app. Leave, or continue after a moment.' },
		{ title: 'Three ways to pause', body: 'Pause every time, let Smart timing space the check-ins to suit you, or set a time budget before you start.' },
		{ title: 'Limits and an app lock', body: "Set a daily limit for each app. Turn on the lock and the app is covered once today's time is used; it refreshes at midnight." },
		{ title: 'Private by design', body: "Built on Apple's Screen Time, which keeps the apps you pick private, even from Respite. App names never leave your iPhone." },
	],
	faq: [
		{ q: 'Do I need an account?', a: 'No. Respite works fully without one. Signing in with Apple is optional and only backs up your progress so a new or reset iPhone can restore it.' },
		{ q: 'Can Respite see what I do inside my apps?', a: "No. Apple's Screen Time tells Respite how many minutes you have used an app you picked, never what you do in it, and not even the app's name." },
		{ q: 'Does Respite have ads or sell data?', a: 'No ads, no analytics or tracking SDKs, and we never sell your data.' },
		{ q: 'Which devices does it run on?', a: 'iPhone and iPad with iOS 17.4 or later.' },
	],
	legal: { privacy: true, terms: true },
	accountDeletion: {
		inApp: 'Open Respite, go to You, then Account & backup, and choose Delete account. Your account and everything backed up to it are deleted right away, and Respite\'s access to your Apple ID is revoked.',
		byEmail: 'No longer have the app?',
		whatIsDeleted: ['Your account and Sign in with Apple link', 'Backed-up goals, streaks and daily totals', 'Backed-up pause answers and settings'],
	},
};
