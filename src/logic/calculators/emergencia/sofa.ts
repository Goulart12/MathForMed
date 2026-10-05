/**
 * SOFA — Sequential Organ Failure Assessment across six organ systems.
 *
 * The calculator accepts the six organ subscores already mapped from the SOFA
 * table (0–4 each); raw laboratory values are mapped by the form layer using
 * {@link SOFA_ORGAN_SCALES}.
 *
 * @module logic/calculators/emergencia/sofa
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'

/** One organ system's 0–4 score. */
export type SofaScore = 0 | 1 | 2 | 3 | 4

/** Inputs for {@link calculateSofa}. */
export interface SofaInput {
  /** Respiratory: PaO₂/FiO₂, or SpO₂/FiO₂ where arterial gas is unavailable. */
  respirationScore: SofaScore
  /** Coagulation: platelets ×10³/µL. */
  coagulationScore: SofaScore
  /** Liver: total bilirubin mg/dL. */
  liverScore: SofaScore
  /** Cardiovascular: mean arterial pressure or vasopressor dose. */
  cardiovascularScore: SofaScore
  /** Central nervous system: Glasgow Coma Scale. */
  cnsScore: SofaScore
  /** Renal: creatinine mg/dL or urine output. */
  renalScore: SofaScore
}

const SCORE_TIERS: readonly SofaScore[] = [0, 1, 2, 3, 4]

export const SOFA_REFERENCES: ReferenceRange[] = [
  { label: '0–6 — low organ dysfunction', min: 0, max: 6, severity: 'normal' },
  { label: '7–9 — moderate organ dysfunction', min: 7, max: 9, severity: 'attention' },
  { label: '≥ 10 — high organ dysfunction', min: 10, max: 24, severity: 'critical' },
]

/** Maximum achievable total, six organs × 4 points. */
export const SOFA_MAX = 24

/**
 * ICU mortality (%) indexed by total SOFA score, 0 through 14. Scores above 14
 * report the same value as 14, matching the published `> 14` row.
 *
 * @reference Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801–810.
 */
export const SOFA_ICU_MORTALITY_BY_SCORE: readonly number[] = [
  0, 0, 0, 15.7, 31, 40.5, 50, 53, 60, 65, 70, 75, 77, 78, 80,
]

/**
 * ICU mortality by total SOFA score, expressed as ranges for the reference table.
 */
export const SOFA_ICU_MORTALITY: readonly { max: number; percent: number }[] = [
  ...SOFA_ICU_MORTALITY_BY_SCORE.map((percent, score) => ({ max: score, percent })),
  { max: Infinity, percent: SOFA_ICU_MORTALITY_BY_SCORE[14] },
]

/**
 * Descriptive bands for each organ system, used both to document the input and
 * to render the SOFA table in the UI.
 */
export const SOFA_ORGAN_SCALES = {
  respiration: [
    'PaO₂/FiO₂ ≥ 400',
    '< 400',
    '< 300 with respiratory support',
    '< 200 with respiratory support',
    '< 100 with respiratory support',
  ],
  coagulation: [
    'Platelets ≥ 150 ×10³/µL',
    '< 150 ×10³/µL',
    '< 100 ×10³/µL',
    '< 50 ×10³/µL',
    '< 20 ×10³/µL',
  ],
  liver: [
    'Bilirubin < 1.2 mg/dL',
    '1.2–1.9 mg/dL',
    '2.0–5.9 mg/dL',
    '6.0–11.9 mg/dL',
    '≥ 12.0 mg/dL',
  ],
  cardiovascular: [
    'MAP ≥ 70 mmHg',
    'MAP < 70 mmHg',
    'Dopamine ≤ 5 or dobutamine, or any vasopressor',
    'Dopamine > 5, or epinephrine ≤ 0.1, or norepinephrine ≤ 0.1',
    'Dopamine > 10, or epinephrine > 0.1, or norepinephrine > 0.1',
  ],
  cns: [
    'GCS 15',
    'GCS 13–14',
    'GCS 10–12',
    'GCS 6–9',
    'GCS < 6',
  ],
  renal: [
    'Creatinine < 1.2 mg/dL',
    '1.2–1.9 mg/dL',
    '2.0–3.4 mg/dL, or urine output < 500 mL/day',
    '3.5–4.9 mg/dL, or urine output < 200 mL/day',
    '≥ 5.0 mg/dL, or urine output < 100 mL/day',
  ],
} as const

