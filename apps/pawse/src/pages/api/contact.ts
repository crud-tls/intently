/**
 * Contact Form API Endpoint
 * Sends emails via Resend (https://resend.com)
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const DESTINATION_EMAIL = 'support@liveintently.app';
const FROM_EMAIL = 'noreply@liveintently.app';
const FROM_NAME = 'Intently Contact Form';

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

    // Cloudflare runtime env (from .dev.vars locally, wrangler secret in production)
    const apiKey = locals.runtime.env.RESEND_API_KEY;
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [DESTINATION_EMAIL],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nSent from the Intently contact form at liveintently.app`,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send email. Please try again later.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
