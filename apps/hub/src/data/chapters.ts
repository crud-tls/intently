/**
 * The seven chapters of the day, in order. The home page walks through them from dawn to night and
 * each has its own page. Copy rules: second person, short sentences, no guilt, nothing we can't
 * stand behind; every number shown to a visitor states its assumptions next to it.
 */
import { app, type App } from '@intently/registry';
import type { SkyKey } from './sky.ts';

export type ChapterId = 'time' | 'attention' | 'health' | 'wealth' | 'relationships' | 'self' | 'faith';

export interface Chapter {
	id: ChapterId;
	/** The part of life, as a visitor would name it. */
	name: string;
	path: string;
	sky: SkyKey;
	/** When in the day this chapter happens. */
	clock: string;
	/** This aspect's light: its star in the night sky and its accents. */
	light: string;
	title: string;
	/** The home page's one-paragraph version, read over the landscape. */
	home: string;
	/** The link from the home page to the chapter page: says what the visitor will do there. */
	deeper: string;
	meta: { title: string; description: string };
	lede: string[];
	feel: {
		heading: string;
		/** What the interactive asks of the visitor (shown once it can run). */
		intro: string;
		/** The worked example shown before (or without) JavaScript. */
		example: string;
		assumptions: string[];
	};
	reflection: string[];
	practice: { heading: string; body: string[] };
	apps: App[];
	/** Why this app belongs to this part of life, in one or two plain sentences. */
	appLine: string;
	verse?: { arabic: string; translation: string; source: string; translator: string };
}

