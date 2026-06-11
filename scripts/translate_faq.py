#!/usr/bin/env python3
"""
Translate the 7 new FAQ items (positions 0-6) into all 16 non-English
languages using deep-translator (Google Translate backend).

The new items are currently in English; this script translates just
those items while preserving all existing translations for items 7-18.
"""

import json
import os
import time
import sys

I18N_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n")

# Language code mapping: our locale -> Google Translate language code
LANG_MAP = {
    "ar": "ar",
    "bn": "bn",
    "de": "de",
    "es": "es",
    "fr": "fr",
    "hi": "hi",
    "ja": "ja",
    "ka": "ka",
    "ko": "ko",
    "nl": "nl",
    "pt": "pt",
    "ru": "ru",
    "ta": "ta",
    "tr": "tr",
    "vi": "vi",
    "zh": "zh-CN",
}

# Only translate new items at positions 0-6
NEW_ITEM_INDICES = {0, 1, 2, 3, 4, 5, 6}

stats = {"translated": 0, "failed": 0, "skipped": 0}


def translate_text(text, target_lang, max_retries=3):
    """Translate a single text string. Returns translated text or None on failure."""
    if not text or not text.strip():
        return text
    for attempt in range(max_retries):
        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source="en", target=target_lang)
            result = translator.translate(text)
            time.sleep(0.05)
            return result
        except Exception as e:
            print(f"    !! Attempt {attempt+1}/{max_retries} failed: {e}")
            time.sleep(1)
    return None


def main():
    global stats

    # Backup
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "src", "i18n.backup4")
    if not os.path.exists(backup_dir):
        import shutil
        shutil.copytree(I18N_DIR, backup_dir)
        print(f"Backup created at {backup_dir}")

    target_files = sorted(f for f in os.listdir(I18N_DIR) if f.endswith(".json") and f != "en.json")

    for filename in target_files:
        filepath = os.path.join(I18N_DIR, filename)
        locale_code = filename.replace(".json", "")
        target_lang = LANG_MAP.get(locale_code)

        if not target_lang:
            print(f"?? {filename}: No language mapping for {locale_code}, skipping")
            continue

        print(f"\n  {filename} ({locale_code}) -> Google lang: {target_lang}")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "faq" not in data or "items" not in data["faq"]:
            print(f"    !! No faq.items found, skipping")
            continue

        items = data["faq"]["items"]
        modified = False

        for idx in NEW_ITEM_INDICES:
            if idx >= len(items):
                print(f"    !! Position {idx} out of range (len={len(items)})")
                continue

            item = items[idx]
            text = item.get("q", "")
            if text:
                translated = translate_text(text, target_lang)
                if translated and translated != text:
                    item["q"] = translated
                    stats["translated"] += 1
                    modified = True
                    print(f"    OK faq.items[{idx}].q: {text[:50]}... ==> {translated[:50]}...")
                else:
                    stats["skipped"] += 1

            text = item.get("a", "")
            if text:
                translated = translate_text(text, target_lang)
                if translated and translated != text:
                    item["a"] = translated
                    stats["translated"] += 1
                    modified = True
                    print(f"    OK faq.items[{idx}].a: {text[:50]}... ==> {translated[:50]}...")
                else:
                    stats["skipped"] += 1

        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"    Updated")
        else:
            print(f"    No changes needed")

    print(f"\n{'='*60}")
    print(f"Stats: {stats['translated']} translated, {stats['failed']} failed, {stats['skipped']} skipped")


if __name__ == "__main__":
    main()
