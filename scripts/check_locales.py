import json, glob, os

def flatten(obj, prefix=''):
    keys = []
    for k, v in obj.items():
        path = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            keys.extend(flatten(v, path))
        else:
            keys.append(path)
    return keys

i18n_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'i18n')

with open(os.path.join(i18n_dir, 'en.json'), encoding='utf-8') as f:
    en = json.load(f)
en_keys = set(flatten(en))
print(f'en.json has {len(en_keys)} keys')

for fpath in sorted(glob.glob(os.path.join(i18n_dir, '*.json'))):
    if 'en.json' in fpath: 
        continue
    locale = os.path.basename(fpath).replace('.json', '')
    with open(fpath, encoding='utf-8') as f:
        data = json.load(f)
    loc_keys = set(flatten(data))
    missing = en_keys - loc_keys
    extra = loc_keys - en_keys
    if missing:
        print(f'\n*** {locale}.json: MISSING {len(missing)} keys ***')
        for k in sorted(missing):
            print(f'  MISSING: {k}')
    if extra:
        print(f'\n*** {locale}.json: EXTRA {len(extra)} keys ***')
        for k in sorted(extra):
            print(f'  EXTRA: {k}')
    if not missing and not extra:
        print(f'{locale}.json: OK ({len(loc_keys)} keys)')
