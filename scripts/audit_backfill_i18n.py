#!/usr/bin/env python3
"""
Audit all locale JSON files against en.json and backfill missing keys.
Uses English text as fallback for missing keys.
"""
import json
import os
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

I18N_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'i18n')

def flatten_keys(obj, prefix=''):
    """Flatten a nested dict into dot-notation keys with values."""
    items = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                items.update(flatten_keys(v, new_key))
            elif isinstance(v, list):
                items[new_key] = v
            else:
                items[new_key] = v
    return items

def set_nested(obj, path, value):
    """Set value in nested dict using dot-notation path."""
    keys = path.split('.')
    for k in keys[:-1]:
        if k not in obj or not isinstance(obj[k], dict):
            obj[k] = {}
        obj = obj[k]
    obj[keys[-1]] = value

def main():
    # Load English JSON
    en_path = os.path.join(I18N_DIR, 'en.json')
    with open(en_path, 'r', encoding='utf-8') as f:
        en_json = json.load(f)

    en_flat = flatten_keys(en_json)
    print(f"English JSON has {len(en_flat)} leaf keys")

    # Find all locale files
    locale_files = sorted([
        f for f in os.listdir(I18N_DIR)
        if f.endswith('.json') and f != 'en.json'
    ])

    print(f"\nFound {len(locale_files)} locale files: {', '.join(locale_files)}")
    print("=" * 70)

    for locale_file in locale_files:
        locale_path = os.path.join(I18N_DIR, locale_file)
        with open(locale_path, 'r', encoding='utf-8') as f:
            locale_json = json.load(f)

        locale_flat = flatten_keys(locale_json)
        locale_code = locale_file.replace('.json', '')

        # Find missing keys
        missing = []
        for key, en_value in en_flat.items():
            if key not in locale_flat:
                missing.append((key, en_value))

        if missing:
            print(f"\n{'=' * 60}")
            print(f"  {locale_code.upper()} ({locale_file}) -- {len(missing)} missing keys:")
            print(f"{'=' * 60}")

            for key, en_value in missing:
                if isinstance(en_value, str):
                    display = en_value[:60] + ('...' if len(en_value) > 60 else '')
                elif isinstance(en_value, list):
                    display = f"[list of {len(en_value)} items]"
                else:
                    display = str(en_value)

                print(f"  + {key}")
                print(f"    EN: {display}")
                set_nested(locale_json, key, en_value)

            # Write back
            with open(locale_path, 'w', encoding='utf-8') as f:
                json.dump(locale_json, f, indent=2, ensure_ascii=False)
                f.write('\n')

            print(f"\n  Updated {locale_file}")
        else:
            print(f"\n  {locale_code.upper()} ({locale_file}) -- no missing keys")

    print(f"\n{'=' * 70}")
    print("VERIFICATION:")
    print(f"{'=' * 70}")
    for locale_file in locale_files:
        locale_path = os.path.join(I18N_DIR, locale_file)
        with open(locale_path, 'r', encoding='utf-8') as f:
            locale_json = json.load(f)
        locale_flat = flatten_keys(locale_json)
        locale_code = locale_file.replace('.json', '')
        still_missing = [k for k in en_flat if k not in locale_flat]
        if still_missing:
            print(f"  WARNING {locale_code}: STILL missing {len(still_missing)} keys: {still_missing[:5]}...")
        else:
            print(f"  OK {locale_code}: complete ({len(locale_flat)} keys)")

if __name__ == '__main__':
    main()
