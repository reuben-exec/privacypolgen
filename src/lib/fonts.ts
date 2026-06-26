// src/lib/fonts.ts
// Font registry for multi-script PDF/DOCX export.
// Maps language codes to Noto Sans font files. Fonts are fetched lazily from /fonts/
// and cached in memory so repeated exports don't re-download.

export interface FontInfo {
  /** Font display name (used in DOCX) */
  name: string;
  /** Path relative to /public/ (served at /fonts/) */
  path: string;
  /** Script group — determines which font to pair with for mixed-script text */
  script: 'latin' | 'cjk-sc' | 'cjk-jp' | 'cjk-ko' | 'arabic' | 'devanagari' | 'tamil' | 'georgian' | 'bengali';
}

// ── Font definitions ──────────────────────────────────────────────

const FONTS: Record<string, FontInfo> = {
  latin:      { name: 'Noto Sans',         path: '/fonts/NotoSans-Regular.ttf',         script: 'latin' },
  'cjk-sc':   { name: 'Noto Sans SC',      path: '/fonts/NotoSansSC-Regular.ttf',      script: 'cjk-sc' },
  'cjk-jp':   { name: 'Noto Sans JP',      path: '/fonts/NotoSansJP-Regular.ttf',      script: 'cjk-jp' },
  'cjk-ko':   { name: 'Noto Sans KR',      path: '/fonts/NotoSansKR-Regular.ttf',      script: 'cjk-ko' },
  arabic:     { name: 'Noto Sans Arabic',   path: '/fonts/NotoSansArabic-Regular.ttf',  script: 'arabic' },
  devanagari: { name: 'Noto Sans Devanagari', path: '/fonts/NotoSansDevanagari-Regular.ttf', script: 'devanagari' },
  tamil:      { name: 'Noto Sans Tamil',    path: '/fonts/NotoSansTamil-Regular.ttf',   script: 'tamil' },
  georgian:   { name: 'Noto Sans Georgian', path: '/fonts/NotoSansGeorgian-Regular.ttf', script: 'georgian' },
  bengali:    { name: 'Noto Sans Bengali',  path: '/fonts/NotoSansBengali-Regular.ttf', script: 'bengali' },
};

// ── Language → Font mapping ───────────────────────────────────────

const LANG_SCRIPT_MAP: Record<string, string> = {
  en: 'latin', de: 'latin', es: 'latin', fr: 'latin',
  pt: 'latin', nl: 'latin', tr: 'latin', vi: 'latin',
  ru: 'latin',
  ko: 'cjk-ko',
  ja: 'cjk-jp',
  zh: 'cjk-sc',
  ar: 'arabic',
  hi: 'devanagari',
  ta: 'tamil',
  ka: 'georgian',
  bn: 'bengali',
};

/**
 * Returns the primary font for a given language code.
 * Latin-script languages (en, de, es, fr, pt, nl, tr, vi) all use 'latin'.
 * Russian uses 'latin' too (Noto Sans covers Cyrillic).
 * CJK/Arabic/Indic languages use their respective script fonts.
 */
export function getFontForLanguage(langCode: string): FontInfo {
  return FONTS[LANG_SCRIPT_MAP[langCode] ?? 'latin']!;
}

/**
 * Returns the secondary font for mixed-script text.
 * CJK languages need a Latin font for any English terms mixed in.
 * All other languages only need one font.
 */
export function getSecondaryFont(langCode: string): FontInfo | null {
  if (['ko', 'ja', 'zh'].includes(langCode)) {
    return FONTS.latin;
  }
  return null;
}

// ── Font caching & fetching ───────────────────────────────────────

const fontCache = new Map<string, ArrayBuffer>();

/**
 * Fetches a font file as ArrayBuffer. Cached in memory after first fetch.
 * Font files are served from /fonts/ (public/ directory).
 */
export async function fetchFont(font: FontInfo): Promise<ArrayBuffer> {
  if (fontCache.has(font.path)) {
    return fontCache.get(font.path)!;
  }
  const res = await fetch(font.path);
  if (!res.ok) {
    throw new Error(`Failed to load font ${font.name}: HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  fontCache.set(font.path, buf);
  return buf;
}

/**
 * Fetches both primary and secondary fonts for a language.
 * Returns [primaryBuffer] or [primaryBuffer, secondaryBuffer].
 */
export async function fetchFontsForLanguage(langCode: string): Promise<ArrayBuffer[]> {
  const primary = getFontForLanguage(langCode);
  const secondary = getSecondaryFont(langCode);
  const buffers: ArrayBuffer[] = [await fetchFont(primary)];
  if (secondary) {
    buffers.push(await fetchFont(secondary));
  }
  return buffers;
}

// ── Script detection ──────────────────────────────────────────────

/**
 * Detect the dominant script in a text string by examining non-Latin characters.
 * Returns 'latin' for English/Latin-script text.
 *
 * Priority order for CJK: Japanese (hiragana/katakana) > Chinese (CJK ideographs) > Korean.
 * This ensures Japanese text that starts with hiragana is detected correctly.
 */
export function detectScript(text: string): string {
  // First pass: check for Japanese-specific kana (highest priority for CJK)
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x3040 && cp <= 0x309F) return 'cjk-ja'; // Hiragana
    if (cp >= 0x30A0 && cp <= 0x30FF) return 'cjk-ja'; // Katakana
  }

  // Second pass: check all non-Latin characters
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x0080) continue; // ASCII
    // Cyrillic (Russian) — treated as Latin by Noto Sans
    if (cp >= 0x0400 && cp <= 0x04FF) return 'latin';
    // Korean Hangul
    if (cp >= 0xAC00 && cp <= 0xD7AF) return 'cjk-ko';
    // CJK Unified Ideographs (shared by zh/ja — but ja already caught above)
    if (cp >= 0x4E00 && cp <= 0x9FFF) return 'cjk-zh';
    // Arabic
    if (cp >= 0x0600 && cp <= 0x06FF) return 'arabic';
    // Devanagari (Hindi)
    if (cp >= 0x0900 && cp <= 0x097F) return 'devanagari';
    // Bengali
    if (cp >= 0x0980 && cp <= 0x09FF) return 'bengali';
    // Tamil
    if (cp >= 0x0B80 && cp <= 0x0BFF) return 'tamil';
    // Georgian
    if (cp >= 0x10A0 && cp <= 0x10FF) return 'georgian';
  }
  return 'latin';
}

// ── Convenience: get all font paths for a language ────────────────

/** Returns array of font file paths needed for rendering text in a given language. */
export function getFontPathsForLang(langCode: string): string[] {
  const primary = getFontForLanguage(langCode);
  const secondary = getSecondaryFont(langCode);
  const paths = [primary.path];
  if (secondary) paths.push(secondary.path);
  return paths;
}

// ── Language → font path map (for test convenience) ──────────────

/** Maps each supported language to its font file paths. */
export const FONT_MAP: Record<string, string[]> = {};
for (const [code] of Object.entries(LANG_SCRIPT_MAP)) {
  FONT_MAP[code] = getFontPathsForLang(code);
}
