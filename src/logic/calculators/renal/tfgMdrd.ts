/**
 * Estimated GFR — four-variable MDRD study equation with KDIGO staging.
 *
 * @module logic/calculators/renal/tfgMdrd
 */

import type { CalcResult, Severity } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'
import { classifyKdigo, KDIGO_REFERENCES } from '../../utils/kdigo'

/** Inputs for {@link calculateMdrd}. */
export interface MdrdInput {
  /** Age in whole years. */
  age: number
  /** Serum creatinine in mg/dL. */
  serumCreatinineMgDl: number
  /** Biological sex; female estimates are multiplied by 0.742. */
  sex: 'M' | 'F'
}

const SEXES: readonly ('M' | 'F')[] = ['M', 'F']

/** The 0.742 multiplier MDRD applies to female estimates. */
export const MDRD_FEMALE_FACTOR = 0.742

/**
 * Calculates eGFR with the four-variable MDRD study equation.
 *
 * eGFR = 175 × Scr^−1.154 × age^−0.203 [× 0.742 if female]
 *
 * @param input - Age, serum creatinine and sex.
 * @returns `CalcResult` whose value is the eGFR in mL/min/1.73 m² rounded to one
 *   decimal, carrying the KDIGO stage as a sub-result.
 * @throws {CalcValidationError} When age or creatinine is out of range, or the
 *   sex is not `M` or `F`.
 *
 * @reference Levey AS, Bosch JP, Lewis JB, et al. A new prediction equation for modification of diet in renal disease. Ann Intern Med. 1999;130(6):461–470.
 *
 * @example
 * calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2, sex: 'M' }).value // 61.9
 */
export function calculateMdrd(input: MdrdInput): CalcResult {
  const { age, serumCreatinineMgDl, sex } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(age, 1, 120, 'age', 'anos')
  assertRange(serumCreatinineMgDl, 0.1, 50, 'serumCreatinineMgDl', 'mg/dL')

  const raw = 175 * serumCreatinineMgDl ** -1.154 * age ** -0.203
  const gfr = sex === 'F' ? raw * MDRD_FEMALE_FACTOR : raw
  const rounded = round(gfr, 1)
  const stage = classifyKdigo(gfr)
  const severity: Severity = stage.severity

  return {
    label: 'TFGe (MDRD)',
    value: rounded,
    unit: 'mL/min/1.73 m²',
    severity,
    interpretation: `TFGe ${rounded} mL/min/1.73 m² — KDIGO ${stage.stage} (${stage.label.replace(/^G\d[ab]?\s—\s/, '')}). A equação MDRD de quatro variáveis é menos acurada que a CKD-EPI 2021 acima de 90 mL/min/1.73 m².`,
    references: KDIGO_REFERENCES,
    subResults: [
      {
        label: 'Estágio KDIGO',
        value: stage.stage,
        severity,
        interpretation: stage.label,
      },
    ],
  }
}