export const CHAPTERS: Chapter[] = [
	{
		id: 'time',
		name: 'Time',
		path: '/time/',
		sky: 'dawn',
		clock: '5:50 am',
		light: '#FFB077',
		title: 'You get about four thousand weeks.',
		home: "If you live to eighty, that's about four thousand Mondays. Intention can't add more of them. It decides what goes into the ones you have.",
		deeper: 'Count your weeks',
		meta: {
			title: 'Your life in weeks',
			description: 'See your life as about 4,000 weeks and decide what goes into this one. A quiet page about time, with Loop, our app for fitting what matters into your week.',
		},
		lede: [
			"Time never feels short on a Tuesday. There's always another one coming. Lay the weeks side by side, though, and something shifts: each square is small, and each one counts.",
		],
		feel: {
			heading: 'Your life in weeks',
			intro: 'Each square is one week. Type your age and watch the weeks you have lived fill in.',
			example: 'A life at thirty: each square is a week, and the filled ones are already lived.',
			assumptions: [
				'An eighty-year life, as an example, not a prediction.',
				'Fifty-two weeks to a year, so the frame holds about 4,160 squares.',
			],
		},
		reflection: [
			'What happens every week that you never actually chose?',
			'What do you keep meaning to make room for?',
			'If this week were the only square anyone saw, what would you want in it?',
		],
		practice: {
			heading: 'Put the big thing in first',
			body: [
				'Before the week starts, pick one thing that matters to you: a call, a long walk, a page of writing, an hour with someone you love.',
				'Give it a day and a time, the way you would a meeting. Let everything else fit around it.',
			],
		},
		apps: [app('loop')],
		appLine: 'Loop places your recurring tasks into the free gaps in your week, so the things you mean to do every week actually get a slot.',
	},
	{
		id: 'attention',
		name: 'Attention',
		path: '/attention/',
		sky: 'morning',
		clock: '7:10 am',
		light: '#7FC8FF',
		title: 'Whatever holds your attention holds your day.',
		home: "Before your feet touch the floor, a dozen apps have asked for you. Your attention is where your life actually happens. It's worth choosing where it goes.",
		deeper: 'Clear the noise',
		meta: {
			title: 'Your attention',
			description: 'Notice what pulls at you, take one breath, and choose. A page about attention, with Pawse and Respite, our apps for a short pause before the apps that eat your day.',
		},
		lede: [
			"Most of us never decide to spend an hour on our phone. We decide to check one thing, and an hour happens. The fix isn't more willpower. It's a gap: one breath between the urge and the tap.",
		],
		feel: {
			heading: 'Hold to breathe',
			intro: 'This box gets noisy, the way a morning does. Hold the button, or hold the space bar, for one slow breath. Then tell it how long you spend on your phone each day.',
			example: 'At four hours a day, a phone takes 1,460 hours a year: about 91 full waking days.',
			assumptions: [
				'A waking day is sixteen hours.',
				'Years are counted from the age and life length you choose.',
			],
		},
		reflection: [
			'Which app do you open without deciding to?',
			'What would you like to be the first thing you see each morning?',
			'What did you notice the last time your phone was in another room?',
		],
		practice: {
			heading: 'One breath before the tap',
			body: [
				'Pick one app you open too often. Each time you reach for it today, take one slow breath first and ask yourself what you came for.',
				"If you have an answer, go ahead. If you don't, that's your answer.",
			],
		},
		apps: [app('pawse'), app('respite')],
		appLine: 'Pawse (for Android and Chrome) and Respite (for iPhone) put that breath in for you: a short, kind pause before the apps you choose, with gentle daily limits.',
	},
	{
		id: 'health',
		name: 'Health',
		path: '/health/',
		sky: 'noon',
		clock: '12:40 pm',
		light: '#FFE58A',
		title: 'Your body is listening to every ordinary day.',
		home: "Health is rarely one big decision. It's the stairs, the walk after lunch, the night you go to bed on time. Small, repeated, slightly boring, and you can start at lunch.",
		deeper: 'Breathe and find your pace',
		meta: {
			title: 'Your health',
			description: 'Small, repeated choices add up in the body. Breathe with us for a minute, see what everyday steps add up to, and meet PaceShift, marathon training that adapts to your runs.',
		},
		lede: [
			'We tend to treat health as a project: a diet, a programme, a fresh start on Monday. But the body mostly keeps track of ordinary days. How you breathe when you are stressed. How far you walk without noticing. How you sleep.',
		],
		feel: {
			heading: 'Breathe, then add it up',
			intro: 'Follow the square: in for four, hold for four, out for four, hold for four. Then see what your everyday steps add up to.',
			example: 'Six thousand steps a day is about 4.5 km. Over a year that is 1,643 km: the length of 39 marathons, just from living.',
			assumptions: [
				'A step is about 0.75 m. Yours may be longer or shorter.',
				'A marathon is 42.195 km.',
			],
		},
		reflection: [
			'When did you last feel strong in your body?',
			'Which small habit would you thank yourself for in ten years?',
			'What is your body asking for that you keep putting off?',
		],
		practice: {
			heading: 'Ten minutes after a meal',
			body: [
				'Today, walk for ten minutes after one meal. No tracking and no target.',
				'Notice how you feel an hour later. That is the whole practice.',
			],
		},
		apps: [app('paceshift')],
		appLine: 'PaceShift is for when the walking turns into running: marathon training that adapts to how your runs actually go, not to a plan written for someone else.',
	},
	{
		id: 'wealth',
		name: 'Wealth',
		path: '/wealth/',
		sky: 'afternoon',
		clock: '3:30 pm',
		light: '#FFCB6B',
		title: 'Money mostly leaves in small amounts.',
		home: 'Nobody decides to spend a month of rent on delivery fees. It leaks out a little at a time. Knowing where it goes lets it go where you mean it to.',
		deeper: 'Watch a small amount add up',
		meta: {
			title: 'Your money',
			description: 'Small daily amounts add up to surprising sums. See yours, set it aside on purpose, and meet Hisab, an app that logs your spending from bank SMS without typing.',
		},
		lede: [
			'The big purchases we think about for weeks. The small ones we barely notice, and those are the ones that add up. None of this is about guilt. It is about seeing clearly, so your money goes to the things, and the people, you care about.',
		],
		feel: {
			heading: 'A small amount, every day',
			intro: 'Pick a small daily amount: a coffee, a delivery fee, a subscription you forgot about. Watch the jar fill.',
			example: 'Five a day, in any currency, is 1,825 in a year and 18,250 in ten years, simply set aside.',
			assumptions: [
				'Simply set aside: no interest and no returns.',
				'Switch on growth only as an illustration. It is before inflation and fees, and it is not advice.',
			],
		},
		reflection: [
			"What did you spend on last week that you'd happily spend on again?",
			"What did you spend on that you can't remember?",
			'Who would you help if you had a little more set aside?',
		],
		practice: {
			heading: 'Write it down, change nothing',
			body: [
				"For one week, note every spend the moment it happens. Don't cut anything yet. Just look.",
				'At the end of the week, mark the ones that made your life better and keep those. If you can, set a small amount aside to give away.',
			],
		},
		apps: [app('hisab')],
		appLine: 'Hisab reads the transaction texts your bank already sends you and logs your spending, so you can see where your money goes without typing a thing.',
	},
	{
		id: 'relationships',
		name: 'Relationships',
		path: '/relationships/',
		sky: 'dusk',
		clock: '6:40 pm',
		light: '#FF8E8E',
		title: 'The people you love are not a someday.',
		home: "There's always next weekend, the next holiday, next summer. Until there isn't. That's not a reason to be sad. It's a reason to call tonight.",
		deeper: 'See the time you have together',
		meta: {
			title: 'Your people',
			description: 'The time we have with the people we love is limited and precious. See it plainly, ask a better question tonight, and meet TwoHearts, one daily question for two people.',
		},
		lede: [
			'If you see your parents a few times a year, the number of visits left is smaller than it feels. The same goes for old friends, grandparents, a brother or sister in another city. Counting is not morbid. It turns an ordinary dinner into what it really is.',
		],
		feel: {
			heading: 'The visits ahead',
			intro: "Think of someone you love who doesn't live with you. Tell us their age and how often you see them, and we'll draw the visits ahead. If the person you thought of is no longer here, we're sorry. You're welcome to skip this one.",
			example: 'Someone who is sixty, seen four times a year: about a hundred more visits. Each dot is one.',
			assumptions: [
				'They live to about eighty-five. An assumption, not a prediction.',
				'You keep seeing them as often as you do now.',
			],
		},
		reflection: [
			'Who would you call if you had ten free minutes right now?',
			'When did you last ask someone a question and really listen to the answer?',
			'What do you wish you had said to someone, and could still say?',
		],
		practice: {
			heading: 'Ask one new question',
			body: [
				'Tonight, ask someone you love a question you have never asked them. What were you like at my age? What small thing makes you feel cared for?',
				"Then just listen. Don't fix, don't advise.",
			],
		},
		apps: [app('twohearts')],
		appLine: 'TwoHearts gives two people who love each other one question a day, so you keep learning about each other long after you think you know everything.',
	},
	{
		id: 'self',
		name: 'Self',
		path: '/self/',
		sky: 'bluehour',
		clock: '8:15 pm',
		light: '#C9B8FF',
		title: "You're becoming someone, either way.",
		home: "Every day leaves a small mark on who you are. You don't need a new you. You need to notice the one you're already shaping.",
		deeper: "Meet who you're becoming",
		meta: {
			title: 'Yourself',
			description: 'Who you become is built from small daily acts. Slow down, choose a few, and watch the figure take shape. With Mirror, an app for finding the looks that suit your face.',
		},
		lede: [
			"In a hurry, we're a blur, even to ourselves. Slow down and the outline sharpens: the way you stand, what your face does when you are at ease, the person you are when nobody is watching. That person is built from small things, repeated.",
		],
		feel: {
			heading: "Who you're becoming",
			intro: 'The figure starts as a blur. Hold still and it sharpens. Then choose the small acts you want more of, and watch each one add to it.',
			example: 'Someone who is rested, kind and present: three small acts, repeated, and the outline sharpens.',
			assumptions: [],
		},
		reflection: [
			'Who are you when nobody is watching?',
			'What does your face look like when you are at ease?',
			'Which small act, repeated for a year, would change you most?',
		],
		practice: {
			heading: 'Ten seconds in the mirror',
			body: [
				'Tonight, look in a mirror for ten seconds longer than usual. Relax your jaw and your shoulders.',
				"Stand the way you would if you were quietly proud of today. Then choose one small thing to repeat tomorrow.",
			],
		},
		apps: [app('mirror')],
		appLine: 'Mirror helps with the outside part: finding the hairstyles and looks that suit your face, so the way you look feels like you.',
	},
	{
		id: 'faith',
		name: 'Faith',
		path: '/faith/',
		sky: 'lantern',
		clock: '10:30 pm',
		light: '#F2B84B',
		title: 'Every heart needs somewhere to rest.',
		home: "At the end of the day, something in us wants to come home. For many of us it's the Quran: a lantern carried through the dark, one verse at a time.",
		deeper: 'Light the lantern',
		meta: {
			title: 'Your heart',
			description: 'A still minute at the end of the day. Light a lantern, read a verse, and meet Qandeel, the Quran on your phone and your watch, offline and in sync.',
		},
		lede: [
			'Whatever your tradition, the heart needs stillness the way the body needs sleep: a few quiet minutes away from the noise, with something larger than the day you just had.',
			'Qandeel means lantern. We made it to keep the Quran close, on your phone and on your wrist, even offline.',
		],
		feel: {
			heading: 'Light the lantern',
			intro: 'Hold the lantern, or press the button a few times, and let it brighten slowly. Stay as long as you like.',
			example: 'A lantern, lit, and a verse to sit with.',
			assumptions: [],
		},
		reflection: [
			"What gives you meaning that doesn't depend on how today went?",
			'When did you last feel truly still?',
			'What are you grateful for tonight?',
		],
		practice: {
			heading: 'One still minute',
			body: [
				'Before you sleep, put your phone in another room. Sit for one minute and breathe slowly.',
				'Bring to mind three things today gave you. If you pray, let this minute be part of it.',
			],
		},
		apps: [app('qandeel')],
		appLine: 'Qandeel keeps the Quran close: recitations and translations downloaded for offline listening, on your phone and your Wear OS watch, kept in sync. No account, no analytics, no ads.',
		verse: {
			arabic: 'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
			translation: 'Those who have believed and whose hearts are assured by the remembrance of Allāh. Unquestionably, by the remembrance of Allāh hearts are assured.',
			source: 'Quran 13:28 (Ar-Raʿd)',
			translator: 'Saheeh International',
		},
	},
];

export function chapter(id: ChapterId): Chapter {
	const found = CHAPTERS.find((c) => c.id === id);
	if (!found) throw new Error(`Unknown chapter: ${id}`);
	return found;
}

/** The day loops: after the night comes dawn again. */
export function neighbours(id: ChapterId): { prev: Chapter; next: Chapter } {
	const i = CHAPTERS.findIndex((c) => c.id === id);
	const n = CHAPTERS.length;
	return { prev: CHAPTERS[(i - 1 + n) % n], next: CHAPTERS[(i + 1) % n] };
}
