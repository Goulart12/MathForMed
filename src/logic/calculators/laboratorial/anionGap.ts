/**
 * Anion gap with albumin correction and the delta ratio.
 *
 * @module logic/calculators/laboratorial/anionGap
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertOptionalFinite, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateAnionGap}. */
export interface AnionGapInput {
  /** Serum sodium in mEq/L. */
  sodium: number
  /** Serum chloride in mEq/L. */
  chloride: number
  /** Serum bicarbonate in mEq/L. */
  bicarbonate: number
  /** Serum albumin in g/dL. Optional; when supplied the gap is corrected. */
  albumin?: number | null
}

/** Albumin correction applied per 1 g/dL below the 4 g/dL anchor. */
export const ALBUMIN_CORRECTION_FACTOR = 2.5

/** Albumin reference anchor for the correction, in g/dL. */
export const ALBUMIN_REFERENCE = 4

/** Upper reference bound of the anion gap, in mEq/L. */
export const ANION_GAP_UPPER = 12

/** Bicarbonate at which a high anion gap is fully explained, in mEq/L. */
export const FULL_HCO3 = 24

export const ANION_GAP_REFERENCES: ReferenceRange[] = [
  { label: 'Normal (8–12 mEq/L)', min: 8, max: 12, severity: 'normal' },
  { label: 'Elevated (12–20 mEq/L)', min: 12, max: 20, severity: 'attention' },
  { label: 'Markedly elevated (> 20 mEq/L)', min: 20, severity: 'critical' },
]

/** Interpretation of the delta ratio. */
export interface DeltaRatio {
  /** The ratio, or `null` when it cannot be computed. */
  ratio: number | null
  /** Clinical meaning of the ratio. */
  interpretation: string
  /** Severity of the finding. */
  severity: Severity
}

/**
 * Interprets the delta ratio of a high anion gap.
 *
 * @param gap - The reported (albumin-corrected when applicable) anion gap.
 * @param bicarbonate - Serum bicarbonate in mEq/L.
 *
 * @reference Emmett M, Narins RG. High anion gap metabolic acidosis. Medicine (Baltimore). 1977;56(1):38–54.
 */
export function interpretDeltaRatio(gap: number, bicarbonate: number): DeltaRatio {
  const denominator = FULL_HCO3 - bicarbonate

  if (denominator <= 0) {
    return {
      ratio: null,
      interpretation:
        'Delta ratio not calculable: bicarbonate is at or above 24 mEq/L, so the elevated anion gap reflects a concurrent metabolic alkalosis rather than acidosis.',
      severity: 'attention',
    }
  }

  const ratio = round((gap - ANION_GAP_UPPER) / denominator, 2)

  if (ratio < 0.4) {
    return {
      ratio,
      interpretation:
        'Normal anion gap with a hyperchloraemic metabolic acidosis.',
      severity: 'attention',
    }
  }
  if (ratio < 0.8) {
    return {
      ratio,
      interpretation: 'Mixed disorder: high anion gap acidosis plus a normal anion gap acidosis.',
      severity: 'attention',
    }
  }
  if (ratio <= 2) {
    return {
      ratio,
      interpretation: 'Pure elevated anion gap metabolic acidosis.',
      severity: 'attention',
    }
  }
  return {
    ratio,
    interpretation:
      'Elevated anion gap with a concurrent metabolic alkalosis.',
    severity: 'attention',
  }
}

/**
 * Calculates the anion gap, correcting for hypoalbuminaemia when supplied.
 *
 * AG            = Na − (Cl + HCO₃)
 * AG_corrected  = AG + 2.5 × (4 − albumin)
 *
 * @param input - Sodium, chloride, bicarbonate and optional albumin.
 * @returns `CalcResult` whose value is the anion gap rounded to one decimal. When
 *   the gap exceeds 12 mEq/L a delta ratio is added as a sub-result.
 * @throws {CalcValidationError} When sodium, chloride, bicarbonate or albumin is
 *   outside its physiological range.
 *
 * @reference Emmett M, Narins RG. High anion gap metabolic acidosis. Medicine (Baltimore). 1977;56(1):38–54.
 *
 * @example
 * calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 16 }).value // 24
 */
export function calculateAnionGap(input: AnionGapInput): CalcResult {
  const { sodium, chloride, bicarbonate, albumin } = input

  assertRange(sodium, 100, 190, 'sodium', 'mEq/L')
  assertRange(chloride, 70, 135, 'chloride', 'mEq/L')
  assertRange(bicarbonate, 3, 45, 'bicarbonate', 'mEq/L')
  assertOptionalFinite(albumin, 'albumin', 'g/dL')
  if (albumin !== null && albumin !== undefined) {
    assertRange(albumin, 1, 6, 'albumin', 'g/dL')
  }

  const gap = sodium - (chloride + bicarbonate)
  const corrected = albumin != null ? gap + ALBUMIN_CORRECTION_FACTOR * (ALBUMIN_REFERENCE - albumin) : gap
  const reported = round(corrected, 1)

  const severity: Severity =
    reported <= ANION_GAP_UPPER ? 'normal' : reported <= 20 ? 'attention' : 'critical'

  const subResults: CalcResult[] = [
    {
      label: 'Measured Anion Gap',
      value: round(gap, 1),
      unit: 'mEq/L',
      severity: 'info',
      interpretation: `${sodium} − (${chloride} + ${bicarbonate}) = ${round(gap, 1)} mEq/L.`,
    },
  ]

  if (albumin != null) {
    subResults.push({
      label: 'Albumin Correction',
      value: round(corrected - gap, 1),
      unit: 'mEq/L',
      severity: 'info',
      interpretation: `2.5 × (4 − ${albumin}) = ${round(corrected - gap, 1)} mEq/L added back for hypoalbuminaemia.`,
    })
  }

  if (reported > ANION_GAP_UPPER) {
    const delta = interpretDeltaRatio(reported, bicarbonate)
    subResults.push({
      label: 'Delta Ratio',
      value: delta.ratio ?? 'not calculable',
      severity: delta.severity,
      interpretation: delta.interpretation,
    })
  }

  return {
    label: 'Anion Gap',
    value: reported,
    unit: 'mEq/L',
    severity,
    interpretation: `Anion gap ${reported} mEq/L${
      albumin != null ? ' (albumin-corrected)' : ''
    } — reference 8 to 12 mEq/L. ${
      reported > ANION_GAP_UPPER
        ? 'An elevated anion gap indicates unmeasured anions; consider ketoacidosis, lactate, keto acids, toxins or renal failure.'
        : 'The anion gap is within the reference interval.'
    }`,
    references: ANION_GAP_REFERENCES,
    subResults,
  }
}