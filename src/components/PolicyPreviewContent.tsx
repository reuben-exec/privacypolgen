// src/components/PolicyPreviewContent.tsx
// Shared preview content used by both desktop sticky panel and mobile bottom sheet in Wizard.tsx
import { useI18n } from '@/lib/I18nProvider'
import { dataTypeLabel } from '@/lib/generator'

type SectionProgressItem = {
  id: string
  label: string
  state: 'complete' | 'pending' | 'locked'
}

type PolicyPreviewContentProps = {
  answers: {
    businessName: string
    websiteUrl: string
    businessType: string
    jurisdiction: string
    dataTypes: string[]
  }
  step: number
  highlightedTypes: Set<string>
  listFormatter: Intl.ListFormat
  sectionProgress: SectionProgressItem[]
  /** When true, data types render as inline sentence (desktop). When false, as label-value pair (mobile). */
  dataTypesInline?: boolean
}

export default function PolicyPreviewContent({
  answers,
  step,
  highlightedTypes,
  listFormatter,
  sectionProgress,
  dataTypesInline = false,
}: PolicyPreviewContentProps) {
  const { t } = useI18n()

  return (
    <>
      {/* Business summary — always shows all 4 fields with placeholders */}
      <dl className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-fg-muted">{t('wizard.preview.business')}</dt>
          <dd className="text-right font-medium text-fg">
            {answers.businessName || <span className="italic text-fg-muted/50">{t('wizard.preview.placeholders.business')}</span>}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-fg-muted">{t('wizard.preview.website')}</dt>
          <dd className="min-w-0 text-right font-mono text-xs text-fg truncate">
            {answers.websiteUrl || <span className="italic text-fg-muted/50">{t('wizard.preview.placeholders.website')}</span>}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-fg-muted">{t('wizard.preview.businessType')}</dt>
          <dd className="text-right text-fg">
            {answers.businessType ? t('wizard.businessTypes.' + answers.businessType + '.name') : <span className="italic text-fg-muted/50">{t('wizard.preview.placeholders.type')}</span>}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-fg-muted">{t('wizard.preview.jurisdiction')}</dt>
          <dd className="text-right text-fg">
            {answers.jurisdiction ? t('wizard.jurisdictions.' + answers.jurisdiction) : <span className="italic text-fg-muted/50">{t('wizard.preview.placeholders.jurisdiction')}</span>}
          </dd>
        </div>
        {/* Data types row */}
        {answers.dataTypes.length > 0 && (
          <>
            <hr className="border-border" />
            {dataTypesInline ? (
              <div className="pt-1.5 text-xs leading-relaxed text-fg">
                {t('wizard.preview.collectPrefix')}
                {(() => {
                  const labels = answers.dataTypes.map(id => dataTypeLabel(id))
                  const parts = listFormatter.formatToParts(labels)
                  let idx = 0
                  return parts.map((part, i) => {
                    if (part.type === 'element') {
                      const id = answers.dataTypes[idx]
                      const isHL = highlightedTypes.has(id)
                      idx++
                      return <span key={id} className={isHL ? 'animate-pulse font-medium text-accent' : ''}>{part.value}</span>
                    }
                    return <span key={`sep-${i}`}>{part.value}</span>
                  })
                })()}{' '}
                {t('wizard.preview.collectSuffix')}
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 pt-1">
                <dt className="shrink-0 text-fg-muted">{t('wizard.preview.dataCollected')}</dt>
                <dd className="text-right text-xs leading-relaxed text-fg">
                  {(() => {
                    const labels = answers.dataTypes.map(id => dataTypeLabel(id))
                    const parts = listFormatter.formatToParts(labels)
                    let idx = 0
                    return parts.map((part, i) => {
                      if (part.type === 'element') {
                        const id = answers.dataTypes[idx]
                        const isHL = highlightedTypes.has(id)
                        idx++
                        return <span key={id} className={isHL ? 'animate-pulse font-medium text-accent' : ''}>{part.value}</span>
                      }
                      return <span key={`sep-${i}`}>{part.value}</span>
                    })
                  })()}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>

      {/* Sections progress */}
      {step >= 2 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted/60">{t('wizard.preview.sectionsGenerated')}</p>
          <ul className="space-y-1">
            {sectionProgress.map(s => (
              <li key={s.id} className={`flex items-center gap-2 text-xs ${s.state === 'locked' ? 'opacity-40' : ''}`}>
                <span className="w-4 shrink-0 text-center">
                  {s.state === 'complete' ? (
                    <span className="text-green-500">{'\u2705'}</span>
                  ) : s.state === 'pending' ? (
                    <span className="text-fg-muted/40">{'\u23F3'}</span>
                  ) : (
                    <span className="text-fg-muted">{'\uD83D\uDD12'}</span>
                  )}
                </span>
                <span className={
                  s.state === 'complete' ? 'text-fg'
                  : s.state === 'pending' ? 'text-fg-muted'
                  : 'text-fg-muted'
                }>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
