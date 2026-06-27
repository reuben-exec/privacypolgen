// src/lib/premium.ts
// Premium status utilities — localStorage-based paywall for a one-time $13.99 purchase.
// Activates once PUBLIC_LEMONSQUEEZY_CHECKOUT_URL is configured in Cloudflare Pages.
// DEV mode: always returns true so premium features work locally without localStorage hacks.

const PREMIUM_KEY = 'ppg-premium';
const PREMIUM_EXPIRY_KEY = 'ppg-premium-expiry';

/** Check if the user has an active premium license (localStorage).
 *  DEV mode: always returns true so premium features work locally without localStorage hacks.
 */
export function isPremium(): boolean {
  // Dev mode bypass — no need to configure LemonSqueezy to test premium features locally
  if (import.meta.env.DEV) return true;

  if (typeof window === 'undefined') return false;

  const value = localStorage.getItem(PREMIUM_KEY);
  if (value !== 'true') return false;

  // Check expiry (if set)
  const expiry = localStorage.getItem(PREMIUM_EXPIRY_KEY);
  if (expiry) {
    const expiryDate = new Date(expiry);
    if (expiryDate.getTime() < Date.now()) {
      // Expired — clear
      localStorage.removeItem(PREMIUM_KEY);
      localStorage.removeItem(PREMIUM_EXPIRY_KEY);
      return false;
    }
  }

  return true;
}

/** Set premium status (called after LemonSqueezy checkout redirect). */
export function setPremium(expiryDays?: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREMIUM_KEY, 'true');
  if (expiryDays && expiryDays > 0) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    localStorage.setItem(PREMIUM_EXPIRY_KEY, expiry.toISOString());
  }
}

/** Get the LemonSqueezy checkout URL from env. Returns null if not configured. */
export function getPremiumCheckoutUrl(): string | null {
  if (typeof import.meta !== 'undefined') {
    const url = import.meta.env.PUBLIC_LEMONSQUEEZY_CHECKOUT_URL;
    if (typeof url === 'string' && url.length > 0) return url;
  }
  return null;
}

/**
 * Call this on pages that LemonSqueezy redirects back to after checkout.
 * Checks URL for ?premium=true and sets localStorage if found.
 * Returns true if premium was just activated.
 */
export function onPremiumReturn(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('premium') === 'true') {
    setPremium();
    // Clean the URL — remove the query param
    const url = new URL(window.location.href);
    url.searchParams.delete('premium');
    window.history.replaceState({}, '', url.toString());
    return true;
  }
  return false;
}

/** Clear premium status (for testing/debugging). */
export function clearPremium(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREMIUM_KEY);
  localStorage.removeItem(PREMIUM_EXPIRY_KEY);
}
