/**
 * Albumin-corrected serum calcium.
 *
 * @module logic/calculators/laboratorial/correcaoCalcio
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateCorrectedCalcium}. */
export interface CorrectedCalciumInput {
  /** Measured total serum calcium in mg/dL. */
  measuredCalciumMgDl: number
  /** Serum albumin in g/dL. */
  albuminGDl: number
}

/** Calcium rises by this many mg/dL per 1 g/dL of albumin below 4 g/dL. */
export const CALCIUM_CORRECTION_FACTOR = 0.8

/** Albumin reference anchor for the correction, in g/dL. */
export const ALBUMIN_REFERENCE = 4

export const CORRECTED_CALCIUM_REFERENCES: ReferenceRange[] = [
  { label: 'Crítico baixo (< 7.5 mg/dL)', max: 7.5, severity: 'critical' },
  { label: 'Baixo (7.5–8.5 mg/dL)', min: 7.5, max: 8.5, severity: 'attention' },
  { label: 'Normal (8.5–10.5 mg/dL)', min: 8.5, max: 10.5, severity: 'normal' },
  { label: 'Alto (10.5–12 mg/dL)', min: 10.5, max: 12, severity: 'attention' },
  { label: 'Crítico alto (> 12 mg/dL)', min: 12, severity: 'critical' },
]

/**
 * Corrects total serum calcium for hypoalbuminaemia.
 *
 * corrected Ca = Ca + 0.8 × (4 − albumin)
 *
 * @param input - Measured total calcium and albumin.
 * @returns `CalcResult` whose value is the corrected calcium rounded to one
 *   decimal.
 * @throws {CalcValidationError} When calcium or albumin is outside its
 *   physiological range.
 *
 * @reference Payne RB, Nosal A, Bishop B, et al. Correction for the influence of albumin on serum calcium. BMJ. 1973;4(5893):643–646.
 *
 * @example
 * calculateCorrectedCalcium({ measuredCalciumMgDl: 8, albuminGDl: 2 }).value // 9.6
 */
export function calculateCorrectedCalcium(input: CorrectedCalciumInput): CalcResult {
  const { measuredCalciumMgDl, albuminGDl } = input

  assertRange(measuredCalciumMgDl, 4, 16, 'measuredCalciumMgDl', 'mg/dL')
  assertRange(albuminGDl, 1, 6, 'albuminGDl', 'g/dL')

  const corrected =
    measuredCalciumMgDl + CALCIUM_CORRECTION_FACTOR * (ALBUMIN_REFERENCE - albuminGDl)
  const rounded = round(corrected, 1)

  const severity =
    rounded < 7.5 || rounded > 12 ? 'critical' : rounded < 8.5 || rounded > 10.5 ? 'attention' : 'normal'
  const classification =
    rounded < 7.5
      ? 'hipocalcemia crítica'
      : rounded > 12
        ? 'hipercalcemia crítica'
        : rounded < 8.5
          ? 'hipocalcemia'
          : rounded > 10.5
            ? 'hipercalcemia'
            : 'cálcio normal'

  return {
    label: 'Cálcio corrigido',
    value: rounded,
    unit: 'mg/dL',
    severity,
    interpretation: `Cálcio corrigido ${rounded} mg/dL — ${classification}, contra uma referência de 8.5 a 10.5 mg/dL. Albumina ${albuminGDl} g/dL exigiu uma correção de ${round(corrected - measuredCalciumMgDl, 1)} mg/dL.`,
    references: CORRECTED_CALCIUM_REFERENCES,
    subResults: [
      {
        label: 'Cálcio medido',
        value: measuredCalciumMgDl,
        unit: 'mg/dL',
        severity: 'info',
        interpretation: `Cálcio total informado pelo laboratório.`,
      },
      {
        label: 'Correção aplicada',
        value: round(corrected - measuredCalciumMgDl, 1),
        unit: 'mg/dL',
        severity: 'info',
        interpretation: `0.8 × (4 − ${albuminGDl}).`,
      },
    ],
  }
}