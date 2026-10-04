import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'Marathon training that adapts to your runs.',
	subhead: 'PaceShift reads the runs you already record, shows your pace and splits, and keeps your training plan in step with how training is really going, with an AI coach to explain it.',
	features: [
		{ title: 'Your runs, imported', body: 'Runs come in from Health Connect on Android or Apple Health on iPhone, along with heart rate and calories.' },
		{ title: 'Pace, splits and trends', body: 'See how each run went and how your fitness is moving week to week.' },
		{ title: 'A plan that adjusts', body: 'Build toward race day with a training plan that adapts as your runs come in.' },
		{ title: 'An AI coach', body: 'Ask why a run felt hard or what to do this week, and get answers grounded in your own training.' },
		{ title: 'Reminders on time', body: 'Get reminded about planned runs, even after a phone restart.' },
	],
	faq: [
		{ q: 'Does PaceShift track my runs with GPS?', a: 'No. It reads runs recorded by your watch or running app through Health Connect or Apple Health.' },
		{ q: 'What does the AI coach see?', a: 'A summary of your training data, without your name or email. The privacy policy has the details.' },
		{ q: 'When is PaceShift coming?', a: "It's in development for Android and iOS. Tap \"Tell me when it's out\" and we'll email you." },
	],
	legal: { privacy: true, terms: true },
	accountDeletion: {
		inApp: 'Open PaceShift, go to Settings, and choose Delete account. Your account and synced data are deleted right away.',
		byEmail: "No longer have the app?",
		whatIsDeleted: ['Your account and sign-in details', 'Synced runs, training plans and settings'],
	},
};
