import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { I18nProvider, useI18n } from '@/lib/I18nProvider'
import { generatePolicy, encodePolicyToHash, decodeHashToPolicy } from '@/lib/generator'
import PolicyPreviewContent from '@/components/PolicyPreviewContent'
type LawId = string

/* ── Data types: each option knows which business types it's relevant to ── */
const DATA_TYPES = [
  { id: 'emails', relevantFor: ['personal-blog', 'saas', 'ecommerce', 'mobile-app', 'portfolio', 'agency'] },
  { id: 'names', relevantFor: ['saas', 'ecommerce', 'agency'] },
  { id: 'addresses', relevantFor: ['ecommerce'] },
  { id: 'phones', relevantFor: ['saas', 'ecommerce', 'agency'] },
  { id: 'companies', relevantFor: ['agency'] },
  { id: 'user-accounts', relevantFor: ['saas', 'mobile-app'] },
  { id: 'payments', relevantFor: ['saas', 'ecommerce'] },
  { id: 'usage-data', relevantFor: ['saas', 'mobile-app'] },
  { id: 'device-info', relevantFor: ['mobile-app'] },
  { id: 'ip-addresses', relevantFor: ['saas', 'ecommerce', 'mobile-app', 'agency'] },
  { id: 'location-data', relevantFor: ['saas', 'ecommerce', 'mobile-app'] },
  { id: 'analytics', relevantFor: ['personal-blog', 'saas', 'ecommerce', 'mobile-app', 'portfolio', 'agency'] },
  { id: 'cookies', relevantFor: ['personal-blog', 'saas', 'ecommerce', 'portfolio', 'agency'] },
  { id: 'ads', relevantFor: ['ecommerce', 'agency'] },
]

type DataTypeId = typeof DATA_TYPES[number]['id']
type BusinessType = 'personal-blog' | 'saas' | 'ecommerce' | 'mobile-app' | 'portfolio' | 'agency'

const DATA_GROUPS: Record<string, DataTypeId[]> = {
  identity: ['emails', 'names', 'addresses', 'phones', 'companies'],
  account:  ['user-accounts'],
  transaction: ['payments'],
  technical: ['usage-data', 'device-info', 'ip-addresses', 'location-data'],
  marketing: ['analytics', 'cookies', 'ads'],
}

const LAW_IDS = ['gdpr', 'ccpa', 'caloppa', 'coppa', 'pipeda', 'lgpd', 'dpdp'] as const

const LAW_DEFAULTS: Record<BusinessType, LawId[]> = {
  'personal-blog': ['gdpr', 'ccpa', 'caloppa'],
  saas:            ['gdpr', 'ccpa', 'caloppa', 'dpdp'],
  ecommerce:       ['gdpr', 'ccpa', 'caloppa', 'coppa', 'dpdp'],
  'mobile-app':    ['gdpr', 'ccpa', 'caloppa', 'coppa'],
  portfolio:       ['gdpr', 'ccpa', 'caloppa'],
  agency:          ['gdpr', 'ccpa', 'caloppa', 'pipeda', 'dpdp'],
}

const SERVICE_DEFAULTS: Record<BusinessType, string[]> = {
  'personal-blog': ['google-analytics', 'mailchimp'],
  saas:            ['google-analytics', 'stripe', 'sendgrid', 'cloudflare', 'aws'],
  ecommerce:       ['google-analytics', 'stripe', 'paypal', 'google-adsense', 'facebook-pixel', 'cloudflare'],
  'mobile-app':    ['mixpanel', 'sendgrid', 'aws'],
  portfolio:       ['plausible', 'cloudflare'],
  agency:          ['google-analytics', 'mailchimp', 'google-adsense', 'facebook-pixel', 'cloudflare'],
}

