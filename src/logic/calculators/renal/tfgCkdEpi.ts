/**
 * Estimated GFR — CKD-EPI 2021 (race-neutral) with KDIGO staging.
 *
 * @module logic/calculators/renal/tfgCkdEpi
 */

import type { CalcResult, Severity } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'
import { classifyKdigo, KDIGO_REFERENCES } from '../../utils/kdigo'

/** Inputs for {@link calculateCkdEpi}. */
export interface CkdEpiInput {
  /** Age in whole years. */
  age: number
  /** Serum creatinine in mg/dL. */
  serumCreatinineMgDl: number
  /** Biological sex, which selects κ, α and the female constant. */
  sex: 'M' | 'F'
}

const SEXES: readonly ('M' | 'F')[] = ['M', 'F']

/** κ by sex. */
export const CKD_EPI_KAPPA: Record<'M' | 'F', number> = { F: 0.7, M: 0.9 }

/** α by sex. */
export const CKD_EPI_ALPHA: Record<'M' | 'F', number> = { F: -0.241, M: -0.302 }

/** Sex-specific constant applied at the end of the equation. */
export const CKD_EPI_SEX_CONSTANT: Record<'M' | 'F', number> = { F: 1.012, M: 1 }

/** Age discounting constant per year of life. */
export const CKD_EPI_AGE_CONSTANT = 0.9938

/**
 * Calculates eGFR with the 2021 race-neutral CKD-EPI creatinine equation.
 *
 * κ = 0.9 (M) or 0.7 (F); α = −0.302 (M) or −0.241 (F)
 * eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age [× 1.012 if F]
 *
 * @param input - Age, serum creatinine and sex.
 * @returns `CalcResult` whose value is the eGFR in mL/min/1.73 m² rounded to one
 *   decimal, carrying the KDIGO stage as a sub-result.
 * @throws {CalcValidationError} When age or creatinine is out of range, or the
 *   sex is not `M` or `F`.
 *
 * @reference Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737–1749.
 *
 * @example
 * calculateCkdEpi({ age: 65, serumCreatinineMgDl: 1.0, sex: 'F' }).value // 65.2
 */
export function calculateCkdEpi(input: CkdEpiInput): CalcResult {
  const { age, serumCreatinineMgDl, sex } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(age, 1, 120, 'age', 'anos')
  assertRange(serumCreatinineMgDl, 0.1, 50, 'serumCreatinineMgDl', 'mg/dL')

  const kappa = CKD_EPI_KAPPA[sex]
  const alpha = CKD_EPI_ALPHA[sex]
  const normalised = serumCreatinineMgDl / kappa

  const gfr =
    142 *
    Math.min(normalised, 1) ** alpha *
    Math.max(normalised, 1) ** -1.2 *
    CKD_EPI_AGE_CONSTANT ** age *
    CKD_EPI_SEX_CONSTANT[sex]

  const rounded = round(gfr, 1)
  const stage = classifyKdigo(gfr)
  const severity: Severity = stage.severity

  return {
    label: 'TFGe (CKD-EPI 2021)',
    value: rounded,
    unit: 'mL/min/1.73 m²',
    severity,
    interpretation: `TFGe ${rounded} mL/min/1.73 m² — KDIGO ${stage.stage} (${stage.label.replace(/^G\d[ab]?\s—\s/, '')}).${
      gfr < 60
        ? ' Valores abaixo de 60 mL/min/1.73 m² mantidos por 3 meses definem CKD.'
        : ' Valores iguais ou superiores a 60 mL/min/1.73 m² não são, por si só, diagnósticos de CKD.'
    }`,
    references: KDIGO_REFERENCES,
    subResults: [
      {
        label: 'Estágio KDIGO',
        value: stage.stage,
        severity,
        interpretation: stage.label,
      },
      {
        label: 'Fórmula',
        value: 'CKD-EPI 2021',
        severity: 'info',
        interpretation:
          'Revisão de 2021 neutra em relação à raça; os coeficientes raciais de 2009 foram removidos da fórmula.',
      },
    ],
  }
}