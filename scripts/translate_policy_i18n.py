#!/usr/bin/env python3
"""
Translate the 'policy' namespace from en.json into all 16 non-English locales
using deep-translator (Google Translate backend).

The 'policy' namespace contains generator-fed strings (titles, labels, descriptions)
that need to be localized. Template placeholders ({{var}}, {var}) and markdown
formatting (**bold**, > blockquote) are preserved during translation.
"""

import json
import os
import re
import time
import shutil
from deep_translator import GoogleTranslator

I18N_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n")
EN_PATH = os.path.join(I18N_DIR, "en.json")

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

# Placeholder pattern: {{name}} or {name}
PLACEHOLDER_RE = re.compile(r"\{\{?\w+\}?\}")
# Markdown formatting to protect
MARKDOWN_RE = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|^> .+$)", re.MULTILINE)

stats = {"translated": 0, "failed": 0, "skipped": 0}


def protect_placeholders(text):
    """Replace template placeholders with safe tokens before translation."""
    tokens = {}
    def _replace(m):
        token = f"__PH_{len(tokens)}__"
        tokens[token] = m.group(0)
        return token
    protected = PLACEHOLDER_RE.sub(_replace, text)
    return protected, tokens


def restore_placeholders(text, tokens):
    """Restore template placeholders from safe tokens after translation."""
    for token, original in tokens.items():
        text = text.replace(token, original)
    return text


def translate_text(text, target_lang, max_retries=3):
    """Translate a single text string, preserving placeholders and markdown."""
    if not text or not text.strip():
        return text

    # Protect placeholders before translation
    protected, tokens = protect_placeholders(text)

    for attempt in range(max_retries):
        try:
            translator = GoogleTranslator(source="en", target=target_lang)
            result = translator.translate(protected)
            time.sleep(0.05)
            if result:
                result = restore_placeholders(result, tokens)
            return result
        except Exception as e:
            print(f"  \u26a0 Attempt {attempt+1}/{max_retries} failed: {e}")
            time.sleep(1)
    return None


def deep_merge(source, destination):
    """Recursively merge source into destination (modifies destination in-place)."""
    for key, value in source.items():
        if key in destination:
            if isinstance(value, dict) and isinstance(destination[key], dict):
                deep_merge(value, destination[key])
            else:
                destination[key] = value
        else:
            destination[key] = value
    return destination


def collect_strings(data, prefix=""):
    """Walk a nested dict and collect all string values with their paths."""
    strings = []
    if isinstance(data, dict):
        for key, value in data.items():
            path = f"{prefix}.{key}" if prefix else key
            if isinstance(value, str):
                strings.append((path, value))
            elif isinstance(value, dict):
                strings.extend(collect_strings(value, path))
    return strings


def translate_policy_namespace(filepath, target_lang):
    """Translate the 'policy' namespace in a language file."""
    global stats

    with open(filepath, "r", encoding="utf-8") as f:
        locale_data = json.load(f)

    # Load English policy namespace
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en_data = json.load(f)

    policy_ns = en_data.get("policy", {})

    # If locale already has policy namespace, merge to ensure all keys exist
    if "policy" in locale_data:
        merged = deep_merge(policy_ns, locale_data["policy"])
        locale_data["policy"] = merged
    else:
        locale_data["policy"] = json.loads(json.dumps(policy_ns))

    # Collect all string values from the policy namespace
    strings = collect_strings(locale_data["policy"])
    modified = False

    for path, text in strings:
        translated = translate_text(text, target_lang)
        if translated and translated != text:
            # Set via dot path
            set_nested_value(locale_data, f"policy.{path}", translated)
            stats["translated"] += 1
            modified = True
            print(f"    \u2705 policy.{path}: {text[:50]}... \u2192 {translated[:50]}...")
        else:
            stats["skipped"] += 1

    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(locale_data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return True
    return False


def set_nested_value(data, path, value):
    """Set a value in nested dict by dot path."""
    keys = path.split(".")
    current = data
    for i, key in enumerate(keys):
        if i == len(keys) - 1:
            current[key] = value
        else:
            if key not in current:
                current[key] = {}
            current = current[key]


def main():
    # Backup
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "src", "i18n.backup4")
    if not os.path.exists(backup_dir):
        shutil.copytree(I18N_DIR, backup_dir)
        print(f"\U0001f4e6 Backup created at {backup_dir}")

    target_files = sorted(f for f in os.listdir(I18N_DIR) if f.endswith(".json") and f != "en.json")

    for filename in target_files:
        filepath = os.path.join(I18N_DIR, filename)
        locale_code = filename.replace(".json", "")
        target_lang = LANG_MAP.get(locale_code)

        if not target_lang:
            print(f"\u274c {filename}: No language mapping for {locale_code}, skipping")
            continue

        print(f"\n\U0001f310 {filename} ({locale_code}) \u2192 Google Translate lang: {target_lang}")

        try:
            modified = translate_policy_namespace(filepath, target_lang)
            if modified:
                print(f"  \u2728 Updated")
            else:
                print(f"  \u2139\ufe0f No changes made")
        except Exception as e:
            print(f"  \u274c ERROR: {e}")
            stats["failed"] += 1

    print(f"\n{'='*60}")
    print(f"\U0001f4ca Stats: {stats['translated']} translated, {stats['failed']} failed, {stats['skipped']} skipped")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
