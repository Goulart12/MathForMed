/**
 * qSOFA — quick sepsis criteria for infection outside the ICU.
 *
 * @module logic/calculators/emergencia/qsofa
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { pluralize } from '../../utils/units'

/** Inputs for {@link calculateQsofa}. */
export interface QsofaInput {
  /** Respiratory rate in breaths per minute. */
  respiratoryRate: number
  /** Altered mentation, conventionally GCS < 15. */
  alteredMentation: boolean
  /** Systolic blood pressure in mmHg. */
  sysBp: number
}

/** Respiratory rate threshold at which qSOFA scores a point. */
export const QSOFA_RR_THRESHOLD = 22
/** Systolic BP threshold (inclusive) at which qSOFA scores a point. */
export const QSOFA_SBP_THRESHOLD = 100

export const QSOFA_REFERENCES: ReferenceRange[] = [
  { label: 'Baixo risco (0–1)', max: 1, severity: 'normal' },
  { label: 'Alto risco (≥ 2)', min: 2, max: 3, severity: 'critical' },
]

/**
 * Calculates the qSOFA score.
 *
 * Respiratory rate ≥ 22/min +1 · altered mentation +1 · systolic BP ≤ 100 mmHg +1
 *
 * @param input - Respiratory rate, mentation and systolic blood pressure.
 * @returns `CalcResult` whose value is the score 0–3, with the criteria present
 *   as sub-results.
 * @throws {CalcValidationError} When the respiratory rate or systolic BP is
 *   outside its physiological range.
 *
 * @reference Seymour CW, Liu VX, Iwashyna TJ, et al. Assessment of clinical criteria for sepsis. JAMA. 2016;315(8):762–774.
 *
 * @example
 * calculateQsofa({ respiratoryRate: 24, alteredMentation: true, sysBp: 88 }).value // 3
 */
export function calculateQsofa(input: QsofaInput): CalcResult {
  const { respiratoryRate, alteredMentation, sysBp } = input

  assertRange(respiratoryRate, 4, 60, 'respiratoryRate', 'respirações/min')
  assertRange(sysBp, 40, 300, 'sysBp', 'mmHg')

  const criteria = [
    {
      label: `Frequência respiratória ≥ ${QSOFA_RR_THRESHOLD}/min`,
      present: respiratoryRate >= QSOFA_RR_THRESHOLD,
      detail: `${respiratoryRate} respirações/min`,
    },
    {
      label: 'Alteração do estado mental (GCS < 15)',
      present: alteredMentation,
      detail: alteredMentation ? 'Consciência alterada' : 'Estado mental normal',
    },
    {
      label: `Pressão sistólica ≤ ${QSOFA_SBP_THRESHOLD} mmHg`,
      present: sysBp <= QSOFA_SBP_THRESHOLD,
      detail: `${sysBp} mmHg`,
    },
  ]

  const score = criteria.filter(criterion => criterion.present).length
  const critical = score >= 2

  return {
    label: 'Escore qSOFA',
    value: score,
    unit: pluralize(score, 'ponto'),
    severity: critical ? 'critical' : 'normal',
    interpretation: critical
      ? `qSOFA ${score}: considere avaliação para sepse e escalonamento do cuidado. Um escore de 2 ou mais identifica infecção suspeita com disfunção orgânica e prevê pior desfecho.`
      : `qSOFA ${score} — nenhum critério qSOFA de alto risco. Um escore baixo não exclui sepse; qSOFA é um alerta para escalonar, não um teste de exclusão.`,
    references: QSOFA_REFERENCES,
    subResults: criteria.map(criterion => {
      const points = criterion.present ? 1 : 0
      return {
        label: criterion.label,
        value: points,
        unit: pluralize(points, 'ponto'),
        severity: 'info' as const,
        interpretation: criterion.detail,
      }
    }),
  }
}