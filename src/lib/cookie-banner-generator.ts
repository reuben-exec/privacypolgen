// src/lib/cookie-banner-generator.ts
// Generates copyable HTML/JS code for a cookie consent banner.
// Includes: overlay, toggles, script blocking, localStorage persistence.

import { type CookieBannerConfig, defaultCookieBannerConfig } from './cookie-banner-types';

export interface CookieBannerCode {
  /** The full HTML snippet (banner HTML + inline CSS + JS) */
  html: string;
  /** Just the <script> tag */
  scriptTag: string;
  /** Just the <div> element */
  divTag: string;
  /** CSS for the banner */
  css: string;
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

  const css = `
    <style>
      #ppg-cookie-banner {
        position: fixed;
        ${c.position === 'top' ? 'top: 0; left: 0; right: 0;' : ''}
        ${c.position === 'bottom' ? 'bottom: 0; left: 0; right: 0;' : ''}
        ${c.position === 'bottom-left' ? 'bottom: 20px; left: 20px; right: auto; max-width: 420px;' : ''}
        ${c.position === 'bottom-right' ? 'bottom: 20px; right: 20px; left: auto; max-width: 420px;' : ''}
        z-index: 999999;
        background: ${c.bgColor};
        color: ${c.textColor};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        padding: 20px 24px;
        box-shadow: 0 4px 24px ${hexToRgba(c.bgColor, 0.15)};
        border-radius: ${c.position === 'top' || c.position === 'bottom' ? '0' : '12px'};
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
    </style>`;

  const essentialKey = c.categories.essential ? '1' : '0';
  const analyticsKey = c.categories.analytics ? '1' : '0';
  const preferenceKey = c.categories.preference ? '1' : '0';
  const marketingKey = c.categories.marketing ? '1' : '0';

  const links = [];
  if (c.privacyPolicyUrl) links.push(`<a href="${c.privacyPolicyUrl}" target="_blank" rel="noopener">Privacy Policy</a>`);
  if (c.cookiePolicyUrl) links.push(`<a href="${c.cookiePolicyUrl}" target="_blank" rel="noopener">Cookie Policy</a>`);
  const linksHtml = links.length ? `<div id="ppg-cookie-links">${links.join(' &middot; ')}</div>` : '';

  const divTag = `
    <div id="ppg-cookie-banner" class="hidden">
      <div id="ppg-cookie-header">
        <h3>We value your privacy</h3>
        <button id="ppg-cookie-close" aria-label="Close">&times;</button>
      </div>
      <p id="ppg-cookie-desc">We use cookies to enhance your experience. Choose which cookies you allow below.</p>
      <div id="ppg-cookie-categories">
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label">Essential</div><div class="ppg-cat-desc">Required for the site to function</div></div>
          <button class="ppg-toggle on" data-cat="essential" disabled></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label">Analytics</div><div class="ppg-cat-desc">Help us understand how visitors use the site</div></div>
          <button class="ppg-toggle ${analyticsKey === '1' ? 'on' : ''}" data-cat="analytics"></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label">Preference</div><div class="ppg-cat-desc">Remember your settings and choices</div></div>
          <button class="ppg-toggle ${preferenceKey === '1' ? 'on' : ''}" data-cat="preference"></button>
        </div>
        <div class="ppg-cat-row">
          <div><div class="ppg-cat-label">Marketing</div><div class="ppg-cat-desc">Used to deliver relevant ads</div></div>
          <button class="ppg-toggle ${marketingKey === '1' ? 'on' : ''}" data-cat="marketing"></button>
        </div>
      </div>
      <div id="ppg-cookie-actions">
        <button id="ppg-cookie-accept-all">Accept All</button>
        <button id="ppg-cookie-reject">Reject All</button>
        <button id="ppg-cookie-save">Save Preferences</button>
      </div>
      ${linksHtml}
    </div>`;

  const scriptTag = `
    <script>
    (function() {
      var KEY = 'ppg_cookie_consent';
      var EXPIRY = ${c.expiryDays} * 24 * 60 * 60 * 1000;

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
      }

      applyPrefs(prefs);

      var banner = document.getElementById('ppg-cookie-banner');
      if (!banner || stored) return;

      banner.classList.remove('hidden');

      var toggles = banner.querySelectorAll('.ppg-toggle:not([disabled])');
      toggles.forEach(function(btn) {
        var cat = btn.getAttribute('data-cat');
        if (prefs[cat]) btn.classList.add('on');
        else btn.classList.remove('on');
        btn.addEventListener('click', function() {
          var isOn = btn.classList.contains('on');
          if (isOn) { btn.classList.remove('on'); prefs[cat] = false; }
          else { btn.classList.add('on'); prefs[cat] = true; }
        });
      });

      function hide() { banner.classList.add('hidden'); }

      banner.querySelector('#ppg-cookie-close').addEventListener('click', hide);
      banner.querySelector('#ppg-cookie-accept-all').addEventListener('click', function() {
        prefs = { essential: true, analytics: true, preference: true, marketing: true };
        toggles.forEach(function(b) { b.classList.add('on'); });
        store(prefs); applyPrefs(prefs); hide();
      });
      banner.querySelector('#ppg-cookie-reject').addEventListener('click', function() {
        prefs = { essential: true, analytics: false, preference: false, marketing: false };
        toggles.forEach(function(b) { b.classList.remove('on'); });
        store(prefs); applyPrefs(prefs); hide();
      });
      banner.querySelector('#ppg-cookie-save').addEventListener('click', function() {
        store(prefs); applyPrefs(prefs); hide();
      });
    })();
    </script>`;

  const html = `<!-- Privacy Policy Generator — Cookie Consent Banner -->
${css}
${divTag}
${scriptTag}`;

  return { html, scriptTag, divTag: divTag.trim(), css: css.trim() };
}
