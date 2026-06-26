// src/lib/translate.ts
// Client-side translation via same-origin proxy (/api/translate → Cloudflare Pages Function
// → Google Cloud Translation API). Falls back to MyMemory API when the proxy is unavailable
// (e.g. local development / test environments).
//
// ⚠ Experimental — machine translation of legal text may lose nuance.
// Label exported documents accordingly.

export interface Language {
  code: string;
  name: string; // Native name (e.g. "Français", "Deutsch")
}

export const EXPORT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '简体中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'ka', name: 'ქართული' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'bn', name: 'বাংলা' },
];

// MyMemory API uses 'zh-CN' for Chinese. Google Cloud Translation accepts 'zh' directly.
// This map is only used in the MyMemory fallback path (dev/test).
const MYMEMORY_LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
};

function mapLangForMyMemory(code: string): string {
  return MYMEMORY_LANG_MAP[code] ?? code;
}

/**
 * Translates a chunk via the same-origin proxy (/api/translate).
 * Falls back to MyMemory API when the proxy is unavailable.
 */
async function translateChunk(text: string, targetLang: string): Promise<string> {
  // ── Try same-origin proxy (production: Cloudflare Pages Function) ──
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translatedText) return data.translatedText;
    }
  } catch {
    // Proxy unavailable — fall through to MyMemory
  }

  // ── Fallback: MyMemory API (dev/test) ──────────────────────────────
  return translateViaMyMemory(text, targetLang);
}

/**
 * Translates via MyMemory API. Used as fallback when the same-origin proxy
 * is not available (local development, test runner).
 */
async function translateViaMyMemory(text: string, targetLang: string): Promise<string> {
  const mappedLang = mapLangForMyMemory(targetLang);
  const url = 'https://api.mymemory.translated.net/get';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      q: text,
      langpair: `en|${mappedLang}`,
      de: 'benatwork4747@gmail.com',
    }),
  });
  if (!res.ok) {
    throw new Error(`Translation request failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(
      `Translation API error: ${data.responseDetails ?? data.responseStatus}`,
    );
  }
  if (data.quotaFinished) {
    throw new Error('Translation rate limit exceeded. Try again later, or download in English.');
  }
  return data.responseData.translatedText;
}

/**
 * Translates English markdown content into the target language.
 * Chunks long texts at paragraph boundaries to stay within request limits.
 * Falls back to the original text if `targetLang` is 'en'.
 *
 * @returns Translated markdown text, or the original if target is English.
 */
export async function translateMarkdown(markdown: string, targetLang: string): Promise<string> {
  if (targetLang === 'en') return markdown;
  if (!markdown) return '';

  // Short texts can be sent in one request
  if (markdown.length <= 4000) {
    return translateChunk(markdown, targetLang);
  }

  // Longer texts: split at paragraph boundaries (double newlines) so each chunk
  // can be translated independently and rejoined without losing structure.
  const paragraphs = markdown.split('\n\n');
  const chunks: string[][] = [];
  let currentSize = 0;
  let currentChunk: string[] = [];

  for (const para of paragraphs) {
    const extra = currentChunk.length > 0 ? 2 : 0; // rejoining separator length
    if (currentSize + extra + para.length > 4000 && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [para];
      currentSize = para.length;
    } else {
      currentChunk.push(para);
      currentSize += extra + para.length;
    }
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  const translated = await Promise.all(
    chunks.map((chunk) => translateChunk(chunk.join('\n\n'), targetLang)),
  );
  return translated.join('\n\n');
}
