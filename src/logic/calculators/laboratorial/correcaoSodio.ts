/**
 * Glucose-corrected serum sodium.
 *
 * @module logic/calculators/laboratorial/correcaoSodio
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateCorrectedSodium}. */
export interface CorrectedSodiumInput {
  /** Measured serum sodium in mEq/L. */
  measuredSodiumMeqL: number
  /** Serum glucose in mg/dL. */
  glucoseMgDl: number
}

/** Sodium rises by this many mEq/L per 100 mg/dL of glucose above 100. */
export const SODIUM_CORRECTION_FACTOR = 1.6

/** Glucose at which no correction is applied, in mg/dL. */
export const GLUCOSE_REFERENCE = 100

export const CORRECTED_SODIUM_REFERENCES: ReferenceRange[] = [
  { label: 'Hyponatraemia (< 135 mEq/L)', max: 135, severity: 'attention' },
  { label: 'Normal (135–145 mEq/L)', min: 135, max: 145, severity: 'normal' },
  { label: 'Hypernatraemia (> 145 mEq/L)', min: 145, severity: 'critical' },
]

/**
 * Corrects serum sodium for the dilutional effect of hyperglycaemia.
 *
 * corrected Na = Na + 1.6 × ((glucose − 100) / 100)
 *
 * @param input - Measured sodium and glucose.
 * @returns `CalcResult` whose value is the corrected sodium rounded to one
 *   decimal.
 * @throws {CalcValidationError} When sodium or glucose is outside its
 *   physiological range.
 *
 * @reference Katz MA. Hyperglycaemia-induced hyponatraemia. N Engl J Med. 1973;289(16):843–844.
 *
 * @example
 * calculateCorrectedSodium({ measuredSodiumMeqL: 129, glucoseMgDl: 300 }).value // 134
 */
export function calculateCorrectedSodium(input: CorrectedSodiumInput): CalcResult {
  const { measuredSodiumMeqL, glucoseMgDl } = input

  assertRange(measuredSodiumMeqL, 100, 190, 'measuredSodiumMeqL', 'mEq/L')
  assertRange(glucoseMgDl, 20, 1000, 'glucoseMgDl', 'mg/dL')

  const corrected =
    measuredSodiumMeqL + SODIUM_CORRECTION_FACTOR * ((glucoseMgDl - GLUCOSE_REFERENCE) / 100)
  const rounded = round(corrected, 1)

  const severity = rounded < 135 ? 'attention' : rounded > 145 ? 'critical' : 'normal'
  const classification =
    rounded < 135 ? 'Hyponatraemia' : rounded > 145 ? 'Hypernatraemia' : 'Normal sodium'

  return {
    label: 'Corrected Sodium',
    value: rounded,
    unit: 'mEq/L',
    severity,
    interpretation: `Corrected sodium ${rounded} mEq/L — ${classification}, against a reference of 135 to 145 mEq/L. The measured value of ${measuredSodiumMeqL} mEq/L is diluted by hyperglycaemia; the correction adds ${round(SODIUM_CORRECTION_FACTOR * ((glucoseMgDl - GLUCOSE_REFERENCE) / 100), 1)} mEq/L.`,
    references: CORRECTED_SODIUM_REFERENCES,
    subResults: [
      {
        label: 'Measured Sodium',
        value: measuredSodiumMeqL,
        unit: 'mEq/L',
        severity: 'info',
        interpretation: `Sodium reported by the laboratory at a glucose of ${glucoseMgDl} mg/dL.`,
      },
      {
        label: 'Correction Applied',
        value: round(corrected - measuredSodiumMeqL, 1),
        unit: 'mEq/L',
        severity: 'info',
        interpretation: `1.6 × ((${glucoseMgDl} − 100) ÷ 100).`,
      },
    ],
  }
}