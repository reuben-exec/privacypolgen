// src/components/CookieReader.tsx
// Reads ?h=... from the URL, decodes the cookie policy input, generates the document, and renders it.

import { useEffect, useMemo, useState } from 'react';
import { decodeHashToCookie, generateCookiePolicy } from '@/lib/cookie-generator';
import { DocumentView } from '@/components/DocumentView';
import { I18nProvider, useI18n } from '@/lib/I18nProvider';
import { localizePath } from '@/lib/i18n';
import { buildCookieOverrides } from '@/lib/buildOverrides';

function CookieReaderInner() {
  const { t, locale } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = params.get('h');
    if (!h) {
      setError(t('cookieReader.errorNoHash'));
      return;
    }
    const decoded = decodeHashToCookie(h);
    if (!decoded) {
      setError(t('cookieReader.errorInvalid'));
      return;
    }
    setHash(h);
  }, [t]);

  const doc = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const h = new URLSearchParams(window.location.search).get('h');
    if (!h) return null;
    const decoded = decodeHashToCookie(h);
    if (!decoded) return null;
    return generateCookiePolicy(decoded, buildCookieOverrides(t, locale));
  }, [hash]);

  const formattedDate = useMemo(() => {
    if (!doc) return '';
    return new Date(doc.generatedAt).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [doc, locale]);

  if (error) {
    return (
      <div className="rounded-card border border-border bg-bg-elevated p-8 text-center">
        <p className="text-fg-muted text-sm mb-4">{error}</p>
        <a
          href={localizePath('/generate/cookie-policy', locale)}
          className="inline-flex h-9 items-center rounded-button bg-fg text-bg px-4 text-sm font-medium hover:opacity-90"
        >
          {t('cookieReader.generateNew')}
        </a>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="rounded-card border border-border bg-bg-elevated p-8 text-center">
        <div className="inline-block h-5 w-5 border-2 border-fg-faint border-t-fg rounded-full animate-spin" />
        <p className="text-fg-muted text-sm mt-3">{t('cookieReader.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-bg-elevated p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('cookieReader.title', { businessName: doc.businessName })}
          </h1>
          <p className="text-xs text-fg-muted mt-0.5">
            {t('cookieReader.lastUpdated', { date: formattedDate })}
          </p>
        </div>
        <a
          href={localizePath('/generate/cookie-policy', locale)}
          className="inline-flex h-8 items-center rounded-button border border-border bg-bg px-3 text-xs font-medium text-fg hover:bg-bg-card"
        >
          {t('cookieReader.generateOwn')}
        </a>
      </div>
      <DocumentView
        title={t('documentType.cookie')}
        markdown={doc.markdown}
        html={doc.html}
        plainText={doc.plainText}
        businessName={doc.businessName}
        websiteUrl={doc.websiteUrl}
        hash={doc.hash}
        generatedAt={doc.generatedAt}
        i18nPrefix="cookieView"
      />
    </div>
  );
}

export function CookieReader() {
  return (
    <I18nProvider>
      <CookieReaderInner />
    </I18nProvider>
  );
}
