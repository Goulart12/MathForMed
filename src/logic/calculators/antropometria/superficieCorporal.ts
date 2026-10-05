/**
 * Body Surface Area — Mosteller and Du Bois formulas.
 *
 * @module logic/calculators/antropometria/superficieCorporal
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Supported BSA formulas. */
export type BsaFormula = 'mosteller' | 'dubois'

/** Inputs for {@link calculateBsa}. */
export interface BsaInput {
  /** Body weight in kilograms. */
  weightKg: number
  /** Height in metres (not centimetres). */
  heightM: number
  /** Which published formula to apply. */
  formula: BsaFormula
}

const FORMULAE: readonly BsaFormula[] = ['mosteller', 'dubois']

const FORMULA_LABELS: Record<BsaFormula, string> = {
  mosteller: 'Mosteller',
  dubois: 'Du Bois',
}

/** Average adult BSA, used as the reference anchor in the interpretation. */
export const ADULT_MEAN_BSA_M2 = 1.73

export const BSA_REFERENCES: ReferenceRange[] = [
  {
    label: 'Adulto médio',
    min: 1.5,
    max: 2.0,
    severity: 'normal',
  },
]

/**
 * Calculates Body Surface Area.
 *
 * Mosteller: BSA = √((weight_kg × height_cm) / 3600)
 * Du Bois:   BSA = 0.007184 × weight_kg^0.425 × height_cm^0.725
 *
 * @param input - Weight, height and the formula to use.
 * @returns `CalcResult` whose value is the BSA in m² rounded to two decimals.
 * @throws {CalcValidationError} When weight or height is out of range, or the
 *   formula is not one of `mosteller | dubois`.
 *
 * @reference Mosteller RD. Simplified calculation of the surface area of the body. N Engl J Med. 1987;317(17):1098.
 * @reference DuBois D, DuBois EF. A formula to estimate the surface area of the body. Arch Intern Med. 1916;17(6):863–871.
 */
export function calculateBsa(input: BsaInput): CalcResult {
  const { weightKg, heightM, formula } = input

  assertOneOf(formula, FORMULAE, 'formula')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertRange(heightM, 0.3, 2.5, 'heightM', 'm')

  const heightCm = heightM * 100
  const bsa =
    formula === 'mosteller'
      ? Math.sqrt((weightKg * heightCm) / 3600)
      : 0.007184 * weightKg ** 0.425 * heightCm ** 0.725

  const rounded = round(bsa, 2)

  return {
    label: 'Superfície Corporal',
    value: rounded,
    unit: 'm²',
    severity: 'info',
    interpretation: `SC ${rounded} m² pela fórmula de ${FORMULA_LABELS[formula]}. A referência do adulto médio é ${ADULT_MEAN_BSA_M2} m²; as doses de quimioterapia em mg/m² são calculadas a partir deste valor.`,
    references: BSA_REFERENCES,
  }
}