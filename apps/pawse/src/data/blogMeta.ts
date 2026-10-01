export type BlogCategoryId =
	| 'getting-started'
	| 'app-guides'
	| 'time-solutions'
	| 'recovery'
	| 'comparisons'
	| 'privacy'
	| 'insights';

export interface BlogCategoryMeta {
	id: BlogCategoryId;
	label: string;
	description: string;
	accentColor: string;
}

export const BLOG_CATEGORIES: BlogCategoryMeta[] = [
	{
		id: 'getting-started',
		label: 'Getting Started',
		description: 'Foundations for better digital wellbeing habits.',
		accentColor: 'var(--intently-blue)',
	},
	{
		id: 'app-guides',
		label: 'App Guides',
		description: 'Platform-specific playbooks for social and media apps.',
		accentColor: 'var(--intently-purple)',
	},
	{
		id: 'time-solutions',
		label: 'Morning & Evening',
		description: 'Routines to regain your best focus windows.',
		accentColor: 'var(--intently-orange)',
	},
	{
		id: 'recovery',
		label: 'Recovery',
		description: 'Behavior-change strategies that actually stick.',
		accentColor: 'var(--intently-green)',
	},
	{
		id: 'comparisons',
		label: 'Comparisons',
		description: 'Deep dives into tools and alternatives.',
		accentColor: 'var(--intently-blue-dark)',
	},
	{
		id: 'privacy',
		label: 'Privacy',
		description: 'How to improve wellbeing without compromising your data.',
		accentColor: 'var(--intently-green-dark)',
	},
	{
		id: 'insights',
		label: 'Insights',
		description: 'Research-backed perspectives and trends.',
		accentColor: 'var(--intently-text-secondary)',
	},
];

export const BLOG_CATEGORY_LOOKUP: Record<BlogCategoryId, BlogCategoryMeta> = BLOG_CATEGORIES.reduce(
	(lookup, category) => {
		lookup[category.id] = category;
		return lookup;
	},
	{} as Record<BlogCategoryId, BlogCategoryMeta>,
);

export const BLOG_CATEGORY_MAP: Record<string, BlogCategoryId> = {
	'how-to-reduce-screen-time': 'getting-started',
	'what-is-digital-wellbeing': 'getting-started',
	'mindful-tech-interventions-vs-blocking': 'getting-started',
	'how-to-stop-doomscrolling': 'getting-started',
	'how-much-screen-time-is-too-much': 'getting-started',
	'why-willpower-fails-phone-addiction': 'getting-started',

	'stop-tiktok-scrolling': 'app-guides',
	'reduce-instagram-usage': 'app-guides',
	'stop-youtube-binge': 'app-guides',
	'stop-twitter-doomscrolling': 'app-guides',
	'stop-reddit-scrolling': 'app-guides',
	'youtube-shorts-addiction': 'app-guides',
	'instagram-reels-addiction': 'app-guides',

	'stop-checking-phone-morning': 'time-solutions',
	'stop-scrolling-at-night': 'time-solutions',
	'digital-detox-challenge': 'time-solutions',

	'how-to-stop-phone-addiction': 'recovery',
	'phone-addiction-help': 'recovery',
	'productive-without-deleting-social': 'recovery',
	'psychology-of-app-addiction': 'recovery',
	'phone-addiction-adhd': 'recovery',
	'social-media-addiction-signs': 'recovery',
	'screen-time-apps-for-students': 'recovery',

	'intently-vs-opal': 'comparisons',
	'intently-vs-one-sec': 'comparisons',
	'intently-vs-freedom': 'comparisons',
	'intently-vs-forest': 'comparisons',
	'intently-vs-screenzen': 'comparisons',
	'intently-vs-brick': 'comparisons',
	'intently-vs-google-digital-wellbeing': 'comparisons',
	'best-digital-wellbeing-apps-2026': 'comparisons',
	'google-digital-wellbeing-alternatives': 'comparisons',
	'opal-alternatives': 'comparisons',
	'freedom-alternatives': 'comparisons',
	'one-sec-alternatives': 'comparisons',
	'apple-screen-time-alternatives': 'comparisons',
	'forest-app-alternatives': 'comparisons',

	'privacy-first-screen-time-tracking': 'privacy',
};

export function getBlogCategoryId(slug: string): BlogCategoryId {
	return BLOG_CATEGORY_MAP[slug] ?? 'insights';
}

export function getBlogCategoryMeta(slug: string): BlogCategoryMeta {
	return BLOG_CATEGORY_LOOKUP[getBlogCategoryId(slug)];
}

export function getNormalizedHeroImage(image?: string): string {
	if (!image || image.trim().length === 0) {
		return '/blog-placeholder-2.jpg';
	}

	// Some historical posts reference a missing asset.
	if (image === '/blog-placeholder-1.jpg') {
		return '/blog-placeholder-2.jpg';
	}

	return image;
}
