/**
 * CHA₂DS₂-VASc stroke risk in atrial fibrillation, with sex-aware thresholds.
 *
 * @module logic/calculators/cardiologia/chadsVasc
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'

/** Inputs for {@link calculateChadsVasc}. */
export interface ChadsVascInput {
  /** Age in whole years. Drives both the ≥65 (+1) and ≥75 (+2) points. */
  age: number
  /** Congestive heart failure or moderate-to-severe mitral stenosis. */
  chf: boolean
  /** Arterial hypertension or antihypertensive therapy. */
  hypertension: boolean
  /** Prior stroke, TIA or systemic thromboembolism (worth 2 points). */
  stroke: boolean
  /** Prior myocardial infarction, PAD or aortic plaque. */
  vascularDisease: boolean
  /** Diabetes mellitus. */
  diabetes: boolean
  /** Biological sex; female sex contributes 1 point. */
  sex: 'M' | 'F'
}

const SEXES: readonly ('M' | 'F')[] = ['M', 'F']

export const CHADS_VASC_REFERENCES: ReferenceRange[] = [
  { label: 'Male, score 0 — low risk', max: 0, severity: 'normal' },
  { label: 'Male, score 1 — moderate risk', min: 1, max: 1, severity: 'attention' },
  { label: 'Male, score ≥ 2 — high risk', min: 2, severity: 'critical' },
  { label: 'Female, score ≤ 1 — low risk', max: 1, severity: 'normal' },
  { label: 'Female, score 2 — moderate risk', min: 2, max: 2, severity: 'attention' },
  { label: 'Female, score ≥ 3 — high risk', min: 3, severity: 'critical' },
]

/** One point-contributing item, exposed so the form layer can build its rows. */
export interface ChadsVascComponent {
  /** Display label of the criterion. */
  label: string
  /** Points contributed when the criterion is present. */
  points: number
  /** The criterion's boolean input value. */
  present: boolean
}

/**
 * Calculates the CHA₂DS₂-VASc score.
 *
 * Congestive heart failure +1 · hypertension +1 · age ≥ 75 +2 · diabetes +1 ·
 * stroke/TIA/thromboembolism +2 · vascular disease +1 · age 65–74 +1 · female sex +1
 *
 * @param input - The eight CHA₂DS₂-VASc variables.
 * @returns `CalcResult` whose value is the total score, with the sex-specific
 *   risk band in the interpretation and the individual criteria as sub-results.
 * @throws {CalcValidationError} When age is outside 18–120 or the sex is unknown.
 *
 * @reference Lip GYH, Nattel S, Coudert S, et al. Anticoagulants in atrial fibrillation. Chest. 2010;137(2):263–272.
 * @reference Van Gelder IC, Rienstra M, Bunting KV, et al. Atrial fibrillation. Eur Heart J. 2024;45(36):3314–3414.
 *
 * @example
 * calculateChadsVasc({
 *   age: 78, chf: true, hypertension: true, stroke: false,
 *   vascularDisease: false, diabetes: true, sex: 'F',
 * }).value // 6
 */
export function calculateChadsVasc(input: ChadsVascInput): CalcResult {
  const { age, chf, hypertension, stroke, vascularDisease, diabetes, sex } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(age, 18, 120, 'age', 'years')

  const components: ChadsVascComponent[] = [
    { label: 'Congestive heart failure', points: chf ? 1 : 0, present: chf },
    { label: 'Hypertension', points: hypertension ? 1 : 0, present: hypertension },
    { label: 'Age ≥ 75', points: age >= 75 ? 2 : 0, present: age >= 75 },
    { label: 'Age 65–74', points: age >= 65 && age < 75 ? 1 : 0, present: age >= 65 && age < 75 },
    { label: 'Diabetes mellitus', points: diabetes ? 1 : 0, present: diabetes },
    {
      label: 'Stroke / TIA / thromboembolism',
      points: stroke ? 2 : 0,
      present: stroke,
    },
    { label: 'Vascular disease', points: vascularDisease ? 1 : 0, present: vascularDisease },
    { label: 'Female sex', points: sex === 'F' ? 1 : 0, present: sex === 'F' },
  ]

  const score = components.reduce((total, component) => total + component.points, 0)
  const { band, severity, action } = riskBand(score, sex)

  const sexOnlyNote =
    sex === 'F' && score === 1
      ? ' Female sex alone scores 1 point, equivalent to 0 in a male, and does not warrant anticoagulation on its own.'
      : ''

  return {
    label: 'CHA₂DS₂-VASc Score',
    value: score,
    unit: 'points',
    severity,
    interpretation: `CHA₂DS₂-VASc ${score} in a ${sex === 'F' ? 'female' : 'male'} — ${band} risk. ${action}${sexOnlyNote}`,
    references: CHADS_VASC_REFERENCES,
    subResults: components
      .filter(component => component.points > 0)
      .map(component => ({
        label: component.label,
        value: component.points,
        unit: 'points',
        severity: 'info' as const,
        // Only present criteria reach this list, so the descriptor is constant.
        interpretation: 'Present',
      })),
  }
}

function riskBand(
  score: number,
  sex: 'M' | 'F',
): { band: string; severity: Severity; action: string } {
  if (sex === 'M') {
    if (score === 0) {
      return {
        band: 'low',
        severity: 'normal',
        action: 'No anticoagulation recommended.',
      }
    }
    if (score === 1) {
      return {
        band: 'moderate',
        severity: 'attention',
        action: 'Consider anticoagulation; annual reassessment is advised.',
      }
    }
    return {
      band: 'high',
      severity: 'critical',
      action: 'Anticoagulation recommended.',
    }
  }

  if (score <= 1) {
    return {
      band: 'low',
      severity: 'normal',
      action: 'No anticoagulation recommended.',
    }
  }
  if (score === 2) {
    return {
      band: 'moderate',
      severity: 'attention',
      action: 'Consider anticoagulation; annual reassessment is advised.',
    }
  }
  return {
    band: 'high',
    severity: 'critical',
    action: 'Anticoagulation recommended.',
  }
}