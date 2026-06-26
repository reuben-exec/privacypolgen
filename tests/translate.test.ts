// tests/translate.test.ts
// Tests for repairMarkdown, EXPORT_LANGUAGES, and font registry.
// NOTE: translateChunk / translateMarkdown are client-side only (fetch-based),
// so we test the pure functions and config here.

import { describe, it, expect } from 'vitest';
import { repairMarkdown, EXPORT_LANGUAGES, getLanguageLabel } from '@/lib/translate';
import { FONT_MAP, getFontPathsForLang, detectScript } from '@/lib/fonts';

// ---------------------------------------------------------------------------
// EXPORT_LANGUAGES
// ---------------------------------------------------------------------------

describe('EXPORT_LANGUAGES', () => {
  it('has exactly 17 languages', () => {
    expect(EXPORT_LANGUAGES).toHaveLength(17);
  });

  it('starts with English', () => {
    expect(EXPORT_LANGUAGES[0].code).toBe('en');
  });

  it('every code is a valid BCP 47 language tag (lowercase, 2-3 chars)', () => {
    for (const lang of EXPORT_LANGUAGES) {
      expect(lang.code).toMatch(/^[a-z]{2,3}$/);
    }
  });

  it('every language has unique code', () => {
    const codes = EXPORT_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('getLanguageLabel', () => {
  it('returns "English" for English (code matches label)', () => {
    expect(getLanguageLabel('en')).toBe('English');
  });

  it('returns "Deutsch (German)" for German (local differs from English)', () => {
    expect(getLanguageLabel('de')).toBe('Deutsch (German)');
  });

  it('returns code itself for unknown language', () => {
    expect(getLanguageLabel('xx')).toBe('xx');
  });
});

// ---------------------------------------------------------------------------
// repairMarkdown
// ---------------------------------------------------------------------------

describe('repairMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(repairMarkdown('')).toBe('');
    expect(repairMarkdown('   ')).toBe('   ');
  });

  it('does not alter clean markdown', () => {
    const clean = `# Heading

Some **bold** and *italic* text.

- Item 1
- Item 2

> Blockquote`;
    expect(repairMarkdown(clean)).toBe(clean);
  });

  it('fixes bold markers with spaces: ** text ** → **text**', () => {
    expect(repairMarkdown('** some text **')).toBe('**some text**');
    expect(repairMarkdown('This is ** bold ** text')).toBe('This is **bold** text');
  });

  it('fixes italic markers with spaces: * text * → *text*', () => {
    expect(repairMarkdown('* some text *')).toBe('*some text*');
  });

  it('fixes duplicated heading markers', () => {
    expect(repairMarkdown('## ## My Heading')).toBe('## My Heading');
    expect(repairMarkdown('# # Title')).toBe('# Title');
    expect(repairMarkdown('### ### ### Deep')).toBe('### Deep');
  });

  it('restores missing space after heading markers', () => {
    expect(repairMarkdown('#NoSpace')).toBe('# NoSpace');
    expect(repairMarkdown('##NoSpace')).toBe('## NoSpace');
  });

  it('normalizes Unicode list bullets to markdown hyphens', () => {
    expect(repairMarkdown('• Item one')).toBe('- Item one');
    expect(repairMarkdown('● Item two')).toBe('- Item two');
    expect(repairMarkdown('◦ Item three')).toBe('- Item three');
  });

  it('converts Arabic numeral list markers to western numerals', () => {
    // Arabic-Indic: ١. → 1.
    expect(repairMarkdown('١. First item')).toBe('1. First item');
    expect(repairMarkdown('٢) Second item')).toBe('2) Second item');
  });

  it('converts Devanagari numeral list markers to western numerals', () => {
    expect(repairMarkdown('१. First item')).toBe('1. First item');
    expect(repairMarkdown('२) Second item')).toBe('2) Second item');
  });

  it('collapses excessive blank lines', () => {
    expect(repairMarkdown('text\n\n\n\n\ntext')).toBe('text\n\ntext');
  });

  it('handles bold+italic combined markers', () => {
    expect(repairMarkdown('*** some text ***')).toBe('***some text***');
  });

  it('does not break inline code', () => {
    const input = 'Use `npm install` to install.';
    expect(repairMarkdown(input)).toBe(input);
  });

  it('preserves blockquote markers', () => {
    const input = '> Important note about data.';
    expect(repairMarkdown(input)).toBe(input);
  });

  it('handles multi-line markdown with mixed repairs', () => {
    const input = `## ## Privacy Policy

We collect ** personal data ** to provide our services.

• First point
• Second point

١. Arabic list
٢. Arabic list`;

    const expected = `## Privacy Policy

We collect **personal data** to provide our services.

- First point
- Second point

1. Arabic list
2. Arabic list`;

    expect(repairMarkdown(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Font registry
// ---------------------------------------------------------------------------

describe('FONT_MAP', () => {
  it('has entries for all 17 supported languages', () => {
    const langs = EXPORT_LANGUAGES.map((l) => l.code);
    for (const lang of langs) {
      expect(FONT_MAP[lang]).toBeDefined();
      expect(Array.isArray(FONT_MAP[lang])).toBe(true);
      expect(FONT_MAP[lang].length).toBeGreaterThan(0);
    }
  });

  it('every font path starts with /fonts/', () => {
    for (const [lang, paths] of Object.entries(FONT_MAP)) {
      for (const p of paths) {
        expect(p).toMatch(/^\/fonts\//);
        expect(p).toMatch(/\.ttf$/);
      }
    }
  });

  it('English uses only NotoSans-Regular', () => {
    expect(FONT_MAP.en).toEqual(['/fonts/NotoSans-Regular.ttf']);
  });

  it('Chinese uses CJK-specific fonts plus NotoSans-Regular', () => {
    expect(FONT_MAP.zh).toContain('/fonts/NotoSansSC-Regular.ttf');
    expect(FONT_MAP.zh).toContain('/fonts/NotoSans-Regular.ttf');
  });
});

describe('getFontPathsForLang', () => {
  it('returns font paths for known language', () => {
    const paths = getFontPathsForLang('ja');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain('/fonts/NotoSansJP-Regular.ttf');
  });

  it('returns NotoSans-Regular for unknown language', () => {
    const paths = getFontPathsForLang('xx');
    expect(paths).toEqual(['/fonts/NotoSans-Regular.ttf']);
  });
});

describe('detectScript', () => {
  it('returns "latin" for English text', () => {
    expect(detectScript('This is English text.')).toBe('latin');
  });

  it('returns "cjk-zh" for Chinese characters', () => {
    expect(detectScript('这是一个隐私政策')).toBe('cjk-zh');
  });

  it('returns "cjk-ja" for Japanese hiragana', () => {
    expect(detectScript('これはプライバシーポリシーです')).toBe('cjk-ja');
  });

  it('returns "cjk-ko" for Korean hangul', () => {
    expect(detectScript('이것은 개인정보 처리방침입니다')).toBe('cjk-ko');
  });

  it('returns "arabic" for Arabic text', () => {
    expect(detectScript('هذا ن سياسة الخصوصية')).toBe('arabic');
  });

  it('returns "devanagari" for Hindi text', () => {
    expect(detectScript('यह गोपनीयता नीति है')).toBe('devanagari');
  });

  it('returns "tamil" for Tamil text', () => {
    expect(detectScript('இது தனியுரிமைக் கொள்கை')).toBe('tamil');
  });

  it('returns "georgian" for Georgian text', () => {
    expect(detectScript('ეს არის კონფიდენციალობის პოლიტიკა')).toBe('georgian');
  });

  it('returns "bengali" for Bengali text', () => {
    expect(detectScript('এটি গোপনীয়তা নীতি')).toBe('bengali');
  });

  it('returns "latin" for empty string', () => {
    expect(detectScript('')).toBe('latin');
  });

  it('returns "latin" for mixed Latin + numbers only', () => {
    expect(detectScript('Privacy Policy 2024')).toBe('latin');
  });
});
