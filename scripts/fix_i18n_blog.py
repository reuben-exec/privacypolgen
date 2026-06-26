#!/usr/bin/env python3
"""Fix two issues in all non-English i18n locale JSON files:
1. Remove stale duplicate blogPage block (after validation, before termsWizard)
2. Add missing blogPost.updatedOn key with locale-appropriate translation
"""
import json
import os
import re
import sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

I18N_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "i18n")

UPDATED_ON = {
    "de": "Aktualisiert am",
    "es": "Actualizado el",
    "fr": "Mis à jour le",
    "ja": "更新日",
    "ko": "업데이트 날짜",
    "zh": "更新于",
    "ar": "تم التحديث في",
    "ru": "Обновлено",
    "pt": "Atualizado em",
    "hi": "अपडेट किया गया",
    "ta": "புதுப்பிக்கப்பட்டது",
    "ka": "განახლდა",
    "vi": "Cập nhật lúc",
    "nl": "Bijgewerkt op",
    "tr": "Güncellendi",
    "bn": "আপডেট করা হয়েছে",
}

def fix_file(locale_code):
    filepath = os.path.join(I18N_DIR, f"{locale_code}.json")
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # ---- Fix 1: Remove stale duplicate blogPage ----
    stale = (
        '  "blogPage": {\n'
        '    "breadcrumb": "Blog",\n'
        '    "heading": "Privacy Policy Blog",\n'
        '    "description": "Tips, guides, and best practices for privacy policy compliance'
        ' \u2014 from GDPR to CCPA and everything in between.",\n'
        '    "empty": "No blog posts yet. Check back soon!"\n'
        '  },\n'
    )
    
    if stale in content:
        content = content.replace(stale, "")
        print(f"  [OK] Removed stale blogPage block")
    else:
        print(f"  [!!] Could not find stale blogPage block")
        return False

    # ---- Fix 2: Add updatedOn to blogPost ----
    if locale_code not in UPDATED_ON:
        print(f"  [!!] No translation for updatedOn for {locale_code}")
        return False
    
    translation = UPDATED_ON[locale_code]
    
    # readTime is the last key before closing }, so add comma after it
    # then insert updatedOn on a new line
    pattern = r'("readTime":\s*"[^"]*")(\n)(\s+\},)'
    match = re.search(pattern, content)
    if match:
        new = f'{match.group(1)},\n    "updatedOn": "{translation}"\n{match.group(3)}'
        content = content[:match.start()] + new + content[match.end():]
        print(f'  [OK] Added blogPost.updatedOn = "{translation}"')
    else:
        print(f"  [!!] Could not find blogPost block to add updatedOn")
        return False
    
    # Write the file
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    # Validate JSON
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            json.load(f)
        print(f"  [OK] JSON is valid")
        return True
    except json.JSONDecodeError as e:
        print(f"  [!!] JSON INVALID: {e}")
        return False

def main():
    locales = ["de", "es", "fr", "ja", "ko", "zh", "ar", "ru", "pt", "hi", "ta", "ka", "vi", "nl", "tr", "bn"]
    
    success = 0
    failed = 0
    
    for locale in locales:
        print(f"\n=== Fixing {locale}.json ===")
        try:
            if fix_file(locale):
                success += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  [!!] ERROR: {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Done! Success: {success}, Failed: {failed}, Total: {len(locales)}")

if __name__ == "__main__":
    main()