/* ── Services: id → { category } (names & descriptions from i18n) ── */
const SERVICE_META: Record<string, { category: string }> = {
  'google-analytics': { category: 'analytics' },
  plausible:         { category: 'analytics' },
  mixpanel:          { category: 'analytics' },
  stripe:            { category: 'payments' },
  paypal:            { category: 'payments' },
  lemonsqueezy:      { category: 'payments' },
  mailchimp:         { category: 'emailMarketing' },
  convertkit:        { category: 'emailMarketing' },
  sendgrid:          { category: 'emailMarketing' },
  'google-adsense':  { category: 'advertising' },
  'facebook-pixel':  { category: 'advertising' },
  'google-oauth':    { category: 'authentication' },
  'facebook-login':  { category: 'authentication' },
  'youtube-embeds':  { category: 'media' },
  'vimeo-embeds':    { category: 'media' },
  cloudflare:        { category: 'infrastructure' },
  aws:               { category: 'infrastructure' },
}

const LAW_IDS_ARR: readonly string[] = LAW_IDS

const LAW_DEFAULTS_SET: Record<BusinessType, Set<string>> = Object.fromEntries(
  Object.entries(LAW_DEFAULTS).map(([k, v]) => [k, new Set(v)])
) as Record<BusinessType, Set<string>>

const SERVICE_DEFAULTS_SET: Record<BusinessType, Set<string>> = Object.fromEntries(
  Object.entries(SERVICE_DEFAULTS).map(([k, v]) => [k, new Set(v)])
) as Record<BusinessType, Set<string>>

export type WizardAnswers = {
  businessName: string
  websiteUrl: string
  businessType: BusinessType | ''
  jurisdiction: string
  dataTypes: string[]
  services: string[]
  laws: string[]
  contactEmail: string
  hasDpo: boolean
  dpoEmail: string
}

const emptyAnswers: WizardAnswers = {
  businessName: '',
  websiteUrl: '',
  businessType: '',
  jurisdiction: '',
  dataTypes: [],
  services: [],
  laws: [],
  contactEmail: '',
  hasDpo: false,
  dpoEmail: '',
}

const LABELS_PER_PAGE = 6

