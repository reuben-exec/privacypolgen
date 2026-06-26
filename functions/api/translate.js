/**
 * Cloudflare Pages Function — Free translation proxy
 *
 * Uses Google Translate's free web endpoint (same as translate.google.com).
 * No API key or billing required. Rate-limited by Google's internal throttling
 * but sufficient for typical policy exports.
 *
 * POST /api/translate
 *   Body: { text: string, targetLang: string }
 *   Response: { translatedText: string }
 *   Error: { error: string } (status 4xx/5xx)
 */

const UPSTREAM_TIMEOUT = 10_000; // 10 seconds

export async function onRequest({ request }) {
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

  // ── Call Google Translate free web endpoint with retry ──────────
  // Uses the same endpoint as translate.google.com — no API key needed.
  const MAX_RETRIES = 2; // total attempts (1 initial + 1 retry)
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.searchParams.set('client', 'gtx');
      url.searchParams.set('sl', 'en');
      url.searchParams.set('tl', targetLang);
      url.searchParams.set('dt', 't');
      url.searchParams.set('q', text);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `Translation service unavailable (HTTP ${response.status})`;
        if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
          // Retry on 5xx after a brief pause
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        return new Response(
          JSON.stringify({ error: lastError }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const data = await response.json();

      // Response format: [[["translated text","source text",...], ...], ...]
      // Each segment is translated individually and joined by newlines.
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        return new Response(
          JSON.stringify({ error: 'Unexpected response format from translation service' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Rejoin translated segments, preserving paragraph breaks
      const segments = data[0];
      const translatedParts = segments
        .filter((seg) => Array.isArray(seg) && seg[0])
        .map((seg) => seg[0]);
      const translatedText = translatedParts.join('');

      if (!translatedText) {
        return new Response(
          JSON.stringify({ error: 'Translation returned empty result' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ translatedText }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }
  }

  return new Response(
    JSON.stringify({ error: lastError || 'Translation failed after retries' }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  );
}
