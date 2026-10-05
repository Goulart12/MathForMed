/**
 * Creatinine clearance — Cockcroft-Gault equation with KDIGO staging.
 *
 * @module logic/calculators/renal/creatininaClearance
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'
import { classifyKdigo, KDIGO_REFERENCES } from '../../utils/kdigo'

/** Inputs for {@link calculateCreatinineClearance}. */
export interface CreatinineClearanceInput {
  /** Age in whole years. */
  age: number
  /** Body weight in kilograms. */
  weightKg: number
  /** Serum creatinine in mg/dL. */
  serumCreatinineMgDl: number
  /** Biological sex; the female estimate is scaled by 0.85. */
  sex: 'M' | 'F'
}

const SEXES: readonly ('M' | 'F')[] = ['M', 'F']

/** The 0.85 multiplier Cockcroft-Gault applies to female estimates. */
export const FEMALE_FACTOR = 0.85

export const CRCL_REFERENCES: ReferenceRange[] = [
  { label: 'Função renal normal (≥ 90 mL/min)', min: 90, severity: 'normal' },
  { label: 'Ligeiramente reduzida (60–89 mL/min)', min: 60, max: 89, severity: 'normal' },
  {
    label: 'Ligeiramente a moderadamente reduzida (45–59)',
    min: 45,
    max: 59,
    severity: 'attention',
  },
  {
    label: 'Moderadamente a severamente reduzida (30–44)',
    min: 30,
    max: 44,
    severity: 'attention',
  },
  { label: 'Severamente reduzida (15–29 mL/min)', min: 15, max: 29, severity: 'critical' },
  { label: 'Falência renal (< 15 mL/min)', max: 14.9, severity: 'critical' },
]

/**
 * Calculates creatinine clearance by Cockcroft-Gault.
 *
 * CrCl = ((140 − age) × weight) / (72 × serum creatinine)
 * CrCl is multiplied by 0.85 for female patients.
 *
 * @param input - Age, weight, serum creatinine and sex.
 * @returns `CalcResult` whose value is the CrCl in mL/min rounded to one
 *   decimal, carrying the KDIGO stage as a sub-result.
 * @throws {CalcValidationError} When age, weight or creatinine is out of range,
 *   or the sex is not `M` or `F`.
 *
 * @reference Cockcroft DW, Gault MH. Estimation of creatinine clearance. Nephron. 1976;16(1):31–41.
 * @reference KDIGO. Clinical Practice Guideline for CKD. Kidney Int. 2024;105(4S):S117–S314.
 *
 * @example
 * calculateCreatinineClearance({
 *   age: 70, weightKg: 70, serumCreatinineMgDl: 1.2, sex: 'M',
 * }).value // 56.8
 */
export function calculateCreatinineClearance(
  input: CreatinineClearanceInput,
): CalcResult {
  const { age, weightKg, serumCreatinineMgDl, sex } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(age, 1, 120, 'age', 'anos')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertRange(serumCreatinineMgDl, 0.1, 50, 'serumCreatinineMgDl', 'mg/dL')

  const raw = ((140 - age) * weightKg) / (72 * serumCreatinineMgDl)
  const crCl = sex === 'F' ? raw * FEMALE_FACTOR : raw
  const rounded = round(crCl, 1)
  const stage = classifyKdigo(crCl)

  const severity: Severity = stage.severity

  return {
    label: 'Depuração de Creatinina',
    value: rounded,
    unit: 'mL/min',
    severity,
    interpretation: `CrCl ${rounded} mL/min — KDIGO ${stage.stage} (${stage.label.replace(/^G\d[ab]?\s—\s/, '')}).${
      crCl < 60
        ? ' A função renal está reduzida; fármacos de eliminação renal normalmente exigem ajuste de dose ou aumento do intervalo de administração.'
        : ' A função renal está preservada.'
    }`,
    references: CRCL_REFERENCES,
    subResults: [
      {
        label: 'Estágio KDIGO',
        value: stage.stage,
        severity,
        interpretation: stage.label,
      },
      {
        label: 'Fator por sexo',
        value: sex === 'F' ? FEMALE_FACTOR : 1,
        unit: '×',
        severity: 'info',
        interpretation:
          sex === 'F'
            ? 'As estimativas para o sexo feminino são multiplicadas por 0.85.'
            : 'Nenhum fator por sexo é aplicado à estimativa masculina.',
      },
    ],
  }
}

/** Re-exported so consumers can render the staging table without a deep import. */
export { KDIGO_REFERENCES }