#!/usr/bin/env python3
"""
Translate the new i18n keys (termsPage, privacyPage, contactPage, and SEO entries)
into all 16 non-English languages using deep-translator (Google Translate backend).
"""

import json
import os
import time
import copy
from deep_translator import GoogleTranslator

I18N_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n")
EN_PATH = os.path.join(I18N_DIR, "en.json")

# Language code mapping: our locale → Google Translate language code
# Most match directly, exceptions noted.
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

# Keys that are part of the "new content" we need to translate
PAGE_KEYS = {"termsPage", "privacyPage", "contactPage"}
SEO_KEYS = {"terms", "privacy", "contact"}

# Counter for stats
stats = {"translated": 0, "failed": 0, "skipped": 0}


def collect_strings(data, prefix=""):
    """
    Walk a nested dict/list structure and collect all string values
    with their paths (for translation).
    Returns: list of (path, text) tuples
    """
    strings = []
    if isinstance(data, dict):
        for key, value in data.items():
            path = f"{prefix}.{key}" if prefix else key
            if isinstance(value, str):
                strings.append((path, value))
            elif isinstance(value, (dict, list)):
                strings.extend(collect_strings(value, path))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            path = f"{prefix}[{i}]"
            if isinstance(item, str):
                strings.append((path, item))
            elif isinstance(item, (dict, list)):
                strings.extend(collect_strings(item, path))
    return strings


def translate_text(text, target_lang, max_retries=3):
    """Translate a single text string. Returns translated text or None on failure."""
    if not text or not text.strip():
        return text
    
    for attempt in range(max_retries):
        try:
            translator = GoogleTranslator(source="en", target=target_lang)
            result = translator.translate(text)
            # Small delay to be polite to the API
            time.sleep(0.05)
            return result
        except Exception as e:
            print(f"  ⚠ Attempt {attempt+1}/{max_retries} failed: {e}")
            time.sleep(1)
    return None


def translate_and_update(filepath, target_lang):
    """
    Translate the new sections in a language file.
    """
    global stats
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    modified = False
    
    # 1. Translate SEO entries
    if "seo" in data:
        seo = data["seo"]
        for key in SEO_KEYS:
            if key in seo:
                for field in ("title", "description"):
                    if field in seo[key] and seo[key][field]:
                        text = seo[key][field]
                        translated = translate_text(text, target_lang)
                        if translated and translated != text:
                            seo[key][field] = translated
                            stats["translated"] += 1
                            modified = True
                            print(f"    ✅ seo.{key}.{field}: {text[:40]}... → {translated[:40]}...")
                        else:
                            stats["skipped"] += 1
    # 2. Translate the three page sections
    for page_key in PAGE_KEYS:
        if page_key in data:
            section = data[page_key]
            strings = collect_strings(section)
            for path, text in strings:
                translated = translate_text(text, target_lang)
                if translated and translated != text:
                    # Set the value via the path
                    set_nested_value(data, f"{page_key}.{path}", translated)
                    stats["translated"] += 1
                    modified = True
                    print(f"    ✅ {page_key}.{path}: {text[:50]}... → {translated[:50]}...")
                else:
                    stats["skipped"] += 1
    
    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return True
    return False


def set_nested_value(data, path, value):
    """Set a value in nested dict/list structure by dot path."""
    keys = path.split(".")
    current = data
    for i, key in enumerate(keys):
        if i == len(keys) - 1:
            current[key] = value
        else:
            # Handle array indices
            if "[" in key:
                actual_key, idx_str = key.split("[")
                idx = int(idx_str.rstrip("]"))
                current = current[actual_key][idx]
            else:
                current = current[key]


def main():
    # Backup
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "src", "i18n.backup2")
    if not os.path.exists(backup_dir):
        import shutil
        shutil.copytree(I18N_DIR, backup_dir)
        print(f"📦 Backup created at {backup_dir}")
    
    target_files = sorted(f for f in os.listdir(I18N_DIR) if f.endswith(".json") and f != "en.json")
    
    for filename in target_files:
        filepath = os.path.join(I18N_DIR, filename)
        locale_code = filename.replace(".json", "")
        target_lang = LANG_MAP.get(locale_code)
        
        if not target_lang:
            print(f"❌ {filename}: No language mapping for {locale_code}, skipping")
            continue
        
        print(f"\n🌐 {filename} ({locale_code}) → Google Translate lang: {target_lang}")
        
        try:
            modified = translate_and_update(filepath, target_lang)
            if modified:
                print(f"  ✨ Updated")
            else:
                print(f"  ℹ️ No changes made")
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            stats["failed"] += 1
    
    print(f"\n{'='*60}")
    print(f"📊 Stats: {stats['translated']} translated, {stats['failed']} failed, {stats['skipped']} skipped")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
