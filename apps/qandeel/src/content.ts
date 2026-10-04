import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'Hear the Quran, ayah by ayah.',
	subhead: 'Qandeel plays the Quran with its English or Bangla translation, follows each word as it is recited, and keeps going offline, on your phone and your Wear OS watch.',
	features: [
		{ title: 'Arabic, then the translation', body: 'Arabic only, Arabic with English, or Arabic with Bangla, with three Bangla voices to choose from.' },
		{ title: 'Follow every word', body: 'The reciting ayah and word are highlighted as you listen, with word-by-word meanings in English or Bangla.' },
		{ title: 'Made for memorising', body: 'Repeat an ayah or a range as many times as you like, slow down or speed up, and set a sleep timer.' },
		{ title: 'Offline and on your watch', body: 'Download surahs to listen anywhere; the phone can ask your watch to download them too.' },
		{ title: 'Find any ayah fast', body: 'Search by surah name or number, or type a reference like 2:255.' },
		{ title: 'Nothing about you leaves the phone', body: 'No account, no analytics and no ads. Audio streams straight from public recitation hosts.' },
	],
	faq: [
		{ q: 'Which translations are included?', a: 'Saheeh International for English and Muhiuddin Khan for Bangla, plus word-by-word meanings.' },
		{ q: 'Does it work without internet?', a: 'Yes, for any surah you have downloaded. The Quran text and translations are built in.' },
		{ q: 'Does it work on a watch?', a: 'Yes, Qandeel has a Wear OS app that stays in sync with your phone.' },
	],
	legal: { privacy: true, terms: false },
};
