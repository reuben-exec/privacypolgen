// src/lib/cookie-banner-generator.ts
// Generates copyable HTML/JS code for a cookie consent banner.
// Features: positions, styles, i18n, Google Consent Mode v2, accessibility, consent log.

import { type CookieBannerConfig, defaultCookieBannerConfig } from './cookie-banner-types';
import { generateI18nLiteral } from './cookie-banner-i18n';

export interface CookieBannerCode {
  /** The full HTML snippet (banner HTML + inline CSS + JS) */
  html: string;
  /** Just the <script> tag */
  scriptTag: string;
  /** Just the <div> element */
  divTag: string;
  /** CSS for the banner */
  css: string;
  /** Integration snippets (GA4, Meta, Hotjar) */
  integrations: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Generate the cookie banner code that users can copy-paste into their site.
 */
export function generateCookieBannerCode(config: CookieBannerConfig = defaultCookieBannerConfig): CookieBannerCode {
  const c = { ...defaultCookieBannerConfig, ...config };

  // ── Position CSS ──
  function positionCss(pos: string): string {
    switch (pos) {
      case 'top':
        return 'top: 0; left: 0; right: 0; border-radius: 0;';
      case 'bottom':
        return 'bottom: 0; left: 0; right: 0; border-radius: 0;';
      case 'bottom-left':
        return 'bottom: 20px; left: 20px; right: auto; max-width: 420px; border-radius: 12px;';
      case 'bottom-right':
        return 'bottom: 20px; right: 20px; left: auto; max-width: 420px; border-radius: 12px;';
      case 'modal':
        return 'top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 500px; width: 90%; border-radius: 16px;';
      default:
        return 'bottom: 0; left: 0; right: 0; border-radius: 0;';
    }
  }

  // ── Backdrop CSS (modal only) ──
  const backdropCss = c.position === 'modal' ? `
      #ppg-cookie-backdrop {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999998;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      #ppg-cookie-backdrop.hidden { opacity: 0; pointer-events: none; }
    ` : '';

  const css = `
    <style>
      ${backdropCss}
      #ppg-cookie-banner {
        position: fixed;
        ${positionCss(c.position)}
        z-index: 999999;
        background: ${c.bgColor};
        color: ${c.textColor};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        padding: 20px 24px;
        box-shadow: 0 4px 24px ${hexToRgba(c.bgColor, 0.15)};
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      #ppg-cookie-banner.hidden { display: none; }
      #ppg-cookie-banner * { box-sizing: border-box; }
      #ppg-cookie-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
      #ppg-cookie-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
      #ppg-cookie-close { background: none; border: none; color: ${c.textColor}; cursor: pointer; font-size: 20px; padding: 0; line-height: 1; opacity: 0.6; }
      #ppg-cookie-close:hover { opacity: 1; }
      #ppg-cookie-desc { margin-bottom: 16px; font-size: 13px; opacity: 0.85; }
      #ppg-cookie-categories { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
      .ppg-cat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${hexToRgba(c.textColor, 0.1)}; }
      .ppg-cat-row:last-child { border-bottom: none; }
      .ppg-cat-label { font-size: 13px; font-weight: 500; }
      .ppg-cat-desc { font-size: 12px; opacity: 0.7; margin-top: 2px; }
      .ppg-toggle { position: relative; width: 40px; height: 22px; background: ${hexToRgba(c.textColor, 0.2)}; border-radius: 11px; border: none; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
      .ppg-toggle.on { background: ${c.btnBg}; }
      .ppg-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
      .ppg-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s; }
      .ppg-toggle.on::after { transform: translateX(18px); }
      #ppg-cookie-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      #ppg-cookie-accept-all { background: ${c.btnBg}; color: ${c.btnText}; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
      #ppg-cookie-accept-all:hover { opacity: 0.9; }
      #ppg-cookie-reject { background: transparent; color: ${c.textColor}; border: 1px solid ${hexToRgba(c.textColor, 0.3)}; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
      #ppg-cookie-reject:hover { border-color: ${c.textColor}; }
      #ppg-cookie-save { background: transparent; color: ${c.textColor}; border: 1px solid ${hexToRgba(c.textColor, 0.3)}; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
      #ppg-cookie-save:hover { border-color: ${c.textColor}; }
      #ppg-cookie-links { margin-top: 10px; font-size: 12px; }
      #ppg-cookie-links a { color: ${c.textColor}; text-decoration: underline; opacity: 0.7; }
      #ppg-cookie-links a:hover { opacity: 1; }
      @media (max-width: 639px) {
        #ppg-cookie-banner { padding: 16px; }
        #ppg-cookie-actions { flex-direction: column; }
        #ppg-cookie-actions button { width: 100%; }
      }
    </style>`;

  const essentialKey = c.categories.essential ? '1' : '0';
  const analyticsKey = c.categories.analytics ? '1' : '0';
  const preferenceKey = c.categories.preference ? '1' : '0';
  const marketingKey = c.categories.marketing ? '1' : '0';

  const links = [];
  if (c.privacyPolicyUrl) links.push(`<a href="${c.privacyPolicyUrl}" target="_blank" rel="noopener">Privacy Policy</a>`);
  if (c.cookiePolicyUrl) links.push(`<a href="${c.cookiePolicyUrl}" target="_blank" rel="noopener">Cookie Policy</a>`);
  const linksHtml = links.length ? `<div id="ppg-cookie-links">${links.join(' &middot; ')}</div>` : '';

  // ── i18n: embed the dictionary + selection logic ──
  const i18nLiteral = generateI18nLiteral();
  const langValue = c.language === 'auto' ? '' : c.language;

  // ── Accessibility: ARIA attributes for modal ──
  const ariaAttrs = c.position === 'modal'
    ? 'role="dialog" aria-modal="true" aria-labelledby="ppg-cookie-title" aria-describedby="ppg-cookie-desc"'
    : '';

  const backdropHtml = c.position === 'modal'
    ? '<div id="ppg-cookie-backdrop"></div>'
    : '';

  const divTag = `
    ${backdropHtml}
    <div id="ppg-cookie-banner" class="hidden" ${ariaAttrs}>
      <div id="ppg-cookie-header">
        <h3 id="ppg-cookie-title"></h3>
        <button id="ppg-cookie-close" aria-label="Close">&times;</button>
      </div>
      <p id="ppg-cookie-desc"></p>
      <div id="ppg-cookie-categories">
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label" id="ppg-lbl-essential"></div><div class="ppg-cat-desc" id="ppg-lbl-essential-desc"></div></div>
          <button class="ppg-toggle on" data-cat="essential" disabled aria-label="Essential" role="switch" aria-checked="true"></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label" id="ppg-lbl-analytics"></div><div class="ppg-cat-desc" id="ppg-lbl-analytics-desc"></div></div>
          <button class="ppg-toggle ${analyticsKey === '1' ? 'on' : ''}" data-cat="analytics" aria-label="Analytics" role="switch" aria-checked="${analyticsKey}"></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label" id="ppg-lbl-preference"></div><div class="ppg-cat-desc" id="ppg-lbl-preference-desc"></div></div>
          <button class="ppg-toggle ${preferenceKey === '1' ? 'on' : ''}" data-cat="preference" aria-label="Preference" role="switch" aria-checked="${preferenceKey}"></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label" id="ppg-lbl-marketing"></div><div class="ppg-cat-desc" id="ppg-lbl-marketing-desc"></div></div>
          <button class="ppg-toggle ${marketingKey === '1' ? 'on' : ''}" data-cat="marketing" aria-label="Marketing" role="switch" aria-checked="${marketingKey}"></button>
        </div>
      </div>
      <div id="ppg-cookie-actions">
        <button id="ppg-cookie-accept-all"></button>
        <button id="ppg-cookie-reject"></button>
        <button id="ppg-cookie-save"></button>
      </div>
      ${linksHtml}
    </div>`;

  // ── Google Consent Mode v2 preamble ──
  const consentModePreamble = c.googleConsentMode ? `
      // Google Consent Mode v2 — set defaults before any Google tags load
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });` : '';

  // ── Google Consent Mode v2 update function ──
  const consentModeUpdate = c.googleConsentMode ? `
        // Google Consent Mode v2 — sync consent state
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            'analytics_storage': p.analytics ? 'granted' : 'denied',
            'ad_storage': p.marketing ? 'granted' : 'denied',
            'ad_user_data': p.marketing ? 'granted' : 'denied',
            'ad_personalization': p.marketing ? 'granted' : 'denied'
          });
        }` : '';

  // ── Meta Pixel consent sync ──
  const metaPixelSync = `
        // Meta Pixel consent sync
        if (typeof window.fbq === 'function') {
          window.fbq('consent', p.marketing ? 'grant' : 'revoke');
        }`;

  // ── Consent audit log ──
  const consentLogCode = c.consentLog ? `
        // Consent audit log — track decisions in localStorage
        (function() {
          var LOG_KEY = 'ppg_consent_log';
          var log = [];
          try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch(e) {}
          Object.keys(p).forEach(function(cat) {
            if (cat === 'essential') return;
            log.push({ cat: cat, granted: p[cat], time: new Date().toISOString() });
          });
          localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-100)));
        })();` : '';

  // ── Escape handler for modal ──
  const escapeHandler = c.position === 'modal' ? `
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !banner.classList.contains('hidden')) {
          hide();
        }
      });` : '';

  // ── Focus trap for modal ──
  const focusTrap = c.position === 'modal' ? `
      // Focus trap for accessibility
      var focusable = banner.querySelectorAll('button:not([disabled]), a, [tabindex]:not([tabindex="-1"])');
      banner.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab' || !focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      });
      // Auto-focus first button when banner shows
      setTimeout(function() { if (focusable[0]) focusable[0].focus(); }, 100);` : '';

  const scriptTag = `
    <script>
    (function() {
      ${consentModePreamble}

      var KEY = 'ppg_cookie_consent';
      var EXPIRY = ${c.expiryDays} * 24 * 60 * 60 * 1000;

      // ── i18n ──
      var I18N = ${i18nLiteral};
      var userLang = ${langValue ? `'${langValue}'` : 'navigator.language.split("-")[0]'};
      var T = I18N[userLang] || I18N.en;
      var isRTL = userLang === 'ar';

      function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

      function applyTexts() {
        setText('ppg-cookie-title', T.title);
        setText('ppg-cookie-desc', T.description);
        setText('ppg-lbl-essential', T.categoryEssential);
        setText('ppg-lbl-essential-desc', T.categoryEssentialDesc);
        setText('ppg-lbl-analytics', T.categoryAnalytics);
        setText('ppg-lbl-analytics-desc', T.categoryAnalyticsDesc);
        setText('ppg-lbl-preference', T.categoryPreference);
        setText('ppg-lbl-preference-desc', T.categoryPreferenceDesc);
        setText('ppg-lbl-marketing', T.categoryMarketing);
        setText('ppg-lbl-marketing-desc', T.categoryMarketingDesc);
        setText('ppg-cookie-accept-all', T.acceptAll);
        setText('ppg-cookie-reject', T.rejectAll);
        setText('ppg-cookie-save', T.savePreferences);
      }

      function getStored() {
        try {
          var raw = localStorage.getItem(KEY);
          if (!raw) return null;
          var d = JSON.parse(raw);
          if (Date.now() > d.ts + EXPIRY) { localStorage.removeItem(KEY); return null; }
          return d;
        } catch(e) { return null; }
      }

      function store(prefs) {
        localStorage.setItem(KEY, JSON.stringify({ prefs: prefs, ts: Date.now() }));
      }

      var defaults = { essential: true, analytics: ${analyticsKey === '1'}, preference: ${preferenceKey === '1'}, marketing: ${marketingKey === '1'} };
      var stored = getStored();
      var prefs = stored ? stored.prefs : defaults;

      function applyPrefs(p) {
        window.dispatchEvent(new CustomEvent('ppg:cookies', { detail: p }));
        ${consentModeUpdate}
        ${metaPixelSync}
        ${consentLogCode}
      }

      applyPrefs(prefs);

      var banner = document.getElementById('ppg-cookie-banner');
      if (!banner) return;

      applyTexts();
      if (isRTL) { banner.setAttribute('dir', 'rtl'); }

      if (stored) return; // Already consented

      banner.classList.remove('hidden');
      var backdrop = document.getElementById('ppg-cookie-backdrop');
      if (backdrop) backdrop.classList.remove('hidden');

      // ── Focus trap + keyboard ──
      ${focusTrap}
      ${escapeHandler}

      var toggles = banner.querySelectorAll('.ppg-toggle:not([disabled])');
      toggles.forEach(function(btn) {
        var cat = btn.getAttribute('data-cat');
        if (prefs[cat]) btn.classList.add('on');
        else btn.classList.remove('on');
        btn.addEventListener('click', function() {
          var isOn = btn.classList.contains('on');
          if (isOn) { btn.classList.remove('on'); prefs[cat] = false; }
          else { btn.classList.add('on'); prefs[cat] = true; }
          btn.setAttribute('aria-checked', btn.classList.contains('on') ? 'true' : 'false');
        });
      });

      function hide() {
        banner.classList.add('hidden');
        if (backdrop) backdrop.classList.add('hidden');
      }

      banner.querySelector('#ppg-cookie-close').addEventListener('click', hide);
      banner.querySelector('#ppg-cookie-accept-all').addEventListener('click', function() {
        prefs = { essential: true, analytics: true, preference: true, marketing: true };
        toggles.forEach(function(b) { b.classList.add('on'); b.setAttribute('aria-checked', 'true'); });
        store(prefs); applyPrefs(prefs); hide();
      });
      banner.querySelector('#ppg-cookie-reject').addEventListener('click', function() {
        prefs = { essential: true, analytics: false, preference: false, marketing: false };
        toggles.forEach(function(b) { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); });
        store(prefs); applyPrefs(prefs); hide();
      });
      banner.querySelector('#ppg-cookie-save').addEventListener('click', function() {
        store(prefs); applyPrefs(prefs); hide();
      });
    })();
    </script>`;

  // ── Integration snippets ──
  const integrations = `<!-- ========================================== -->
<!-- Integration Snippets                      -->
<!-- Paste the relevant snippet BEFORE your     -->
<!-- existing analytics/tracking scripts.       -->
<!-- ========================================== -->

<!-- ── Google Analytics 4 (GA4) ── -->
<!-- Works with Google Consent Mode v2. -->
<!-- Enable "Google Consent Mode" in the config for this. -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- ── Meta Pixel ── -->
<!-- Loads only when marketing cookies are accepted. -->
<script>
  window.addEventListener('ppg:cookies', function(e) {
    if (e.detail.marketing && !window.fbq) {
      (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', 'YOUR_PIXEL_ID');
      window.fbq('track', 'PageView');
    }
  });
</script>

<!-- ── Hotjar ── -->
<!-- Loads only when analytics cookies are accepted. -->
<script>
  window.addEventListener('ppg:cookies', function(e) {
    if (e.detail.analytics && !window.hj) {
      (function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)}
      ;h._hjSettings={hjid:YOUR_HOTJAR_ID,hjv:6})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    }
  });
</script>`;

  const html = `<!-- Privacy Policy Generator — Cookie Consent Banner -->
${css}
${divTag}
${scriptTag}`;

  return { html, scriptTag: scriptTag.trim(), divTag: divTag.trim(), css: css.trim(), integrations: integrations.trim() };
}
