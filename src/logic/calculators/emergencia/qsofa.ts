/**
 * qSOFA — quick sepsis criteria for infection outside the ICU.
 *
 * @module logic/calculators/emergencia/qsofa
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'

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
  { label: 'Low risk (0–1)', max: 1, severity: 'normal' },
  { label: 'High risk (≥ 2)', min: 2, max: 3, severity: 'critical' },
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

  assertRange(respiratoryRate, 4, 60, 'respiratoryRate', 'breaths/min')
  assertRange(sysBp, 40, 300, 'sysBp', 'mmHg')

  const criteria = [
    {
      label: `Respiratory rate ≥ ${QSOFA_RR_THRESHOLD}/min`,
      present: respiratoryRate >= QSOFA_RR_THRESHOLD,
      detail: `${respiratoryRate} breaths/min`,
    },
    {
      label: 'Altered mentation (GCS < 15)',
      present: alteredMentation,
      detail: alteredMentation ? 'Mentally altered' : 'Normal mentation',
    },
    {
      label: `Systolic BP ≤ ${QSOFA_SBP_THRESHOLD} mmHg`,
      present: sysBp <= QSOFA_SBP_THRESHOLD,
      detail: `${sysBp} mmHg`,
    },
  ]

  const score = criteria.filter(criterion => criterion.present).length
  const critical = score >= 2

  return {
    label: 'qSOFA Score',
    value: score,
    unit: 'points',
    severity: critical ? 'critical' : 'normal',
    interpretation: critical
      ? `qSOFA ${score}: consider sepsis evaluation and escalation of care. A score of 2 or more identifies suspected infection with organ dysfunction and predicts worse outcome.`
      : `qSOFA ${score} — no qSOFA criterion for high risk. A low score does not exclude sepsis; qSOFA is a prompt to escalate, not a rule-out test.`,
    references: QSOFA_REFERENCES,
    subResults: criteria.map(criterion => ({
      label: criterion.label,
      value: criterion.present ? 1 : 0,
      unit: 'points',
      severity: 'info' as const,
      interpretation: criterion.detail,
    })),
  }
}