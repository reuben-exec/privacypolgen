#!/usr/bin/env python3
"""
Translate the 31 missing i18n keys into all 16 non-English locales.

These keys were added to en.json but never translated. The script:
1. Reads the English values
2. Translates them via Google Translate
3. Inserts them into each locale file
4. Preserves brand names (PrivacyPolGen, DPDP Act, DOCX) in translated output
"""

import json
import os
import time
import sys
import shutil
from deep_translator import GoogleTranslator

# Force UTF-8 for Windows CP1252 terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ─── Config ──────────────────────────────────────────────────────────────────

I18N_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n")
EN_PATH = os.path.join(I18N_DIR, "en.json")

# Locale → Google Translate language code
LANG_MAP = {
    "ar": "ar", "bn": "bn", "de": "de", "es": "es", "fr": "fr",
    "hi": "hi", "ja": "ja", "ka": "ka", "ko": "ko", "nl": "nl",
    "pt": "pt", "ru": "ru", "ta": "ta", "tr": "tr", "vi": "vi",
    "zh": "zh-CN",
}

# Brand names / proper nouns that must stay as-is in translations
BRAND_MARKERS = ["PrivacyPolGen", "DPDP Act", "DOCX"]

# The missing key paths and their English values (filled dynamically from en.json)
MISSING_KEY_PATHS = [
    # header
    "header.about", "header.ariaMenu", "header.ariaClose",
    "header.documentsLabel", "header.privacy", "header.terms",
    "header.cookie", "header.languageLabel",
    # footer
    "footer.productAbout", "footer.productBlog", "footer.productPrivacy",
    "footer.productTerms", "footer.productCookie",
    # seo (title + description for each)
    "seo.generateHub.title", "seo.generateHub.description",
    "seo.generateTerms.title", "seo.generateTerms.description",
    "seo.generateCookie.title", "seo.generateCookie.description",
    "seo.cookiePolicy.title", "seo.cookiePolicy.description",
    "seo.termsPolicy.title", "seo.termsPolicy.description",
    "seo.about.title", "seo.about.description",
    # wizard
    "wizard.laws.dpdp.name", "wizard.laws.dpdp.fullName",
    "wizard.laws.dpdp.region", "wizard.laws.dpdp.description",
    # policyView
    "policyView.docx", "policyView.exportLoading",
]

# Keys that should NOT be translated (keep English as-is)
SKIP_TRANSLATION = {
    "wizard.laws.dpdp.name",       # "DPDP Act" — official name
    "policyView.docx",              # "DOCX" — file format
    "seo.about.title",              # "About - PrivacyPolGen" — brand
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def get_nested(data, path):
    """Get a value from nested dict by dot-separated path."""
    keys = path.split(".")
    current = data
    for k in keys:
        if isinstance(current, dict) and k in current:
            current = current[k]
        else:
            return None
    return current


def set_nested(data, path, value):
    """Set a value in nested dict by dot-separated path, creating intermediate dicts."""
    keys = path.split(".")
    current = data
    for i, k in enumerate(keys[:-1]):
        if k not in current or not isinstance(current[k], dict):
            current[k] = {}
        current = current[k]
    current[keys[-1]] = value


def protect_brand_names(text, translated):
    """Restore brand names that Google Translate might have mangled."""
    result = translated
    for brand in BRAND_MARKERS:
        if brand in text and brand not in result:
            # Try to find where the brand should go
            result = result.replace(brand.lower(), brand)
            result = result.replace(brand.upper(), brand)
            # If still missing, try replacing surrounding text
            if brand not in result:
                # Fall back to original for this segment
                print(f"    ⚠ Brand '{brand}' lost in translation, keeping English")
                return text
    return result


def translate_text(text, target_lang, max_retries=3):
    """Translate a single text string with brand name protection."""
    if not text or not text.strip():
        return text

    for attempt in range(max_retries):
        try:
            translator = GoogleTranslator(source="en", target=target_lang)
            result = translator.translate(text)
            time.sleep(0.05)
            # Restore brand names
            result = protect_brand_names(text, result)
            return result
        except Exception as e:
            print(f"  [WARN] Attempt {attempt+1}/{max_retries} failed: {e}")
            time.sleep(1)
    return None


def main():
    # Create backup
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "src", "i18n.backup4")
    if not os.path.exists(backup_dir):
        shutil.copytree(I18N_DIR, backup_dir)
        print(f"[BACKUP] Backup created at {backup_dir}")
    else:
        print(f"[INFO] Backup already exists at {backup_dir}, skipping")

    # Load English values
    en_data = load_json(EN_PATH)
    en_values = {}
    for path in MISSING_KEY_PATHS:
        val = get_nested(en_data, path)
        if val is not None:
            en_values[path] = val
        else:
            print(f"[ERROR] Key not found in en.json: {path}")

    print(f"[INFO] {len(en_values)} keys to translate\n")

    total_translated = 0
    total_skipped = 0
    total_failed = 0

    # Process each locale
    target_files = sorted(f for f in os.listdir(I18N_DIR)
                          if f.endswith(".json") and f != "en.json")

    for filename in target_files:
        filepath = os.path.join(I18N_DIR, filename)
        locale_code = filename.replace(".json", "")
        target_lang = LANG_MAP.get(locale_code)

        if not target_lang:
            print(f"[ERROR] {filename}: No language mapping, skipping")
            continue

        print(f"\n{'='*60}")
        print(f"🌐 {filename}")
        print(f"{'='*60}")

        locale_data = load_json(filepath)
        locale_modified = False

        for path in MISSING_KEY_PATHS:
            # Skip if already exists
            existing = get_nested(locale_data, path)
            if existing is not None:
                print(f"  [INFO] {path}: already exists, skipping")
                continue

            english_text = en_values.get(path)
            if not english_text:
                continue

            if path in SKIP_TRANSLATION:
                # Keep English
                translated = english_text
                total_skipped += 1
                print(f"  [SKIP] {path}: keeping English -> \"{english_text[:60]}\"")
            else:
                # Translate
                translated = translate_text(english_text, target_lang)
                if translated:
                    total_translated += 1
                    print(f"  [OK] {path}")
                    print(f"     EN: {english_text[:70]}")
                    print(f"     {locale_code}: {translated[:70]}")
                else:
                    # Fall back to English
                    translated = english_text
                    total_failed += 1
                    print(f"  [FAIL] {path}: translation failed, keeping English")

            set_nested(locale_data, path, translated)
            locale_modified = True

        if locale_modified:
            save_json(filepath, locale_data)
            print(f"  [UPDATED] {filename} updated")
        else:
            print(f"  [INFO] No changes")

    print(f"\n{'='*60}")
    print(f"[STATS] {total_translated} translated, {total_skipped} kept English, {total_failed} failed")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
