/**
 * Contact Form API Endpoint
 * Sends through Cloudflare Email Routing's `send_email` binding (EMAIL in wrangler.json), so no
 * third-party mail service or key is needed. Cloudflare only delivers to a verified destination
 * address, which the binding pins; change it there, not here.
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { EmailMessage } from 'cloudflare:email';

const DESTINATION_EMAIL = 'sadakatpc1@gmail.com';
const FROM_EMAIL = 'noreply@liveintently.app';
const FROM_NAME = 'Respite Contact Form';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();

    const name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const subject = formData.get('subject')?.toString().trim() ?? '';
    const message = formData.get('message')?.toString().trim() ?? '';

    // Server-side validation
    const errors: Record<string, string> = {};

    if (!name || name.length < 2) {
      errors.name = 'Please enter a valid name (at least 2 characters)';
    }

    if (!email || !isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!subject) {
      errors.subject = 'Please select a subject';
    }

    if (!message || message.length < 10) {
      errors.message = 'Please enter a message (at least 10 characters)';
    }

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ success: false, errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nSent from the Respite contact form at respite.liveintently.app`;
    const raw = buildMessage({ replyTo: email, subject: `Contact Form: ${subject}`, text });

    await locals.runtime.env.EMAIL.send(new EmailMessage(FROM_EMAIL, DESTINATION_EMAIL, raw));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been sent successfully!',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred while sending your message. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/** A minimal plain-text MIME message; Email Routing requires From, To, Subject, Date and Message-ID. */
function buildMessage({ replyTo, subject, text }: { replyTo: string; subject: string; text: string }): string {
  return [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${DESTINATION_EMAIL}`,
    `Reply-To: ${headerSafe(replyTo)}`,
    `Subject: ${encodeHeader(headerSafe(subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@liveintently.app>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    toBase64(text).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
}

// Form fields go into headers, so a line break in one could add headers of its own.
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?utf-8?B?${toBase64(value)}?=`;
}

function toBase64(value: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
