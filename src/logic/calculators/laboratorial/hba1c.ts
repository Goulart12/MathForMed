/**
 * HbA1c with ADAG-derived estimated average glucose.
 *
 * @module logic/calculators/laboratorial/hba1c
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateHba1c}. */
export interface Hba1cInput {
  /** Glycated haemoglobin as a percentage of total haemoglobin. */
  hba1cPercent: number
}

/** ADAG conversion from HbA1c (%) to estimated average glucose in mg/dL. */
export const ADAG_EAG_MGDL = (hba1cPercent: number): number => hba1cPercent * 28.7 - 46.7

/** ADAG conversion from HbA1c (%) to estimated average glucose in mmol/L. */
export const ADAG_EAG_MMOL = (hba1cPercent: number): number => hba1cPercent * 1.59 - 2.59

/** General treatment target for type 2 diabetes. */
export const T2DM_TARGET_PERCENT = 7

export const HBA1C_REFERENCES: ReferenceRange[] = [
  { label: 'Normal (< 5.7%)', max: 5.7, severity: 'normal' },
  { label: 'Pré-diabetes (5.7–6.4%)', min: 5.7, max: 6.5, severity: 'attention' },
  { label: 'Diabetes (≥ 6.5%)', min: 6.5, severity: 'critical' },
]

export const T2DM_TARGET_REFERENCES: ReferenceRange[] = [
  { label: 'No alvo (< 7%)', max: 7, severity: 'normal' },
  { label: 'Próximo do alvo (7–8%)', min: 7, max: 8, severity: 'attention' },
  { label: 'Fora do alvo (> 8%)', min: 8, severity: 'critical' },
]

/**
 * Calculates estimated average glucose from HbA1c and classifies glycaemic
 * control.
 *
 * eAG (mg/dL)  = (HbA1c × 28.7) − 46.7
 * eAG (mmol/L) = (HbA1c × 1.59) − 2.59
 *
 * @param input - The HbA1c percentage.
 * @returns `CalcResult` whose value is the HbA1c, with the ADAG estimated
 *   average glucose in both units and the type 2 diabetes target assessment as
 *   sub-results.
 * @throws {CalcValidationError} When HbA1c is outside 3–20%.
 *
 * @reference Nathan DM, Weyand CM. Hyperglycaemia and risk of diabetic complications. Diabetes Care. 2008;31(8):1473–1478.
 *
 * @example
 * calculateHba1c({ hba1cPercent: 7 }).value // 7
 */
export function calculateHba1c(input: Hba1cInput): CalcResult {
  const { hba1cPercent } = input

  assertRange(hba1cPercent, 3, 20, 'hba1cPercent', '%')

  const severity =
    hba1cPercent < 5.7 ? 'normal' : hba1cPercent < 6.5 ? 'attention' : 'critical'
  const classification =
    hba1cPercent < 5.7
      ? 'Normal'
      : hba1cPercent < 6.5
        ? 'Pré-diabetes'
        : 'Diabetes'

  const targetSeverity =
    hba1cPercent < T2DM_TARGET_PERCENT
      ? 'normal'
      : hba1cPercent <= 8
        ? 'attention'
        : 'critical'
  const targetStatus =
    hba1cPercent < T2DM_TARGET_PERCENT
      ? 'No alvo'
      : hba1cPercent <= 8
        ? 'Próximo do alvo'
        : 'Fora do alvo'

  return {
    label: 'HbA1c',
    value: hba1cPercent,
    unit: '%',
    severity,
    interpretation: `HbA1c ${hba1cPercent}% — ${classification}. O diabetes é diagnosticado em 6.5% ou mais; o pré-diabetes abrange de 5.7 a 6.4%.`,
    references: HBA1C_REFERENCES,
    subResults: [
      {
        label: 'Glicose Média Estimada',
        value: round(ADAG_EAG_MGDL(hba1cPercent), 0),
        unit: 'mg/dL',
        severity: 'info',
        interpretation: `Regressão ADAG: (${hba1cPercent} × 28.7) − 46.7.`,
      },
      {
        label: 'Glicose Média Estimada',
        value: round(ADAG_EAG_MMOL(hba1cPercent), 1),
        unit: 'mmol/L',
        severity: 'info',
        interpretation: `Regressão ADAG: (${hba1cPercent} × 1.59) − 2.59.`,
      },
      {
        label: 'Alvo para diabetes tipo 2',
        value: targetStatus,
        severity: targetSeverity,
        interpretation: `O alvo geral de tratamento é HbA1c abaixo de ${T2DM_TARGET_PERCENT}%; individualizar conforme idade, comorbidades e risco de hipoglicemia.`,
      },
    ],
  }
}