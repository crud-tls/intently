/**
 * Every app the Intently studio ships, in one place. The hub's app directory, each site's
 * footer and the legal pages read from here, so a new app or a changed address is one edit.
 */
/** live: public in a store. review: submitted, listing not public yet. soon: in development. */
export type AppStatus = 'live' | 'review' | 'soon';

export interface StoreLinks {
	play?: string;
	appStore?: string;
	chrome?: string;
}

export interface App {
	id: string;
	name: string;
	/** One line for cards and meta descriptions. */
	tagline: string;
	host: string;
	status: AppStatus;
	/** Per-app inbox on the apex, routed by Cloudflare Email Routing. */
	email: string;
	platforms: string[];
	stores: StoreLinks;
	/** Brand colour for cards and the app's site theme. */
	color: string;
	/** Square icon in the hub's public/icons/, or a monogram in the brand colour when absent. */
	icon?: string;
	/** Three short, true statements for the app's showcase row. */
	highlights?: string[];
	/** Hosts that should 301 to this app's site (old names). */
	aliases?: string[];
}

export const STUDIO = {
	name: 'Intently',
	host: 'liveintently.app',
	url: 'https://liveintently.app',
	email: 'support@liveintently.app',
	owner: 'MD Sadakat Hussain Fahad',
} as const;

export const APPS: App[] = [
	{
		id: 'respite',
		name: 'Respite',
		tagline: 'A short pause before the apps that eat your day.',
		host: 'respite.liveintently.app',
		status: 'live',
		// No per-app inbox yet (Email Routing needs a token scope); the studio inbox works today.
		email: 'support@liveintently.app',
		platforms: ['iOS', 'Android', 'Chrome'],
		stores: {
			appStore: 'https://apps.apple.com/us/app/respite-screen-time-control/id6757760293',
			play: 'https://play.google.com/store/apps/details?id=dev.sadakat.thinkfaster',
			chrome: 'https://chromewebstore.google.com/detail/intently-intentful-browsi/acjndeeecacgplloeefjjhlnlpgnonop',
		},
		color: '#FF8A3D',
		icon: '/icons/respite.svg',
		highlights: [
			'A short, kind pause before the apps you choose',
			'Daily limits and gentle timers, plus an app lock on iPhone',
			'On iPhone, Android and Chrome; your history stays on your device',
		],
		// Former names redirect here: Pawse (Android and Chrome), and InFocus before it.
		aliases: ['pawse.liveintently.app', 'infocus.liveintently.app'],
	},
	{
		id: 'qandeel',
		name: 'Qandeel',
		tagline: 'The Quran on your phone and your watch, offline and in sync.',
		host: 'qandeel.liveintently.app',
		status: 'review',
		email: 'qandeel@liveintently.app',
		platforms: ['Android', 'Wear OS'],
		stores: {},
		color: '#195039',
		icon: '/icons/qandeel.svg',
		highlights: [
			'Recitations and translations, downloaded for offline listening',
			'Phone and Wear OS watch stay in sync',
			'No account, no analytics, no ads',
		],
		aliases: ['qit.liveintently.app'],
	},
	{
		id: 'loop',
		name: 'Loop',
		tagline: 'Fit recurring tasks into your week without the juggling.',
		host: 'loop.liveintently.app',
		status: 'review',
		email: 'loop@liveintently.app',
		platforms: ['Android'],
		stores: {},
		color: '#5B6CFF',
		highlights: [
			'Recurring tasks placed into your free time automatically',
			'Reminders right when a task is due',
			'Everything stays on your phone',
		],
	},
	{
		id: 'mirror',
		name: 'Mirror',
		tagline: 'Find the hairstyles and looks that suit your face.',
		host: 'mirror.liveintently.app',
		status: 'soon',
		email: 'mirror@liveintently.app',
		platforms: ['Android', 'iOS'],
		stores: {},
		color: '#C2185B',
	},
	{
		id: 'paceshift',
		name: 'PaceShift',
		tagline: 'Marathon training that adapts to how your runs actually go.',
		host: 'paceshift.liveintently.app',
		status: 'soon',
		email: 'paceshift@liveintently.app',
		platforms: ['Android', 'iOS'],
		stores: {},
		color: '#1E88E5',
	},
	{
		id: 'twohearts',
		name: 'TwoHearts',
		tagline: 'One daily question for two people who love each other.',
		host: 'twohearts.liveintently.app',
		status: 'soon',
		email: 'twohearts@liveintently.app',
		platforms: ['Android', 'iOS'],
		stores: {},
		color: '#E53950',
	},
	{
		id: 'hisab',
		name: 'Hisab',
		tagline: 'Your spending, logged from bank SMS without typing a thing.',
		host: 'hisab.liveintently.app',
		status: 'soon',
		email: 'hisab@liveintently.app',
		platforms: ['Android'],
		stores: {},
		color: '#2E9E5B',
	},
];

export function app(id: string): App {
	const found = APPS.find((a) => a.id === id);
	if (!found) throw new Error(`Unknown app id: ${id}`);
	return found;
}
