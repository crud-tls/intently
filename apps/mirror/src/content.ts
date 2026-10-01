import type { SiteContent } from '@intently/ui/site';

export const content: SiteContent = {
	headline: 'Find the looks that suit your face.',
	subhead: 'Take one photo. Mirror reads your face shape and features and recommends hairstyles that work for you, so you walk into the salon knowing what to ask for.',
	features: [
		{ title: 'Face-shape analysis', body: 'Mirror works out your face shape and key features from a single photo.' },
		{ title: 'Styles picked for you', body: 'Hairstyle recommendations that suit your shape, with how much upkeep each one needs.' },
		{ title: 'Save your favourites', body: 'Keep the styles you like in one place to show your stylist.' },
		{ title: 'Your photo is deleted', body: 'The photo is removed as soon as the analysis is done, unless you choose to keep a history.' },
	],
	faq: [
		{ q: 'What happens to my photo?', a: 'It is analysed by an AI vision model and then deleted from our storage, unless you turn on Save history.' },
		{ q: 'Does Mirror recognise who I am?', a: 'No. It only describes the shape and features of a face to make recommendations; it does not identify people.' },
		{ q: 'When is Mirror coming?', a: "It's in development for Android and iOS. Tap \"Tell me when it's out\" and we'll email you." },
	],
	legal: { privacy: true, terms: true },
	accountDeletion: {
		inApp: 'Open Mirror, go to Profile, then Privacy, and choose Delete account & data. Your account and data are deleted right away.',
		byEmail: "No longer have the app?",
		whatIsDeleted: ['Your account and sign-in details', 'All face analyses and recommendations', 'Saved styles and preferences', 'Any photos kept with Save history'],
	},
};
