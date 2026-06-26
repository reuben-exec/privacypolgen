/**
 * Cloudflare Pages Function — Feedback / Review email sender
 *
 * Accepts contact, review, bug report, and feature request submissions,
 * validates Turnstile CAPTCHA, and sends the result via Resend API.
 *
 * POST /api/feedback
 *   Body: { name, email, message, type?, rating?, country?, turnstileToken }
 *   Response: { success: true } or { error: string } (status 4xx/5xx)
 *
 * Env vars required:
 *   TURNSTILE_SECRET_KEY — Cloudflare Turnstile siteverify secret
 *   RESEND_API_KEY       — Resend API key (https://resend.com)
 */

// ── Constants ──────────────────────────────────────────────────────────
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 2000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_API_URL = 'https://api.resend.com/emails';
const RECIPIENT = 'benatwork4747@gmail.com';
const SENDER_EMAIL = 'noreply@privacypolgen.in';
const SENDER_NAME = 'PrivacyPolGen';

// ── Helpers ────────────────────────────────────────────────────────────

/** Strip HTML tags and trim whitespace. */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/** Clamp string to max length. */
function cap(str, max) {
  return str.length > max ? str.slice(0, max) : str;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build a simple HTML email body. */
function buildHtml({ type, name, email, message, rating, country }) {
  const label = {
    contact: 'Contact',
    review: 'Review',
    bug: 'Bug Report',
    feature: 'Feature Request',
  }[type] || 'Feedback';

  let rows = `
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;">Type</td>
        <td style="padding:8px 12px;">${label}</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;">Name</td>
        <td style="padding:8px 12px;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;">Email</td>
        <td style="padding:8px 12px;">${escapeHtml(email || 'Not provided')}</td></tr>`;

  if (rating) {
    rows += `
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;">Rating</td>
        <td style="padding:8px 12px;">${'★'.repeat(Number(rating))}${'☆'.repeat(5 - Number(rating))} (${rating}/5)</td></tr>`;
  }

  if (country) {
    rows += `
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;">Country</td>
        <td style="padding:8px 12px;">${escapeHtml(country)}</td></tr>`;
  }

  rows += `
    <tr><td style="padding:8px 12px;font-weight:600;background:#f4f4f5;vertical-align:top;">Message</td>
        <td style="padding:8px 12px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#27272a;">
  <p style="margin:0 0 16px;">New ${label.toLowerCase()} submission from <strong>PrivacyPolGen</strong>:</p>
  <table style="border-collapse:collapse;width:100%;max-width:600px;border:1px solid #e4e4e7;">
    ${rows}
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;">
    Sent from privacypolgen.in feedback form. Reply to this email to respond to ${escapeHtml(name)}.
  </p>
</body>
</html>`;
}

/** Build plain-text version of the email. */
function buildText({ type, name, email, message, rating, country }) {
  const label = { contact: 'Contact', review: 'Review', bug: 'Bug Report', feature: 'Feature Request' }[type] || 'Feedback';
  let text = `New ${label} submission from PrivacyPolGen\n\n`;
  text += `Type:   ${label}\n`;
  text += `Name:   ${name}\n`;
  text += `Email:  ${email || 'Not provided'}\n`;
  if (rating) text += `Rating: ${rating}/5\n`;
  if (country) text += `Country: ${country}\n`;
  text += `\nMessage:\n${message}\n`;
  text += `\n--- Sent from privacypolgen.in feedback form ---`;
  return text;
}

// ── Main handler ───────────────────────────────────────────────────────

export async function onRequest({ request, env }) {
  // ── CORS preflight ─────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // ── Method check ───────────────────────────────────────────────────
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // ── Check API key ──────────────────────────────────────────────────
  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Email service not configured' }, 500);
  }

  // ── Parse body ─────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { name, email, message, type, rating, country, turnstileToken } = body;

  // ── Validate required fields ───────────────────────────────────────
  if (!name || typeof name !== 'string' || sanitize(name).length === 0) {
    return jsonResponse({ error: 'Name is required' }, 400);
  }
  if (!message || typeof message !== 'string' || sanitize(message).length === 0) {
    return jsonResponse({ error: 'Message is required' }, 400);
  }
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return jsonResponse({ error: 'CAPTCHA token is required' }, 400);
  }

  // ── Sanitize inputs ────────────────────────────────────────────────
  const safeName = cap(sanitize(name), MAX_NAME);
  const safeEmail = email ? cap(sanitize(email), MAX_EMAIL) : '';
  const safeMessage = cap(sanitize(message), MAX_MESSAGE);
  const safeType = ['contact', 'review', 'bug', 'feature'].includes(type) ? type : 'contact';
  const safeRating = rating && Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : null;
  const safeCountry = country ? cap(sanitize(country), 100) : '';

  // ── Basic spam check ───────────────────────────────────────────────
  if (safeEmail && /\+.*\+/.test(safeEmail)) {
    return jsonResponse({ error: 'Invalid email address' }, 400);
  }

  // ── Verify Turnstile ───────────────────────────────────────────────
  try {
    const cfResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY || '',
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }).toString(),
    });

    const result = await cfResponse.json();

    if (!result.success) {
      return jsonResponse({ error: 'CAPTCHA verification failed. Please try again.' }, 403);
    }
  } catch {
    return jsonResponse({ error: 'CAPTCHA verification unavailable. Please try again.' }, 502);
  }

  // ── Send email via Resend ──────────────────────────────────────────
  const subjectPrefix = {
    contact: 'Contact',
    review: 'Review',
    bug: 'Bug Report',
    feature: 'Feature Request',
  }[safeType];

  try {
    const resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [RECIPIENT],
        reply_to: safeEmail || undefined,
        subject: `[${subjectPrefix}] ${safeName} — PrivacyPolGen`,
        html: buildHtml({ type: safeType, name: safeName, email: safeEmail, message: safeMessage, rating: safeRating, country: safeCountry }),
        text: buildText({ type: safeType, name: safeName, email: safeEmail, message: safeMessage, rating: safeRating, country: safeCountry }),
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      return jsonResponse({ error: 'Failed to send email. Please try again later.' }, 502);
    }
  } catch {
    return jsonResponse({ error: 'Failed to send email. Please try again later.' }, 502);
  }

  return jsonResponse({ success: true });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
