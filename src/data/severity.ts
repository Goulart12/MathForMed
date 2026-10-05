import type { Severity } from '@/types/logic'

export interface SeverityTone {
  /** Badge text — the spec'd uppercase vocabulary. */
  label: string
  /** Pill background. */
  bg: string
  /** Pill text + icon colour (all ≥ 4.5:1 on `bg`). */
  text: string
  /** Solid dot, used where a label will not fit. */
  dot: string
  /** Same hue as `dot` but as a foreground colour, for a dot-only badge. */
  dotText: string
  /** Solid hairline for the left edge of a critical result. */
  edge: string
}

/**
 * One place that decides how a severity reads, so `ResultCard`, `HistoryEntry`
 * cards and any future surface can never drift apart.
 *
 * `bg`/`text` pairs are the WCAG-AA-safe combinations: the brand severity
 * colours are too light to carry text on their own pale tint, so the `*-text`
 * variants carry the type and the brand colour stays on the dot and the edge.
 */
export const SEVERITY_TONES: Record<Severity, SeverityTone> = {
  normal: {
    label: 'NORMAL',
    bg: 'bg-ok-bg',
    text: 'text-ok-text',
    dot: 'bg-ok',
    dotText: 'text-ok',
    edge: 'border-l-ok',
  },
  attention: {
    label: 'ATENÇÃO',
    bg: 'bg-warn-bg',
    text: 'text-warn-text',
    dot: 'bg-warn',
    dotText: 'text-warn',
    edge: 'border-l-warn',
  },
  critical: {
    label: 'CRÍTICO',
    bg: 'bg-alert-bg',
    text: 'text-alert-text',
    dot: 'bg-alert',
    dotText: 'text-alert',
    edge: 'border-l-alert',
  },
  info: {
    label: 'CÁLCULO',
    bg: 'bg-info-bg',
    text: 'text-info-text',
    dot: 'bg-primary-500',
    dotText: 'text-primary-600',
    edge: 'border-l-primary-500',
  },
}

export function severityTone(severity: Severity): SeverityTone {
  return SEVERITY_TONES[severity] ?? SEVERITY_TONES.info
}

/** Evidence-level chip colours on `CategoryView` list rows. */
export const EVIDENCE_TONES: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-ok-bg text-ok-text',
  B: 'bg-info-bg text-info-text',
  C: 'bg-surface-alt text-ink-secondary',
}
