#!/usr/bin/env python3
"""Add wizard.preview.typeToSee to all 17 language files."""
import json, os

I18N_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'i18n')

translations = {
    "en": "Enter your business details to preview the policy",
    "es": "Ingrese los datos de su empresa para previsualizar la política",
    "fr": "Saisissez les informations de votre entreprise pour prévisualiser la politique",
    "de": "Geben Sie Ihre Unternehmensdaten ein, um die Richtlinie zu überprüfen",
    "pt": "Insira os dados da sua empresa para visualizar a política",
    "hi": "नीति का पूर्वावलोकन करने के लिए अपना व्यावसायिक विवरण दर्ज करें",
    "ja": "会社情報を入力してポリシーをプレビュー",
    "ko": "회사 정보를 입력하여 정책을 미리보세요",
    "zh": "输入您的企业信息以预览政策",
    "ru": "Введите данные вашей компании для предварительного просмотра политики",
    "ar": "أدخل بيانات شركتك لمعاينة السياسة",
    "tr": "Politikayı önizlemek için işletme bilgilerinizi girin",
    "vi": "Nhập thông tin doanh nghiệp để xem trước chính sách",
    "nl": "Voer uw bedrijfsgegevens in om het beleid te bekijken",
    "bn": "নীতির পূর্বরূপ দেখতে আপনার ব্যবসায়ের বিবরণ লিখুন",
    "ta": "கொள்கையை முன்னோட்டமிட உங்கள் வணிக விவரங்களை உள்ளிடவும்",
    "ka": "შეიყვანეთ თქვენი კომპანიის მონაცემები პოლიტიკის წინასწარ სანახავად",
}

for lang, text in translations.items():
    path = os.path.join(I18N_DIR, f'{lang}.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'wizard' in data and 'preview' in data['wizard']:
        if 'typeToSee' not in data['wizard']['preview']:
            data['wizard']['preview']['typeToSee'] = text
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f'  + {lang}: added typeToSee')
        else:
            print(f'  = {lang}: typeToSee already exists')
    else:
        print(f'  ! {lang}: wizard.preview section not found')

print('Done!')
