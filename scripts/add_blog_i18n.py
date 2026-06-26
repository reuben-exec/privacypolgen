#!/usr/bin/env python3
"""
Add blogPage and blogPost i18n keys to en.json and all non-English locale files.
Uses deep_translator GoogleTranslator for non-English locales.
"""

import sys
import os
import json
import time

sys.stdout.reconfigure(encoding='utf-8')

I18N_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'i18n')

# ── English blog keys (source of truth) ──────────────────────────────────────

BLOG_PAGE_EN = {
    "breadcrumb": "Blog",
    "heading": "Privacy Policy Blog",
    "subtext": "Tips, guides, and best practices for privacy policy compliance — from GDPR to CCPA and everything in between.",
    "featuredArticle": {
        "tag": "GDPR",
        "title": "GDPR Privacy Policy Template: Complete Guide",
        "description": "Complete GDPR privacy policy template with generator tips. Learn how to create compliant policies that protect users while being user-friendly.",
        "readMore": "Read featured article"
    },
    "comingSoon": {
        "heading": "Coming Soon: More Expert Content",
        "text": "We're currently developing additional blog posts covering CCPA compliance, comparison guides, and practical implementation strategies. Our expert team is creating comprehensive guides to help you navigate privacy policy requirements across different jurisdictions and business needs.",
        "cards": {
            "gdpr": {
                "title": "GDPR Compliance",
                "description": "Complete templates and best practices for European data protection."
            },
            "ccpa": {
                "title": "CCPA/CPRA Guide",
                "description": "California privacy requirements and implementation strategies."
            },
            "generatorVsTemplate": {
                "title": "Generator vs Template",
                "description": "Comparative analysis to help you choose the right approach."
            }
        }
    },
    "cta": {
        "heading": "Ready to Create Your Privacy Policy?",
        "subtext": "Generate a compliant privacy policy in under 60 seconds using our intelligent generator. No legal expertise required.",
        "generate": "Generate your policy",
        "contact": "Contact us"
    }
}

BLOG_POST_EN = {
    "breadcrumb": "Blog",
    "backToBlog": "Back to blog",
    "updated": "Updated",
    "author": "Author",
    "readTime": "min read",
    "updatedOn": "Updated"
}

# ── Locale → Google Translate language code mapping ──────────────────────────

LOCALE_TO_GOOGLE = {
    'de': 'de',
    'es': 'es',
    'fr': 'fr',
    'ja': 'ja',
    'ko': 'ko',
    'zh': 'zh-CN',
    'ar': 'ar',
    'ru': 'ru',
    'pt': 'pt',
    'hi': 'hi',
    'ta': 'ta',
    'ka': 'ka',
    'vi': 'vi',
    'nl': 'nl',
    'tr': 'tr',
    'bn': 'bn',
}


def flatten_dict(d, prefix=''):
    """Flatten a nested dict into {dotted.key: value} pairs."""
    items = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            items.update(flatten_dict(v, key))
        else:
            items[key] = v
    return items


def unflatten_dict(flat):
    """Unflatten {dotted.key: value} back to nested dict."""
    result = {}
    for dotted_key, value in flat.items():
        parts = dotted_key.split('.')
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result


def translate_text(text, target_lang, retries=3):
    """Translate text using GoogleTranslator with retries."""
    from deep_translator import GoogleTranslator
    for attempt in range(retries):
        try:
            translated = GoogleTranslator(source='en', target=target_lang).translate(text)
            return translated
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1.5)
            else:
                print(f"  [WARN] Failed to translate: {text[:60]}... → {e}")
                return text  # fallback to English
    return text


def translate_blog_keys(blog_dict, target_lang, label=''):
    """Translate all string values in a nested dict."""
    flat = flatten_dict(blog_dict)
    translated_flat = {}
    total = len(flat)
    for i, (key, value) in enumerate(flat.items(), 1):
        if isinstance(value, str):
            print(f"  [{label}] {i}/{total}: {key}")
            translated_flat[key] = translate_text(value, target_lang)
            time.sleep(0.3)  # rate limit
        else:
            translated_flat[key] = value
    return unflatten_dict(translated_flat)


def add_blog_keys_to_file(filepath, locale, is_english=False):
    """Add blogPage and blogPost keys to a locale JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Check if already present
    if 'blogPage' in data and 'blogPost' in data:
        print(f"  {locale}: blogPage and blogPost already exist, skipping.")
        return

    if is_english:
        blog_page = BLOG_PAGE_EN
        blog_post = BLOG_POST_EN
    else:
        google_lang = LOCALE_TO_GOOGLE.get(locale, locale)
        print(f"\n--- Translating blog keys for {locale} (→ {google_lang}) ---")

        # Use Google Translate for the full blocks
        blog_page = translate_blog_keys(BLOG_PAGE_EN, google_lang, label=f"{locale}/blogPage")
        blog_post = translate_blog_keys(BLOG_POST_EN, google_lang, label=f"{locale}/blogPost")

    # Insert into the data dict at a sensible position
    # We want to add them after the last existing page key (before footer/wizard/etc)
    # Simple approach: just add them; JSON doesn't guarantee order but that's fine
    data['blogPage'] = blog_page
    data['blogPost'] = blog_post

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    line_count = sum(1 for _ in open(filepath, 'r', encoding='utf-8'))
    print(f"  ✓ {locale}: written ({line_count} lines)")


def main():
    non_english = ['de', 'es', 'fr', 'ja', 'ko', 'zh', 'ar', 'ru', 'pt',
                   'hi', 'ta', 'ka', 'vi', 'nl', 'tr', 'bn']

    # 1. Add to en.json
    en_path = os.path.join(I18N_DIR, 'en.json')
    print("=== Adding blog keys to en.json ===")
    add_blog_keys_to_file(en_path, 'en', is_english=True)

    # 2. Add to all non-English locales
    for locale in non_english:
        filepath = os.path.join(I18N_DIR, f'{locale}.json')
        if not os.path.exists(filepath):
            print(f"\n  SKIP: {filepath} does not exist")
            continue
        add_blog_keys_to_file(filepath, locale)

    print("\n=== Done! ===")


if __name__ == '__main__':
    main()
