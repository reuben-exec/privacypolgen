// src/lib/cookie-banner-i18n.ts
// Pre-translated strings for cookie consent banner in 10 languages.
// Used by the cookie banner generator to produce multi-language banners.

export interface BannerTranslations {
  title: string;
  description: string;
  categoryEssential: string;
  categoryEssentialDesc: string;
  categoryAnalytics: string;
  categoryAnalyticsDesc: string;
  categoryPreference: string;
  categoryPreferenceDesc: string;
  categoryMarketing: string;
  categoryMarketingDesc: string;
  acceptAll: string;
  rejectAll: string;
  savePreferences: string;
}

export const BANNER_TRANSLATIONS: Record<string, BannerTranslations> = {
  en: {
    title: 'We value your privacy',
    description: 'We use cookies to enhance your experience. Choose which cookies you allow below.',
    categoryEssential: 'Essential',
    categoryEssentialDesc: 'Required for the site to function',
    categoryAnalytics: 'Analytics',
    categoryAnalyticsDesc: 'Help us understand how visitors use the site',
    categoryPreference: 'Preference',
    categoryPreferenceDesc: 'Remember your settings and choices',
    categoryMarketing: 'Marketing',
    categoryMarketingDesc: 'Used to deliver relevant ads',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    savePreferences: 'Save Preferences',
  },
  es: {
    title: 'Valoramos tu privacidad',
    description: 'Utilizamos cookies para mejorar tu experiencia. Elige qué cookies permites a continuación.',
    categoryEssential: 'Esenciales',
    categoryEssentialDesc: 'Necesarias para el funcionamiento del sitio',
    categoryAnalytics: 'Analíticas',
    categoryAnalyticsDesc: 'Nos ayudan a entender cómo los visitantes usan el sitio',
    categoryPreference: 'Preferencias',
    categoryPreferenceDesc: 'Recuerdan tus ajustes y elecciones',
    categoryMarketing: 'Publicidad',
    categoryMarketingDesc: 'Se utilizan para mostrar anuncios relevantes',
    acceptAll: 'Aceptar todo',
    rejectAll: 'Rechazar todo',
    savePreferences: 'Guardar preferencias',
  },
  de: {
    title: 'Wir schätzen Ihre Privatsphäre',
    description: 'Wir verwenden Cookies, um Ihr Erlebnis zu verbessern. Wählen Sie unten, welche Cookies Sie zulassen.',
    categoryEssential: 'Notwendig',
    categoryEssentialDesc: 'Notwendig für die Funktion der Webseite',
    categoryAnalytics: 'Analytische',
    categoryAnalyticsDesc: 'Helfen uns zu verstehen, wie Besucher die Seite nutzen',
    categoryPreference: 'Funktionalitäts',
    categoryPreferenceDesc: 'Erinnern sich an Ihre Einstellungen und Auswahl',
    categoryMarketing: 'Werbungs',
    categoryMarketingDesc: 'Werden verwendet, um relevante Anzeigen auszuliefern',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Alle ablehnen',
    savePreferences: 'Einstellungen speichern',
  },
  fr: {
    title: 'Nous respectons votre vie privée',
    description: 'Nous utilisons des cookies pour améliorer votre expérience. Choisissez les cookies que vous autorisez ci-dessous.',
    categoryEssential: 'Essentiels',
    categoryEssentialDesc: 'Nécessaires au fonctionnement du site',
    categoryAnalytics: 'Analytiques',
    categoryAnalyticsDesc: 'Nous aident à comprendre comment les visiteurs utilisent le site',
    categoryPreference: 'Préférences',
    categoryPreferenceDesc: 'Mémorisent vos paramètres et choix',
    categoryMarketing: 'Publicitaires',
    categoryMarketingDesc: 'Utilisés pour diffuser des publicités pertinentes',
    acceptAll: 'Tout accepter',
    rejectAll: 'Tout refuser',
    savePreferences: 'Sauvegarder les préférences',
  },
  ar: {
    title: 'نحترم خصوصيتك',
    description: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك. اختر ملفات تعريف الارتباط التي تسمح بها أدناه.',
    categoryEssential: 'الضرورية',
    categoryEssentialDesc: 'ضرورية لعمل الموقع',
    categoryAnalytics: 'التحليلية',
    categoryAnalyticsDesc: 'تساعدنا على فهم كيفية استخدام الزوار للموقع',
    categoryPreference: 'التفضيلات',
    categoryPreferenceDesc: 'تتذكر إعداداتك واختياراتك',
    categoryMarketing: 'الإعلانية',
    categoryMarketingDesc: 'تُستخدم لتقديم إعلانات ذات صلة',
    acceptAll: 'قبول الكل',
    rejectAll: 'رفض كل شيء',
    savePreferences: 'حفظ التفضيلات',
  },
  pt: {
    title: 'Valorizamos sua privacidade',
    description: 'Usamos cookies para melhorar sua experiência. Escolha quais cookies você permite abaixo.',
    categoryEssential: 'Essenciais',
    categoryEssentialDesc: 'Necessários para o funcionamento do site',
    categoryAnalytics: 'Analíticos',
    categoryAnalyticsDesc: 'Nos ajudam a entender como os visitantes usam o site',
    categoryPreference: 'Preferências',
    categoryPreferenceDesc: 'Lembram suas configurações e escolhas',
    categoryMarketing: 'Publicitários',
    categoryMarketingDesc: 'Usados para exibir anúncios relevantes',
    acceptAll: 'Aceitar tudo',
    rejectAll: 'Rejeitar tudo',
    savePreferences: 'Salvar preferências',
  },
  ja: {
    title: 'お客様のプライバシーを大切にしています',
    description: '体験を向上させるためにCookieを使用しています。以下で許可するCookieを選択してください。',
    categoryEssential: '必須',
    categoryEssentialDesc: 'サイトの機能に必要',
    categoryAnalytics: '分析',
    categoryAnalyticsDesc: '訪問者のサイト利用状況を理解するのに役立ちます',
    categoryPreference: '設定',
    categoryPreferenceDesc: '設定と選択を記憶します',
    categoryMarketing: 'マーケティング',
    categoryMarketingDesc: '関連する広告を配信するために使用されます',
    acceptAll: 'すべて許可',
    rejectAll: 'すべて拒否',
    savePreferences: '設定を保存',
  },
  ko: {
    title: '귀하의 개인정보 보호를 중요하게 생각합니다',
    description: '원활한 서비스 이용을 위해 쿠키를 사용합니다. 아래에서 허용할 쿠키를 선택하세요.',
    categoryEssential: '필수',
    categoryEssentialDesc: '사이트 운영에 필요',
    categoryAnalytics: '분석',
    categoryAnalyticsDesc: '방문자가 사이트를 사용하는 방식을 이해하는 데 도움이 됩니다',
    categoryPreference: '환경설정',
    categoryPreferenceDesc: '설정과 선택 사항을 기억합니다',
    categoryMarketing: '마케팅',
    categoryMarketingDesc: '관련 광고를 제공하는 데 사용됩니다',
    acceptAll: '모두 허용',
    rejectAll: '모두 거부',
    savePreferences: '환경설정 저장',
  },
  zh: {
    title: '我们重视您的隐私',
    description: '我们使用Cookie来提升您的体验。请在下方选择您允许的Cookie类型。',
    categoryEssential: '必要',
    categoryEssentialDesc: '网站运行所必需',
    categoryAnalytics: '分析',
    categoryAnalyticsDesc: '帮助我们了解访问者如何使用网站',
    categoryPreference: '偏好',
    categoryPreferenceDesc: '记住您的设置和选择',
    categoryMarketing: '营销',
    categoryMarketingDesc: '用于投放相关广告',
    acceptAll: '全部接受',
    rejectAll: '全部拒绝',
    savePreferences: '保存偏好设置',
  },
};

/** Get translations for a language code, falling back to English */
export function getBannerTranslations(langCode: string): BannerTranslations {
  return BANNER_TRANSLATIONS[langCode] || BANNER_TRANSLATIONS.en;
}

/** Generate the i18n dictionary literal for embedding in generated banner code */
export function generateI18nLiteral(): string {
  const langs = Object.keys(BANNER_TRANSLATIONS);
  const entries = langs.map((lang) => {
    const t = BANNER_TRANSLATIONS[lang];
    return `    ${lang}: ${JSON.stringify(t)}`;
  });
  return `{\n${entries.join(',\n')}\n  }`;
}
