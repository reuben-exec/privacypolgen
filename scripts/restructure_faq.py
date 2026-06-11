#!/usr/bin/env python3
"""
Restructure faq.items in all locale files to match the new ordering
in src/data/faq.json (19 items, most-important-first).

Strategy:
- new_faq.json has 19 items (index 0–18) in the desired order
- Old locale files have 12 items (index 0–11)
- We map old[0]->new[7], old[1]->new[9], etc.
- New items at positions 0–6 get English text from faq.json
- For en.json: replace faq.items entirely with faq.json data
- For other locales: replace faq.items with 19 items, preserving
  existing translations for old items at their new positions, and
  using English for new items.
"""

import json
import os
import shutil

I18N_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n")
FAQ_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "data", "faq.json")
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "i18n.backup3")

# Old → New index mapping (12 existing items → new positions)
OLD_TO_NEW = {
    0: 7,   # Is this privacy policy generator really free?
    1: 9,   # Do I need an account to generate a privacy policy?
    2: 14,  # Is the generated policy legally binding?
    3: 13,  # Where is my data stored?
    4: 11,  # Can I edit the policy after generating it?
    5: 8,   # Does this cover GDPR, CCPA, and other laws?
    6: 17,  # What's the difference between free and Premium tiers?
    7: 10,  # How do I add the policy to my website?
    8: 15,  # Will my policy update if laws change?
    9: 18,  # Can I use this for a client project?
    10: 12, # Does the policy include a cookie section?
    11: 16, # What if I don't know what laws apply to me?
}

# New items (positions that don't have a mapping from old)
NEW_POSITIONS = {0, 1, 2, 3, 4, 5, 6}


def main():
    # Read the new FAQ data (19 items)
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        new_faq = json.load(f)
    assert len(new_faq) == 19, f"Expected 19 FAQ items, got {len(new_faq)}"

    # Backup all locale files
    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)
    shutil.copytree(I18N_DIR, BACKUP_DIR)
    print(f"Backup created at {BACKUP_DIR}")

    # Process each locale file
    for filename in sorted(os.listdir(I18N_DIR)):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(I18N_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "faq" not in data or "items" not in data["faq"]:
            print(f"!! {filename}: No faq.items found, skipping")
            continue

        old_items = data["faq"]["items"]
        old_len = len(old_items)
        print(f"  {filename}: {old_len} old items -> 19 new items")

        is_english = filename == "en.json"

        if is_english:
            # English: directly replace with faq.json data
            new_items = new_faq
        else:
            # Build new array of 19 items
            new_items = []
            for i in range(19):
                if i in NEW_POSITIONS:
                    # New item: use English text from faq.json
                    new_items.append({
                        "q": new_faq[i]["q"],
                        "a": new_faq[i]["a"],
                    })
                else:
                    # Find which old index maps to this position
                    old_idx = None
                    for oi, ni in OLD_TO_NEW.items():
                        if ni == i:
                            old_idx = oi
                            break
                    if old_idx is not None and old_idx < old_len:
                        # Preserve existing translation
                        new_items.append(old_items[old_idx])
                    else:
                        # Fallback to English
                        new_items.append({
                            "q": new_faq[i]["q"],
                            "a": new_faq[i]["a"],
                        })
                        print(f"    !! Position {i}: no old mapping, using English")

            assert len(new_items) == 19, f"Expected 19 items, got {len(new_items)}"

        data["faq"]["items"] = new_items

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"  OK Updated")

    print(f"\n{'='*60}")
    print(f"All 17 locale files updated.")
    print(f"Backup at: {BACKUP_DIR}")


if __name__ == "__main__":
    main()
