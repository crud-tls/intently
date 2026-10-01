import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'Your recurring tasks, fitted into your week.',
	subhead: 'Tell Loop what you want to do regularly and when you are free. It places each task into a fitting gap and reminds you when it is time.',
	features: [
		{ title: 'Tasks that repeat', body: 'Give each task a duration, how often it repeats, a priority and a colour.' },
		{ title: 'Your free time, your rules', body: 'Mark recurring time blocks like work hours, add buffers between tasks, and say if you prefer mornings.' },
		{ title: 'Scheduled for you', body: 'Loop places tasks into the gaps that fit. Mark each one done or skipped as the week goes.' },
		{ title: 'Reminders on time', body: 'A notification when a task is due, and reminders survive a phone restart.' },
		{ title: 'Private by design', body: 'No account and no internet permission. Everything stays on your phone.' },
	],
	faq: [
		{ q: 'Does Loop need an internet connection?', a: "No. Loop doesn't even have internet permission; it works fully on your phone." },
		{ q: 'Where is my data stored?', a: "In a database on your phone. Uninstalling Loop or clearing its data deletes it." },
		{ q: 'Is Loop free?', a: 'Yes.' },
	],
	legal: { privacy: true, terms: false },
};
