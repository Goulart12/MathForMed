/**
 * HAS-BLED bleeding-risk score in atrial fibrillation.
 *
 * @module logic/calculators/cardiologia/hasbled
 */

import type { CalcResult, ReferenceRange } from '../../types'

/** Inputs for {@link calculateHasBled}. */
export interface HasBledInput {
  /** Uncontrolled hypertension: systolic BP > 160 mmHg. */
  hypertensionUncontrolled: boolean
  /** Renal disease: chronic dialysis or creatinine > 2.26 mg/dL. */
  renalDisease: boolean
  /** Liver disease: cirrhosis, bilirubin > 2× ULN or transaminases > 3× ULN. */
  liverDisease: boolean
  /** Prior stroke. */
  strokeHistory: boolean
  /** Prior bleeding or a bleeding predisposition. */
  bleedingHistory: boolean
  /** Labile INR: time in therapeutic range < 60%. */
  labileInr: boolean
  /** Age > 65 years. */
  elderly: boolean
  /** Antiplatelet therapy or NSAID use. */
  drugsAntiplatelet: boolean
  /** Alcohol consumption of 8 or more units per week. */
  alcoholUse: boolean
}

export const HAS_BLED_REFERENCES: ReferenceRange[] = [
  { label: 'Low risk (0–1)', max: 1, severity: 'normal' },
  { label: 'Moderate risk (2)', min: 2, max: 2, severity: 'attention' },
  { label: 'High risk (≥ 3)', min: 3, severity: 'critical' },
]

/** Maximum achievable HAS-BLED score. */
export const HAS_BLED_MAX = 9

/** One criterion of the score, exposed so the form layer can build its rows. */
export interface HasBledComponent {
  /** Letter and criterion name, e.g. `H — Uncontrolled hypertension`. */
  label: string
  /** Short definition shown as helper text in the form. */
  description: string
  /** Points contributed when present (always 1). */
  points: number
  /** The criterion's boolean input value. */
  present: boolean
}

/**
 * The nine criteria in display order. Each carries the input key it reads, so
 * the criterion and its flag can never drift apart.
 */
const CRITERIA: readonly (Omit<HasBledComponent, 'points' | 'present'> & {
  key: keyof HasBledInput
})[] = [
  {
    label: 'H — Uncontrolled hypertension',
    description: 'Systolic BP > 160 mmHg',
    key: 'hypertensionUncontrolled',
  },
  {
    label: 'R — Renal disease',
    description: 'Dialysis or creatinine > 2.26 mg/dL',
    key: 'renalDisease',
  },
  {
    label: 'L — Liver disease',
    description: 'Cirrhosis, bilirubin > 2× ULN or ALT > 3× ULN',
    key: 'liverDisease',
  },
  {
    label: 'S — Stroke history',
    description: 'Previous stroke or systemic embolism',
    key: 'strokeHistory',
  },
  {
    label: 'B — Bleeding history',
    description: 'Previous bleeding or a bleeding predisposition',
    key: 'bleedingHistory',
  },
  { label: 'L — Labile INR', description: 'Time in therapeutic range < 60%', key: 'labileInr' },
  { label: 'E — Elderly', description: 'Age > 65 years', key: 'elderly' },
  {
    label: 'D — Drugs',
    description: 'Antiplatelet therapy or NSAIDs',
    key: 'drugsAntiplatelet',
  },
  {
    label: 'D — Alcohol',
    description: 'Eight or more units of alcohol per week',
    key: 'alcoholUse',
  },
]

/**
 * Calculates the HAS-BLED score.
 *
 * Each of the nine criteria contributes 1 point; the maximum is 9.
 *
 * @param input - The nine HAS-BLED criteria as booleans.
 * @returns `CalcResult` whose value is the total score, with the modifiable
 *   risks present attached as sub-results.
 * @throws {CalcValidationError} Never — booleans only. Validation is by type.
 *
 * @reference Pisters R, Lane DA, Gagnier JJ, et al. A novel risk factor model to predict stroke risk in atrial fibrillation. Chest. 2010;138(5):1093–1100.
 * @reference van Gelder IC, Rienstra M, Bunting KV, et al. Atrial fibrillation. Eur Heart J. 2024;45(36):3314–3414.
 *
 * @example
 * calculateHasBled({
 *   hypertensionUncontrolled: true, elderly: true,
 *   drugsAntiplatelet: true, alcoholUse: false, renalDisease: false,
 *   liverDisease: false, strokeHistory: false, bleedingHistory: false, labileInr: false,
 * }).value // 3
 */
export function calculateHasBled(input: HasBledInput): CalcResult {
  const components = hasBledComponents(input)
  const score = components.reduce((total, component) => total + component.points, 0)

  const severity = score <= 1 ? 'normal' : score === 2 ? 'attention' : 'critical'
  const band = score <= 1 ? 'low' : score === 2 ? 'moderate' : 'high'
  const modifiers = components.filter(component => component.present)

  return {
    label: 'HAS-BLED Score',
    value: score,
    unit: 'points',
    severity,
    interpretation: `HAS-BLED ${score} of ${HAS_BLED_MAX} — ${band} bleeding risk. A high HAS-BLED does not contraindicate anticoagulation; correct the modifiable factors (uncontrolled hypertension, liver dysfunction, alcohol use) and re-score after each review.`,
    references: HAS_BLED_REFERENCES,
    subResults: modifiers.length
      ? modifiers.map(component => ({
          label: component.label,
          value: component.points,
          unit: 'points',
          severity: 'info' as const,
          interpretation: component.description,
        }))
      : [
          {
            label: 'Modifiable Risks',
            value: 0,
            severity: 'info' as const,
            interpretation: 'No modifiable bleeding risk factors identified.',
          },
        ],
  }
}

/**
 * The nine criteria in display order, for building a form without repeating the
 * mapping.
 *
 * @param input - Current criterion values, so each entry carries its own value.
 *
 * @reference Pisters R, Lane DA, Gagnier JJ, et al. A novel risk factor model to predict stroke risk in atrial fibrillation. Chest. 2010;138(5):1093–1100.
 */
export function hasBledComponents(input: HasBledInput): HasBledComponent[] {
  return CRITERIA.map(({ key, ...criterion }) => {
    const present = Boolean(input[key])
    return { ...criterion, points: present ? 1 : 0, present }
  })
}