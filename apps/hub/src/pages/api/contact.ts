/**
 * Contact form: delivers the message by Resend to the inbox of the app it's about.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { APPS, STUDIO } from '@intently/registry';

const FROM = 'Intently contact form <noreply@liveintently.app>';
const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
	const form = await request.formData().catch(() => null);
	if (!form) return json({ success: false, message: 'Invalid form submission.' }, 400);

	const field = (key: string) => form.get(key)?.toString().trim() ?? '';
	const name = field('name');
	const email = field('email');
	const appId = field('app');
	const message = field('message');

	// Bots fill every field, including this one, which people never see.
	if (field('website')) return json({ success: true });

	const errors: Record<string, string> = {};
	if (name.length < 2) errors.name = 'Please enter your name.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
	if (message.length < 10) errors.message = 'Please write at least a sentence.';
	if (message.length > 5000) errors.message = 'Please keep it under 5,000 characters.';
	if (Object.keys(errors).length) return json({ success: false, errors }, 400);

	const app = APPS.find((a) => a.id === appId);
	const to = app?.email ?? STUDIO.email;
	const about = app?.name ?? 'General';

	const resend = new Resend(locals.runtime.env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: FROM,
		to: [to],
		replyTo: email,
		subject: `[${about}] Message from ${name}`,
		text: `${message}\n\n---\nFrom: ${name} <${email}>\nAbout: ${about}\nSent from liveintently.app/contact`,
	});

	if (error) {
		console.error('Resend error', error);
		return json({ success: false, message: `Sending failed. Please email ${to} directly.` }, 502);
	}
	return json({ success: true });
};
