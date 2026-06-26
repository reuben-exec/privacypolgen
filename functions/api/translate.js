/**
 * Cloudflare Pages Function — Translation proxy
 *
 * Proxies browser translation requests to Google Cloud Translation API v2.
 * The API key is stored as a Cloudflare Pages secret (GOOGLE_TRANSLATE_API_KEY)
 * and is NEVER exposed to the client.
 *
 * POST /api/translate
 *   Body: { text: string, targetLang: string }
 *   Response: { translatedText: string }
 *   Error: { error: string } (status 4xx/5xx)
 *
 * Required secret:
 *   GOOGLE_TRANSLATE_API_KEY — Google Cloud API key with
 *   "Cloud Translation API" enabled.
 *
 * @see https://cloud.google.com/translate/docs
 */

export async function onRequest({ request, env }) {
  // ── Method check ──────────────────────────────────────────────
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Parse body ────────────────────────────────────────────────
  let text, targetLang;
  try {
    const body = await request.json();
    text = body.text;
    targetLang = body.targetLang;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!text || !targetLang) {
    return new Response(JSON.stringify({ error: 'Missing text or targetLang' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── API key ───────────────────────────────────────────────────
  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Translation service not configured (missing API key)' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Call Google Cloud Translation API ─────────────────────────
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(`Google Cloud Translation API error (HTTP ${response.status}): ${raw}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON from Google API: ${raw.slice(0, 200)}`);
    }

    const translatedText = data?.data?.translations?.[0]?.translatedText;
    if (!translatedText) {
      throw new Error('Unexpected response format from Google API');
    }

    return new Response(JSON.stringify({ translatedText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