function decodeHash(hash: string): WizardAnswers | null {
  // Try the new generator-compatible decoder first
  const fromUrl = decodeHashFromUrl();
  if (fromUrl) return fromUrl;
  
  // Legacy fallback: try plain base64 (backward compat for old links)
  try {
    const json = atob(hash.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed = JSON.parse(json)
    const required = ['businessName', 'websiteUrl', 'contactEmail', 'dataTypes', 'services', 'laws']
    for (const key of required) {
      if (!(key in parsed)) return null
    }
    return { ...emptyAnswers, ...parsed } as WizardAnswers
  } catch {
    return null
  }
}

/* ── Compliance badge display config ── */
const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  gdpr: { label: 'GDPR', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  ccpa: { label: 'CCPA', cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  coppa: { label: 'COPPA', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  lgpd: { label: 'LGPD', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  pipeda: { label: 'PIPEDA', cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  dpdp: { label: 'DPDP', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  appi: { label: 'APPI (Japan)', cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
}

function WizardContent() {
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<WizardAnswers>(emptyAnswers)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [servicePage, setServicePage] = useState(0)
  const [expandedDataDesc, setExpandedDataDesc] = useState<string | null>(null)
  const [expandedServiceDesc, setExpandedServiceDesc] = useState<string | null>(null)
  const [expandedLawDesc, setExpandedLawDesc] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const prevDataTypesRef = useRef<string[]>(answers.dataTypes)
  const [highlightedTypes, setHighlightedTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!window.location.hash) return
    const hash = window.location.hash.slice(1)
    const decoded = decodeHash(hash)
    if (decoded) {
      setAnswers(decoded)
      setStep(5)
    }
  }, [])

  const steps = t('wizard.stepTitles') as unknown as string[]
  const stepTitles: string[] = Array.isArray(steps) ? steps : ['Business', 'Data', 'Services', 'Laws', 'Contact']

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  /* ── Live preview highlight tracking ── */
  useEffect(() => {
    const prev = prevDataTypesRef.current
    const curr = answers.dataTypes
    const newTypes = curr.filter(id => !prev.includes(id))
    if (newTypes.length > 0) {
      setHighlightedTypes(new Set(newTypes))
      const timer = setTimeout(() => setHighlightedTypes(new Set()), 1200)
      prevDataTypesRef.current = curr
      return () => clearTimeout(timer)
    }
    prevDataTypesRef.current = curr
  }, [answers.dataTypes])

  /* ── Jurisdiction → law auto-suggestion ── */
  const EU_COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','UK']

  const JURISDICTION_LAWS: Record<string, string[]> = {
    'IN': ['dpdp'],
    'BR': ['lgpd'],
    'CA': ['pipeda'],
    'US': ['ccpa', 'caloppa', 'coppa'],
    'GB': ['gdpr'],
    'UK': ['gdpr'],
  }

  useEffect(() => {
    if (!answers.jurisdiction) return
    const j = answers.jurisdiction
    const suggestedLaws: string[] = []

    if (EU_COUNTRIES.includes(j)) {
      suggestedLaws.push('gdpr')
    }
    if (JURISDICTION_LAWS[j]) {
      for (const law of JURISDICTION_LAWS[j]) {
        if (!suggestedLaws.includes(law)) suggestedLaws.push(law)
      }
    }

    if (suggestedLaws.length === 0) return

    setAnswers(prev => {
      const current = new Set(prev.laws)
      let changed = false
      for (const law of suggestedLaws) {
        if (!current.has(law)) {
          current.add(law)
          changed = true
        }
      }
      if (changed) {
        return { ...prev, laws: [...current] }
      }
      return prev
    })
  }, [answers.jurisdiction])

  const dataTypesById = useMemo(() => {
    const map = new Map<string, typeof DATA_TYPES[number]>()
    for (const dt of DATA_TYPES) map.set(dt.id, dt)
    return map
  }, [])

  const update = useCallback(<K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value }

      if (key === 'businessType') {
        const type = value as BusinessType
        if (type && LAW_DEFAULTS_SET[type]) {
          next.laws = [...LAW_DEFAULTS_SET[type]]
        }
        if (type && SERVICE_DEFAULTS_SET[type]) {
          next.services = [...SERVICE_DEFAULTS_SET[type]]
        }
        if (type) {
          const relevant = DATA_TYPES
            .filter(dt => dt.relevantFor.includes(type))
            .map(dt => dt.id)
          next.dataTypes = relevant
        }
      }

      return next
    })
  }, [])

  const toggleInArray = useCallback((key: 'dataTypes' | 'services' | 'laws', value: string) => {
    setAnswers(prev => {
      const arr = prev[key] as string[]
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return { ...prev, [key]: next }
    })
  }, [])

  const requiredFieldsValid = useMemo(() => {
    if (!answers.businessName.trim() || !answers.websiteUrl.trim() || !answers.contactEmail.trim()) return false
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRe.test(answers.contactEmail.trim())
  }, [answers.businessName, answers.websiteUrl, answers.contactEmail])

  const generate = useCallback(() => {
    const policy = generatePolicy({
      businessName: answers.businessName.trim() || 'Our Company',
      websiteUrl: answers.websiteUrl.trim(),
      contactEmail: answers.contactEmail.trim() || '[contact email]',
      jurisdiction: answers.jurisdiction,
      dataCollected: answers.dataTypes,
      serviceIds: answers.services,
      lawIds: answers.laws as LawId[],
      hasDpo: answers.hasDpo,
      dpoEmail: answers.hasDpo && answers.dpoEmail.trim() ? answers.dpoEmail.trim() : undefined,
      businessType: answers.businessType || '',
      tone: 'professional',
    })

    const hash = encodePolicyToHash({
      businessName: answers.businessName.trim() || 'Our Company',
      websiteUrl: answers.websiteUrl.trim(),
      contactEmail: answers.contactEmail.trim() || '[contact email]',
      jurisdiction: answers.jurisdiction,
      dataCollected: answers.dataTypes,
      serviceIds: answers.services,
      lawIds: answers.laws as LawId[],
      hasDpo: answers.hasDpo,
      dpoEmail: answers.hasDpo && answers.dpoEmail.trim() ? answers.dpoEmail.trim() : undefined,
      businessType: answers.businessType || '',
      tone: 'professional',
    })
    const url = `/p?h=${hash}`
    setGeneratedUrl(url)
    setStep(6)
  }, [answers])

  const showResult = step === 6 && generatedUrl



  const [copiedLink, setCopiedLink] = useState(false)

  const copyToClipboard = useCallback(async (text: string, setCopied?: (v: boolean) => void) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied?.(true)
      setTimeout(() => setCopied?.(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }, [])

  const copyLink = useCallback(() => {
    if (generatedUrl) {
      const absoluteUrl = `${window.location.origin}${generatedUrl}`
      copyToClipboard(absoluteUrl, setCopiedLink)
    }
  }, [generatedUrl, copyToClipboard])

  /* Group data types */
  const groupedDataTypes = useMemo(() => {
    return Object.entries(DATA_GROUPS).map(([groupKey, ids]) => ({
      groupKey,
      groupLabel: t(`wizard.dataGroups.${groupKey}`) as string,
      items: ids.map(id => {
        const dt = dataTypesById.get(id)
        return {
          id,
          label: t(`wizard.dataTypes.${id}`) as string,
          group: groupKey,
          relevantFor: dt?.relevantFor ?? [],
        }
      }),
    }))
  }, [dataTypesById, t])

  /* Group services by category */
  const serviceGroups = useMemo(() => {
    const groups: Record<string, { id: string; name: string; description: string; category: string }[]> = {}
    for (const [id, meta] of Object.entries(SERVICE_META)) {
      if (!groups[meta.category]) groups[meta.category] = []
      groups[meta.category].push({
        id,
        name: t(`wizard.services.${id}.name`) as string,
        description: t(`wizard.services.${id}.description`) as string,
        category: meta.category,
      })
    }
    return groups
  }, [t])

  const groupedServiceEntries = useMemo(() => Object.entries(serviceGroups), [serviceGroups])
  const totalServicePages = groupedServiceEntries.length
  const [currentServiceGroupIndex, setCurrentServiceGroupIndex] = useState(0)

  const { currentGroup, currentGroupKey } = useMemo(() => {
    if (groupedServiceEntries.length === 0) return { currentGroup: [], currentGroupKey: '' }
    const idx = Math.min(currentServiceGroupIndex, groupedServiceEntries.length - 1)
    const [key, items] = groupedServiceEntries[idx]
    return { currentGroup: items, currentGroupKey: key }
  }, [groupedServiceEntries, currentServiceGroupIndex])

  const currentServicePageIds = useMemo(() => currentGroup.map(s => s.id), [currentGroup])

  const allCurrentPageSelected = currentServicePageIds.length > 0 && currentServicePageIds.every(id => answers.services.includes(id))
  const someCurrentPageSelected = currentServicePageIds.some(id => answers.services.includes(id)) && !allCurrentPageSelected

  const toggleAllCurrentPageServices = useCallback(() => {
    if (allCurrentPageSelected) {
      setAnswers(prev => ({
        ...prev,
        services: prev.services.filter(id => !currentServicePageIds.includes(id)),
      }))
    } else {
      setAnswers(prev => ({
        ...prev,
        services: [...new Set([...prev.services, ...currentServicePageIds])],
      }))
    }
  }, [allCurrentPageSelected, currentServicePageIds, setAnswers])

  const toggleDataDesc = useCallback((id: string) => {
    setExpandedDataDesc(prev => prev === id ? null : id)
  }, [])

  const toggleServiceDesc = useCallback((id: string) => {
    setExpandedServiceDesc(prev => prev === id ? null : id)
  }, [])

  const toggleLawDesc = useCallback((id: string) => {
    setExpandedLawDesc(prev => prev === id ? null : id)
  }, [])

  const jurisdictionOptions: { value: string; label: string }[] = useMemo(() => {
    const codes = ['us', 'ca', 'gb', 'de', 'fr', 'es', 'it', 'nl', 'se', 'no', 'dk', 'ie', 'au', 'nz', 'br', 'sg', 'jp', 'in', 'mx', 'global'] as const
    return codes.map(code => ({
      value: code === 'global' ? '' : code,
      label: t(`wizard.jurisdictions.${code}`) as string,
    }))
  }, [t])

  const dataDescMap: Record<string, string> = useMemo(() => ({
    emails: 'Email is the minimum needed for account creation and transactional notifications.',
    names: 'Used for personalization, receipts, and support. We only collect first/last name — no titles or suffixes.',
    addresses: 'Required only for physical goods shipping or invoicing. Not collected for digital-only products.',
    phones: 'Only collected if you offer phone support or SMS notifications. Never used for marketing.',
    companies: 'B2B context only — helps us address your organization correctly in communications.',
    'user-accounts': 'Passwords are hashed with bcrypt. We never store plain-text credentials.',
    'usage-data': 'Includes feature usage, session duration, and error logs. Used to improve the product.',
    'device-info': 'Browser, OS, and screen size for responsive design and debugging. Not linked to your identity.',
    'ip-addresses': 'Logged for security (rate limiting, fraud detection). Masked after 30 days.',
    'location-data': 'Approximate location (country/city) derived from IP. Never precise GPS tracking.',
    analytics: 'Aggregated, anonymized data about page views, referral sources, and user flows.',
    cookies: 'Essential cookies for auth; optional cookies for analytics and preferences (with consent).',
    ads: 'Advertising IDs and conversion events shared with ad platforms for campaign measurement.',
  }), [])

  /* ── Compliance badges: laws whose conditions are met ── */
  const activeBadges = useMemo<string[]>(() => {
    const ids: string[] = []
    const laws = answers.laws
    const jurisdiction = answers.jurisdiction
    if (laws.includes('gdpr') || jurisdiction === 'eu') ids.push('gdpr')
    if (laws.includes('ccpa') || jurisdiction === 'us') ids.push('ccpa')
    if (laws.includes('coppa')) ids.push('coppa')
    if (laws.includes('lgpd')) ids.push('lgpd')
    if (laws.includes('pipeda')) ids.push('pipeda')
    if (laws.includes('dpdp')) ids.push('dpdp')
    if (laws.includes('appi') || jurisdiction === 'jp') ids.push('appi')
    return ids
  }, [answers.laws, answers.jurisdiction])

  /* ── All compliance badges (all shown; inactive ones grayscale) ── */
  const allBadges = useMemo(() => {
    const active = new Set(activeBadges)
    return Object.entries(BADGE_CONFIG).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      cls: cfg.cls,
      active: active.has(id)
    }))
  }, [activeBadges])

  /* ── Intl.ListFormat for natural-language data-type lists ── */
  const listFormatter = useMemo(() => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }), [])

  /* ── Section progress: 10 compliance sections ── */
  const sectionProgress = useMemo<{ id: string; label: string; state: 'complete' | 'pending' | 'locked' }[]>(() => {
    const personalInfoIds = ['emails', 'names', 'addresses', 'phones', 'companies', 'user-accounts', 'payments']
    const sections = [
      { id: 'intro', minStep: 1, condition: () => true },
      { id: 'dataCollection', minStep: 1, condition: () => answers.dataTypes.length > 0 },
      { id: 'personalInfo', minStep: 2, condition: () => answers.dataTypes.some(d => personalInfoIds.includes(d)) },
      { id: 'dataUsage', minStep: 1, condition: () => answers.dataTypes.length > 0 },
      { id: 'cookies', minStep: 1, condition: () => answers.dataTypes.some(d => d === 'cookies' || d === 'analytics' || d === 'ads') },
      { id: 'thirdParty', minStep: 3, condition: () => answers.services.length > 0 },
      { id: 'yourRights', minStep: 4, condition: () => answers.laws.length > 0 },
      { id: 'children', minStep: 4, condition: () => answers.laws.includes('coppa') },
      { id: 'dataSecurity', minStep: 1, condition: () => answers.dataTypes.length > 0 },
      { id: 'contact', minStep: 5, condition: () => answers.contactEmail !== '' || answers.hasDpo },
    ]
    return sections.map(s => ({
      id: s.id,
      label: t(`wizard.preview.sections.${s.id}`) as string,
      state: step >= s.minStep && s.condition() ? 'complete' as const
        : step >= s.minStep ? 'pending' as const
        : 'locked' as const,
    }))
  }, [answers, step, t])

  return (
    <div ref={topRef} className="mx-auto w-full scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Left column: wizard steps */}
        <div className="min-w-0 space-y-8">
          <div className="text-sm font-medium text-fg-muted">{stepTitles[step - 1]}</div>

          {/* Step 1: Business */}
          {step === 1 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.step1.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('wizard.step1.subtitle')}</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="wizard-business-name" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step1.labelBusinessName')}</label>
                  <input id="wizard-business-name" type="text" value={answers.businessName} onChange={e => update('businessName', e.target.value)} placeholder={t('wizard.step1.placeholderBusinessName') as string}
                    className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                </div>
                <div>
                  <label htmlFor="wizard-website-url" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step1.labelWebsiteUrl')}</label>
                  <input id="wizard-website-url" type="url" value={answers.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} placeholder={t('wizard.step1.placeholderWebsiteUrl') as string}
                    className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                </div>
                <div>
                  <label htmlFor="wizard-business-type" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step1.labelBusinessType')}</label>
                  <select id="wizard-business-type" value={answers.businessType} onChange={e => update('businessType', e.target.value as BusinessType)}
                    className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20">
                    <option value="">—</option>
                    {(['personal-blog', 'saas', 'ecommerce', 'mobile-app', 'portfolio', 'agency'] as BusinessType[]).map(type => (
                      <option key={type} value={type}>{t(`wizard.businessTypes.${type}.name`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="wizard-jurisdiction" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step1.labelJurisdiction')}</label>
                  <select id="wizard-jurisdiction" value={answers.jurisdiction} onChange={e => update('jurisdiction', e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20">
                    {jurisdictionOptions.map(opt => (
                      <option key={opt.value || '__default'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Data types */}
          {step === 2 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.step2.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('wizard.step2.subtitle')}</p>

              <div className="mt-6 space-y-8">
                {groupedDataTypes.map(({ groupKey, groupLabel, items }) => (
                  <fieldset key={groupKey} className="space-y-3">
                    <legend className="text-xs font-semibold uppercase tracking-wider text-fg-muted/80">{groupLabel}</legend>
                    {items.map(item => {
                      const checked = answers.dataTypes.includes(item.id)
                      const expanded = expandedDataDesc === item.id
                      return (
                        <div key={item.id} className="flex flex-col rounded-lg border border-border bg-bg p-3.5 transition-colors hover:border-fg-muted/20">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={checked} onChange={() => toggleInArray('dataTypes', item.id)} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium leading-tight text-fg">{item.label}</div>
                            </div>
                            <button type="button" onClick={() => toggleDataDesc(item.id)}
                              className="mt-0.5 shrink-0 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
                              aria-label={expanded ? 'Hide description' : 'Show description'}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                          </label>
                          {expanded && (
                            <div className="mt-2 border-l-2 border-accent/40 pl-6 text-xs leading-relaxed text-fg-muted">
                              {dataDescMap[item.id] ?? ''}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </fieldset>
                ))}
              </div>
            </section>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.step3.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('wizard.step3.subtitle')}</p>

              <div className="mt-6 space-y-3">
                {/* Category header + select all */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted/80">{t(`wizard.serviceCategories.${currentGroupKey}`)}</h3>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-fg-muted">{currentServiceGroupIndex + 1}/{totalServicePages}</span>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                    <input type="checkbox"
                      className="h-3.5 w-3.5 accent-accent"
                      checked={allCurrentPageSelected}
                      ref={el => { if (el) el.indeterminate = someCurrentPageSelected }}
                      onChange={toggleAllCurrentPageServices}
                    />
                    {t('selectall')}
                  </label>
                </div>

                {/* Service cards */}
                {currentGroup.map(service => {
                  const checked = answers.services.includes(service.id)
                  const expanded = expandedServiceDesc === service.id
                  return (
                    <div key={service.id} className="flex flex-col rounded-lg border border-border bg-bg p-3.5 transition-colors hover:border-fg-muted/20">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={checked} onChange={() => toggleInArray('services', service.id)} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-tight text-fg">{service.name}</div>
                        </div>
                        <button type="button" onClick={() => toggleServiceDesc(service.id)}
                          className="mt-0.5 shrink-0 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
                          aria-label={expanded ? 'Hide description' : 'Show description'}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      </label>
                      {expanded && (
                        <div className="mt-2 border-l-2 border-accent/40 pl-6 text-xs leading-relaxed text-fg-muted">
                          {service.description}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Pagination */}
                {totalServicePages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setCurrentServiceGroupIndex(i => Math.max(0, i - 1))} disabled={currentServiceGroupIndex === 0}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M15 18l-6-6 6-6" /></svg>
                      {t('prev')}
                    </button>
                    <button type="button" onClick={() => setCurrentServiceGroupIndex(i => Math.min(totalServicePages - 1, i + 1))} disabled={currentServiceGroupIndex >= totalServicePages - 1}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40">
                      {t('next')}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step 4: Laws */}
          {step === 4 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.step4.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('wizard.step4.subtitle')}</p>

              <div className="mt-6 space-y-3">
                {LAW_IDS_ARR.map(lawId => {
                  const checked = answers.laws.includes(lawId)
                  const expanded = expandedLawDesc === lawId
                  const lawName = t(`wizard.laws.${lawId}.name`) as string
                  const lawFullName = t(`wizard.laws.${lawId}.fullName`) as string
                  const lawRegion = t(`wizard.laws.${lawId}.region`) as string
                  const lawDescription = t(`wizard.laws.${lawId}.description`) as string
                  return (
                    <div key={lawId} className="flex flex-col rounded-lg border border-border bg-bg p-3.5 transition-colors hover:border-fg-muted/20">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={checked} onChange={() => toggleInArray('laws', lawId)} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-tight text-fg">{lawName}</div>
                          <div className="mt-0.5 text-xs text-fg-muted/70">{lawFullName} · {lawRegion}</div>
                        </div>
                        <button type="button" onClick={() => toggleLawDesc(lawId)}
                          className="mt-0.5 shrink-0 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
                          aria-label={expanded ? 'Hide description' : 'Show description'}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      </label>
                      {expanded && (
                        <div className="mt-2 border-l-2 border-accent/40 pl-6 text-xs leading-relaxed text-fg-muted">
                          {lawDescription}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.step5.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('wizard.step5.subtitle')}</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="wizard-email" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step5.labelEmail')}</label>
                  <input id="wizard-email" type="email" value={answers.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder={t('wizard.step5.placeholderEmail') as string}
                    className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                  {showValidation && !answers.contactEmail.trim() && (
                    <p className="mt-1.5 text-xs text-red-500">{t('validation.contactEmail')}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center gap-3">
                    <input type="checkbox" className="peer sr-only" checked={answers.hasDpo} onChange={e => update('hasDpo', e.target.checked)} />
                    <div className="h-5 w-9 rounded-full bg-fg-muted/25 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full"></div>
                    <span className="text-sm text-fg">{t('wizard.step5.labelDpo')}</span>
                  </label>
                </div>
                {answers.hasDpo && (
                  <div>
                    <label htmlFor="wizard-dpo-email" className="mb-1.5 block text-sm font-medium text-fg">{t('wizard.step5.labelDpoEmail')}</label>
                    <input id="wizard-dpo-email" type="email" value={answers.dpoEmail} onChange={e => update('dpoEmail', e.target.value)} placeholder={t('wizard.step5.placeholderDpoEmail') as string}
                      className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Navigation */}
          {!showResult && (
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => { setStep(s => Math.max(1, s - 1)); setShowValidation(false) }} disabled={step <= 1}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                {t('wizard.nav.back')}
              </button>
              {step < 5 ? (
                <button type="button" onClick={() => setStep(s => Math.min(5, s + 1))}
                  className="inline-flex items-center gap-2 rounded-lg bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:opacity-90">
                  {t('wizard.nav.continue')}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <button type="button" onClick={() => { setShowValidation(true); if (requiredFieldsValid) generate() }}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:opacity-90">
                  {t('wizard.nav.generate')}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          )}

          {/* Validation message */}
          {showValidation && !requiredFieldsValid && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-fg-muted/30 bg-surface/50 px-4 py-3 text-sm text-fg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              {t('validation.required')}
            </div>
          )}

          {/* Result */}
          {showResult && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-fg">{t('wizard.result.heading')}</h2>
                <p className="mt-1 text-sm text-fg-muted">{t('wizard.result.subtitle')}</p>
              </div>

              {/* Disclaimer banner */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-xs leading-relaxed text-fg-muted">
                    <span className="font-semibold text-fg">Not legal advice.</span>{' '}
                    This policy is a starting template, not a substitute for professional legal counsel.
                    Consult a qualified attorney to review it for your specific situation.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">{t('wizard.result.publicLink')}</label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-fg-muted truncate" title={`${typeof window !== "undefined" ? window.location.origin : ""}${generatedUrl}`}>
                    {`${typeof window !== "undefined" ? window.location.origin : ""}${generatedUrl}`}
                  </div>
                  <button type="button" onClick={copyLink}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      {copiedLink
                        ? <polyline points="20 6 9 17 4 12" />
                        : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
                      }
                    </svg>
                    {copiedLink ? t('copied') : t('copy')}
                  </button>
                  <a href={generatedUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-fg px-3 py-2 text-xs font-medium text-bg transition-colors hover:opacity-90"
                    title={t('wizard.result.openTab') as string}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep(1); setGeneratedUrl(''); setShowValidation(false) }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface">
                  {t('wizard.result.editAnswers')}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Right column: preview (sticky) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-fg">{t('wizard.preview.livePreview')}</span>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{stepTitles[step - 1]}</span>
              </div>
            </div>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-1.5">
              {allBadges.map(({ id, label, cls, active }) => (
                <span key={id} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls} ${!active ? 'opacity-30 grayscale' : ''}`}>
                  {label}
                </span>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm ring-1 ring-fg/5">
              <div className="flex items-center gap-1.5 border-b border-border bg-surface px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-fg-muted/20"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-fg-muted/20"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-fg-muted/20"></div>
                <span className="ml-2 truncate font-mono text-[10px] text-fg-muted/60">{answers.websiteUrl || 'acme.example'}/privacy</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                <PolicyPreviewContent
                  answers={answers}
                  step={step}
                  highlightedTypes={highlightedTypes}
                  listFormatter={listFormatter}
                  sectionProgress={sectionProgress}
                  dataTypesInline
                />
              </div>
            </div>
            <button type="button" onClick={() => setShowMobilePreview(v => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {t('preview')}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile preview toggle */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-overlay flex items-end bg-black/40 p-4 backdrop-blur-sm lg:hidden" onClick={() => setShowMobilePreview(false)}>
          <div className="w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-bg p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">{t('wizard.preview.livePreview')}</span>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{stepTitles[step - 1]}</span>
              <button type="button" onClick={() => setShowMobilePreview(false)} className="rounded-lg p-1.5 text-fg-muted hover:bg-surface">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <PolicyPreviewContent
                answers={answers}
                step={step}
                highlightedTypes={highlightedTypes}
                listFormatter={listFormatter}
                sectionProgress={sectionProgress}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Wizard() {
  return (
    <I18nProvider>
      <WizardContent />
    </I18nProvider>
  )
}

function decodeHashFromUrl(): WizardAnswers | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const h = params.get('h') || window.location.hash.slice(1);
    if (!h) return null;
    const decoded = decodeHashToPolicy(h);
    if (!decoded) return null;
    // Map PolicyInput back to WizardAnswers format
    return {
      businessName: decoded.businessName || '',
      websiteUrl: decoded.websiteUrl || '',
      businessType: decoded.businessType || '',
      jurisdiction: decoded.jurisdiction || '',
      dataTypes: decoded.dataCollected || [],
      services: decoded.serviceIds || [],
      laws: decoded.lawIds || [],
      contactEmail: decoded.contactEmail || '',
      hasDpo: decoded.hasDpo || false,
      dpoEmail: decoded.dpoEmail || '',
    } as WizardAnswers;
  } catch {
    return null;
  }
}
