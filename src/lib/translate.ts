// src/lib/translate.ts
// Client-side translation via same-origin proxy (/api/translate → Cloudflare Pages Function
// → Google Translate free web endpoint). Falls back to MyMemory API when the proxy is
// unavailable (e.g. local development / test environments).
//
// ⚠ Experimental — machine translation of legal text may lose nuance.
// Label exported documents accordingly.

export interface Language {
  code: string;
  label: string;
  labelLocal: string;
}

export const EXPORT_LANGUAGES: Language[] = [
  { code: 'en', label: 'English', labelLocal: 'English' },
  { code: 'de', label: 'German', labelLocal: 'Deutsch' },
  { code: 'es', label: 'Spanish', labelLocal: 'Español' },
  { code: 'fr', label: 'French', labelLocal: 'Français' },
  { code: 'ko', label: 'Korean', labelLocal: '한국어' },
  { code: 'ja', label: 'Japanese', labelLocal: '日本語' },
  { code: 'zh', label: 'Chinese (Simplified)', labelLocal: '简体中文' },
  { code: 'ar', label: 'Arabic', labelLocal: 'العربية' },
  { code: 'ru', label: 'Russian', labelLocal: 'Русский' },
  { code: 'pt', label: 'Portuguese', labelLocal: 'Português' },
  { code: 'hi', label: 'Hindi', labelLocal: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', labelLocal: 'தமிழ்' },
  { code: 'ka', label: 'Georgian', labelLocal: 'ქართული' },
  { code: 'vi', label: 'Vietnamese', labelLocal: 'Tiếng Việt' },
  { code: 'nl', label: 'Dutch', labelLocal: 'Nederlands' },
  { code: 'tr', label: 'Turkish', labelLocal: 'Türkçe' },
  { code: 'bn', label: 'Bengali', labelLocal: 'বাংলা' },
];

export function getLanguageLabel(code: string): string {
  const lang = EXPORT_LANGUAGES.find((l) => l.code === code);
  if (!lang) return code;
  return lang.label === lang.labelLocal
    ? lang.label
    : `${lang.labelLocal} (${lang.label})`;
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

/** Single chunk translation with retry. */
async function translateChunk(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en' || !text.trim()) return text;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });

      if (!response.ok) {
        // Only retry on network/server errors (5xx), not client errors (4xx)
        if (response.status >= 500) {
          lastError = new Error(`Translation proxy returned ${response.status}`);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
            continue;
          }
        }
        throw new Error(`Translation proxy returned ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.translatedText || text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on network errors (not 4xx client errors)
      const isRetryable =
        lastError.message.includes('fetch') ||
        lastError.message.includes('network') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('500') ||
        lastError.message.includes('proxy');
      if (isRetryable && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      // Last attempt or non-retryable error
      if (attempt === maxRetries) break;
      throw lastError;
    }
  }

  // All retries exhausted — try MyMemory fallback for non-production
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    console.warn(`[translate] Primary endpoint failed (${lastError?.message}), trying MyMemory fallback`);
    return translateViaMyMemory(text, targetLang);
  }
  throw lastError || new Error('Translation failed after retries');
}

/** MyMemory fallback for local dev/test. */
async function translateViaMyMemory(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

/**
 * Translate markdown content to the target language.
 * Chunks on paragraph boundaries to stay within API limits.
 */
export async function translateMarkdown(markdown: string, targetLang: string): Promise<string> {
  if (!markdown || !targetLang) return markdown ?? '';
  if (targetLang === 'en' || !markdown.trim()) return markdown;

  const maxChunkSize = 4000;
  const paragraphs = markdown.split('\n\n');
  const chunks: string[][] = [[]];
  let currentChunk: string[] = chunks[0];
  let currentSize = 0;

  for (const para of paragraphs) {
    const extra = currentChunk.length > 0 ? 2 : 0; // '\n\n' separator
    if (currentSize + extra + para.length > maxChunkSize && currentChunk.length > 0) {
      currentChunk = [para];
      chunks.push(currentChunk);
      currentSize = para.length;
    } else {
      currentChunk.push(para);
      currentSize += extra + para.length;
    }
  }

  // Translate sequentially with a small delay to avoid rate-limiting
  const translated: string[] = [];
  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk.join('\n\n'), targetLang));
    // Small delay between chunks to be respectful of the free endpoint
    if (chunks.length > 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return repairMarkdown(translated.join('\n\n'));
}

// ---------------------------------------------------------------------------
// Markdown Repair
// ---------------------------------------------------------------------------

/**
 * Repair markdown that was mangled by Google Translate.
 *
 * Common issues:
 * - Translated bold markers: ** text ** → **text** (extra spaces inside)
 * - Duplicated heading markers: ## ## Heading → ## Heading
 * - List markers translated: - item → • item (or Arabic bullet)
 * - Bold/italic markers separated from text
 */
export function repairMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Fix duplicated heading markers: "## ## Heading" → "## Heading"
  //    Requires at least one space between the original and the duplicate.
  result = result.replace(/^(#{1,6})\s+(?:\1\s*)+/gm, '$1 ');

  // 2. Fix bold markers with spaces inside: ** text ** → **text**
  //    Match complete bold spans (opening + content + closing) to avoid
  //    eating spaces that are OUTSIDE the markers.
  result = result.replace(/\*\*\s+(.*?)\s+\*\*/g, '**$1**');

  // 3. Fix italic markers with spaces inside: * text * → *text*
  //    Only match single * not part of ** (uses non-greedy content)
  result = result.replace(/(?<!\*)\*(?!\*)\s+(.*?[^*])\s+(?<!\*)\*(?!\*)/g, '*$1*');

  // 4. Fix bold+italic combined markers: *** text *** → ***text***
  result = result.replace(/\*\*\*\s+(.*?)\s+\*\*\*/g, '***$1***');

  // 5. Fix list markers that were translated (common: •, ●, ◦, ▪)
  //    Restore to standard markdown hyphens
  result = result.replace(/^[\u2022\u25CF\u25E6\u25AA]\s+/gm, '- ');

  // 6. Fix numbered lists where numbers were translated to other numeral systems
  //    Arabic-Indic numerals: ٠-٩ → 0-9
  const arabicNumerals: Record<string, string> = {
    '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
    '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9',
  };
  result = result.replace(/^([\u0660-\u0669]+)([.)]\s)/gm, (_match, numStr, suffix) => {
    const converted = numStr
      .split('')
      .map((ch: string) => arabicNumerals[ch] ?? ch)
      .join('');
    return converted + suffix;
  });

  //    Devanagari numerals: ०-९ → 0-9
  const devanagariNumerals: Record<string, string> = {
    '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4',
    '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9',
  };
  result = result.replace(/^([\u0966-\u096F]+)([.)]\s)/gm, (_match, numStr, suffix) => {
    const converted = numStr
      .split('')
      .map((ch: string) => devanagariNumerals[ch] ?? ch)
      .join('');
    return converted + suffix;
  });

  // 7. Normalize excessive blank lines (more than 2 newlines → 2)
  result = result.replace(/\n{3,}/g, '\n\n');

  // 8. Ensure heading has space after # (sometimes lost)
  result = result.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  return result;
}
