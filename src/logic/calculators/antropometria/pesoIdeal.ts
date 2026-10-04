/**
 * Ideal Body Weight (Devine) and Adjusted Body Weight.
 *
 * @module logic/calculators/antropometria/pesoIdeal
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'
import type { Sex } from '../../types'

/** Inputs for {@link calculateIdealBodyWeight}. */
export interface IdealBodyWeightInput {
  /** Height in metres. */
  heightM: number
  /** Actual body weight in kilograms. Devine has no upper bound; keep it physiological. */
  weightKg: number
  /** Biological sex used by the Devine constants. */
  sex: Sex
}

/** Devine's reference height (5 ft 0 in), in centimetres. */
export const DEVINE_REFERENCE_HEIGHT_CM = 152.4

/** Actual weight above this multiple of IBW triggers the adjusted weight. */
export const ABW_TRIGGER_RATIO = 1.2

const SEXES: readonly Sex[] = ['M', 'F']

export const IBW_REFERENCES: ReferenceRange[] = [
  { label: 'Male reference (50 + 2.3 × inches over 5 ft)', min: 45, max: 110, severity: 'info' },
  { label: 'Female reference (45.5 + 2.3 × inches over 5 ft)', min: 40, max: 100, severity: 'info' },
]

/**
 * Calculates Devine Ideal Body Weight.
 *
 * IBW(M) = 50 + 2.3 × ((height_cm − 152.4) / 2.54)
 * IBW(F) = 45.5 + 2.3 × ((height_cm − 152.4) / 2.54)
 *
 * When the actual weight exceeds 120% of IBW the Adjusted Body Weight is also
 * reported, because that is the figure to use for lipophilic drug loading:
 *
 * ABW = IBW + 0.4 × (actual − IBW)
 *
 * @param input - Height, actual weight and sex.
 * @returns `CalcResult` whose value is the IBW in kilograms, with the adjusted
 *   weight attached as a sub-result when it applies.
 * @throws {CalcValidationError} When height or weight is out of range, or the
 *   sex is not `M` or `F`.
 *
 * @reference Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650–655.
 */
export function calculateIdealBodyWeight(input: IdealBodyWeightInput): CalcResult {
  const { heightM, weightKg, sex } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(heightM, 0.3, 2.5, 'heightM', 'm')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')

  const heightCm = heightM * 100
  const inchesOverReference = (heightCm - DEVINE_REFERENCE_HEIGHT_CM) / 2.54
  const base = sex === 'M' ? 50 : 45.5
  const ibw = base + 2.3 * inchesOverReference
  const useAdjusted = weightKg > ibw * ABW_TRIGGER_RATIO

  const subResults: CalcResult[] = []
  if (useAdjusted) {
    const abw = ibw + 0.4 * (weightKg - ibw)
    subResults.push({
      label: 'Adjusted Body Weight',
      value: round(abw, 1),
      unit: 'kg',
      severity: 'info',
      interpretation: `Actual weight is ${round(weightKg / ibw, 2)}× the ideal weight, above the ${ABW_TRIGGER_RATIO}× threshold. Use the adjusted weight for loading doses of lipophilic drugs.`,
    })
  }

  return {
    label: 'Ideal Body Weight',
    value: round(ibw, 1),
    unit: 'kg',
    severity: 'info',
    interpretation: `Devine ideal body weight ${round(ibw, 1)} kg for a ${round(heightCm, 1)} cm ${sex === 'M' ? 'male' : 'female'}.${
      useAdjusted
        ? ' Actual weight is above 120% of IBW, so the adjusted weight below should be used for drug loading.'
        : ' Actual weight is within 120% of IBW, so the ideal weight applies directly.'
    }`,
    references: IBW_REFERENCES,
    subResults,
  }
}

/**
 * Whether the adjusted body weight applies to a given patient.
 *
 * Exposed separately so the form layer can display the threshold before the
 * user presses Calculate.
 *
 * @param ibwKg - Ideal body weight in kilograms.
 * @param weightKg - Actual weight in kilograms.
 *
 * @reference Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650–655.
 * @reference Janmahasatian S, Duffull SB. Estimation of renal function: importance of body size. Clin Pharmacokinet. 1994;26(6):361–368.
 */
export function requiresAdjustedWeight(ibwKg: number, weightKg: number): boolean {
  return weightKg > ibwKg * ABW_TRIGGER_RATIO
}