/** Keys of {@link SofaInput}, in display order. */
const ORGAN_KEYS: readonly (keyof SofaInput)[] = [
  'respirationScore',
  'coagulationScore',
  'liverScore',
  'cardiovascularScore',
  'cnsScore',
  'renalScore',
]

const ORGAN_LABELS: Record<keyof SofaInput, string> = {
  respirationScore: 'Respiration',
  coagulationScore: 'Coagulation',
  liverScore: 'Liver',
  cardiovascularScore: 'Cardiovascular',
  cnsScore: 'Central nervous system',
  renalScore: 'Renal',
}

/**
 * Calculates the total SOFA score.
 *
 * total = respiration + coagulation + liver + cardiovascular + cns + renal
 *
 * @param input - The six organ subscores, each 0–4.
 * @returns `CalcResult` whose value is the total 0–24, with one sub-result per
 *   organ system and the expected ICU mortality in the interpretation.
 * @throws {CalcValidationError} When any organ score is outside 0–4.
 *
 * @reference Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801–810.
 *
 * @example
 * calculateSofa({
 *   respirationScore: 2, coagulationScore: 1, liverScore: 1,
 *   cardiovascularScore: 1, cnsScore: 3, renalScore: 0,
 * }).value // 8
 */
export function calculateSofa(input: SofaInput): CalcResult {
  const organs = ORGAN_KEYS.map(key => {
    const score = input[key]
    assertRange(score, 0, 4, key, 'points')
    return { key, score }
  })

  const total = organs.reduce((sum, organ) => sum + organ.score, 0)
  const severity = total <= 6 ? 'normal' : total <= 9 ? 'attention' : 'critical'
  const mortality = sofaIcuMortality(total)

  return {
    label: 'SOFA Score',
    value: total,
    unit: 'points',
    severity,
    interpretation: `SOFA ${total} of ${SOFA_MAX} — ${total >= 10 ? 'high' : total >= 7 ? 'moderate' : 'low'} organ dysfunction. Reported ICU mortality for this score in the Sepsis-3 trial was approximately ${mortality}%.${
      total >= 10
        ? ' Escalate organ support and reassess within hours.'
        : ''
    }`,
    references: SOFA_REFERENCES,
    subResults: organs.map(organ => ({
      label: ORGAN_LABELS[organ.key],
      value: organ.score,
      unit: 'points',
      severity: (organ.score > 0 ? 'attention' : 'info') as 'attention' | 'info',
      interpretation: SOFA_ORGAN_SCALES[organScoreKey(organ.key)][organ.score],
    })),
  }
}

function organScoreKey(
  key: keyof SofaInput,
): keyof typeof SOFA_ORGAN_SCALES {
  return key.replace(/Score$/, '') as keyof typeof SOFA_ORGAN_SCALES
}

/**
 * Maps the expected ICU mortality for a total SOFA score.
 *
 * @param total - Total SOFA score.
 * @returns ICU mortality as a percentage.
 *
 * @reference Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801–810.
 */
export function sofaIcuMortality(total: number): number {
  assertRange(total, 0, SOFA_MAX, 'total', 'points')
  return SOFA_ICU_MORTALITY_BY_SCORE[
    Math.min(Math.round(total), SOFA_ICU_MORTALITY_BY_SCORE.length - 1)
  ]
}

/** The valid 0–4 SOFA subscores, for building steppers in the form layer. */
export const SOFA_SCORE_TIERS = SCORE_TIERS