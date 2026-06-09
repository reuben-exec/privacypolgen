"""
Translate the governingLaw.body field in all non-English i18n JSON files
to match the updated Delaware/USA text from en.json.

Usage: python scripts/translate_governing_law.py
"""

import json
import os
import re
import sys
import time

from deep_translator import GoogleTranslator

I18N_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'i18n')

# Language codes that map to Google Translate codes
# (file prefix -> Google Translate code)
LANG_MAP = {
    'ar': 'ar',
    'bn': 'bn',
    'de': 'de',
    'es': 'es',
    'fr': 'fr',
    'hi': 'hi',
    'ja': 'ja',
    'ka': 'ka',
    'ko': 'ko',
    'nl': 'nl',
    'pt': 'pt',
    'ru': 'ru',
    'ta': 'ta',
    'tr': 'tr',
    'vi': 'vi',
    'zh': 'zh-CN',
}

# The source English text (from en.json)
SOURCE_BODY = (
    "These Terms shall be governed by and construed in accordance with the laws of "
    "the State of Delaware, United States, without regard to its conflict of laws "
    "principles. Any disputes arising under these Terms shall be resolved exclusively "
    "in the courts of the State of Delaware. Nothing in this section limits your "
    "rights under applicable consumer protection laws in your country or state of "
    "residence. If you are a resident of a jurisdiction with mandatory consumer "
    "protections (including but not limited to the European Union and the United "
    "Kingdom), those protections remain unaffected."
)

DELAY = 0.3  # seconds between translations to avoid rate limiting
RETRIES = 3


def translate_text(text: str, target_lang: str) -> str:
    """Translate text to target language with retry logic."""
    for attempt in range(RETRIES):
        try:
            translator = GoogleTranslator(source='en', target=target_lang)
            result = translator.translate(text)
            if result:
                return result
        except Exception as e:
            if attempt < RETRIES - 1:
                wait = (attempt + 1) * 2
                print(f"  Retry {attempt + 1}/{RETRIES} in {wait}s... ({e})")
                time.sleep(wait)
            else:
                print(f"  FAILED after {RETRIES} attempts: {e}")
                return None
    return None


def main():
    en_path = os.path.join(I18N_DIR, 'en.json')
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    # Verify en.json has the new text
    en_body = en_data['termsPage']['sections']['governingLaw']['body']
    if 'Delaware' not in en_body:
        print("ERROR: en.json governingLaw.body does not contain 'Delaware'.")
        print("Run this script AFTER updating en.json with the new jurisdiction text.")
        sys.exit(1)
    
    print(f"Source text: {en_body[:80]}...")
    print()
    
    for lang_code, gt_code in sorted(LANG_MAP.items()):
        filepath = os.path.join(I18N_DIR, f'{lang_code}.json')
        if not os.path.exists(filepath):
            print(f"  SKIP {lang_code}: file not found")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        old_body = data.get('termsPage', {}).get('sections', {}).get('governingLaw', {}).get('body', '')
        if not old_body:
            print(f"  SKIP {lang_code}: no governingLaw.body found")
            continue
        
        print(f"  {lang_code}: Translating...", end=' ', flush=True)
        translated = translate_text(SOURCE_BODY, gt_code)
        if translated is None:
            print()
            continue
        
        data['termsPage']['sections']['governingLaw']['body'] = translated
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"OK ({len(translated)} chars)")
        time.sleep(DELAY)
    
    print("\nDone. All non-English files updated.")


if __name__ == '__main__':
    main()
