// src/components/PremiumGate.tsx
// Reusable paywall overlay for premium features.
// Shows children normally for premium users, or with an upgrade overlay for free users.

import { useState, useEffect, type ReactNode } from 'react';
import { isPremium, getPremiumCheckoutUrl } from '@/lib/premium';

interface PremiumGateProps {
  /** Feature name for analytics (e.g. "pdf", "docx", "cookie-banner") */
  feature: string;
  /** Content to show/gate */
  children: ReactNode;
  /** Optional custom label for the CTA button */
  ctaLabel?: string;
  /** Show premium badge instead of overlay */
  badge?: boolean;
}

export function PremiumGate({ feature, children, ctaLabel, badge = false }: PremiumGateProps) {
  const [premium, setPremium] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setPremium(isPremium());
    setMounted(true);
  }, []);

  // Don't render gating UI until client-side hydration
  if (!mounted) {
    return <>{children}</>;
  }

  // Premium users get the real content
  if (premium) {
    return <>{children}</>;
  }

  const checkoutUrl = getPremiumCheckoutUrl();
  const hasCheckout = checkoutUrl !== null;

  // Badge mode: small lock icon badge (used inline on buttons)
  if (badge) {
    return (
      <div className="relative inline-flex">
        {children}
        <span
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black"
          title="Premium"
        >
          ★
        </span>
      </div>
    );
  }

  // Overlay mode: premium callout banner with content at full opacity
  return (
    <>
      <div className="space-y-0">
        {/* Premium callout banner — clickable, opens upgrade modal */}
        <div
          className="flex cursor-pointer items-center gap-2 rounded-t-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs transition-colors hover:bg-amber-500/10"
          onClick={() => setShowModal(true)}
        >
          <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-medium text-amber-600 dark:text-amber-400">Premium Feature</span>
          <span className="ml-auto text-amber-600/70 dark:text-amber-400/70">
            {hasCheckout ? 'Upgrade to copy/paste' : 'Coming soon!'} →
          </span>
        </div>
        {/* Content at full opacity — readable, but not interactive */}
        <div className="pointer-events-none select-none">
          {children}
        </div>
      </div>

      {/* Upgrade modal */}
      {showModal && (
        <PremiumModal
          feature={feature}
          checkoutUrl={checkoutUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/** Standalone hook for components that need premium checks inline (e.g. button clicks). */
export function usePremiumGate() {
  const [premium, setPremium] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPremium(isPremium());
    setMounted(true);
  }, []);

  const checkPremium = (): boolean => {
    if (!mounted) return false;
    const p = isPremium();
    setPremium(p);
    return p;
  };

  return { premium, mounted, checkPremium };
}

function PremiumModal({ feature, checkoutUrl, onClose }: {
  feature: string;
  checkoutUrl: string | null;
  onClose: () => void;
}) {
  const hasCheckout = checkoutUrl !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-bg-elevated p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-fg-muted hover:text-fg transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-fg mb-2">Premium Feature</h3>
          <p className="text-sm text-fg-muted mb-6 max-w-sm mx-auto">
            {feature === 'cookie-banner'
              ? 'The cookie banner code generator is a Premium feature. Generate unlimited embeddable cookie consent banners.'
              : 'Export your policy documents to PDF and DOCX with a one-time Premium purchase.'}
          </p>

          {hasCheckout ? (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-button bg-fg text-bg font-medium text-sm hover:opacity-90 transition-opacity px-8"
            >
              Get Premium — $13.99
            </a>
          ) : (
            <div className="inline-flex h-11 items-center justify-center rounded-button border border-border bg-bg px-8 text-sm text-fg-muted cursor-not-allowed">
              Checkout coming soon!
            </div>
          )}

          <p className="mt-4 text-xs text-fg-faint">
            One-time purchase. No subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
