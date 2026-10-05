/**
 * HAS-BLED bleeding-risk score in atrial fibrillation.
 *
 * @module logic/calculators/cardiologia/hasbled
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { pluralize } from '../../utils/units'

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
  { label: 'Baixo risco (0–1)', max: 1, severity: 'normal' },
  { label: 'Risco moderado (2)', min: 2, max: 2, severity: 'attention' },
  { label: 'Alto risco (≥ 3)', min: 3, severity: 'critical' },
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
    label: 'H — Hipertensão não controlada',
    description: 'PAS > 160 mmHg',
    key: 'hypertensionUncontrolled',
  },
  {
    label: 'R — Doença renal',
    description: 'Diálise ou creatinina > 2.26 mg/dL',
    key: 'renalDisease',
  },
  {
    label: 'L — Doença hepática',
    description: 'Cirrose, bilirrubina > 2× ULN ou ALT > 3× ULN',
    key: 'liverDisease',
  },
  {
    label: 'S — Antecedente de AVC',
    description: 'AVC prévio ou embolia sistêmica',
    key: 'strokeHistory',
  },
  {
    label: 'B — Antecedente de sangramento',
    description: 'Sangramento prévio ou predisposição a sangramento',
    key: 'bleedingHistory',
  },
  { label: 'L — INR instável', description: 'Tempo no intervalo terapêutico < 60%', key: 'labileInr' },
  { label: 'E — Idoso', description: 'Idade > 65 anos', key: 'elderly' },
  {
    label: 'D — Drogas',
    description: 'Terapia antiagregante plaquetária ou AINHs',
    key: 'drugsAntiplatelet',
  },
  {
    label: 'D — Álcool',
    description: 'Oito ou mais unidades de álcool por semana',
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
  const band = score <= 1 ? 'baixo' : score === 2 ? 'moderado' : 'alto'
  const modifiers = components.filter(component => component.present)

  return {
    label: 'Escore HAS-BLED',
    value: score,
    unit: pluralize(score, 'ponto'),
    severity,
    interpretation: `HAS-BLED ${score} de ${HAS_BLED_MAX} — risco de sangramento ${band}. Um HAS-BLED elevado não contraindica anticoagulação; corrija os fatores modificáveis (hipertensão não controlada, disfunção hepática, uso de álcool) e reavalie o escore após cada consulta.`,
    references: HAS_BLED_REFERENCES,
    subResults: modifiers.length
      ? modifiers.map(component => ({
          label: component.label,
          value: component.points,
          unit: pluralize(component.points, 'ponto'),
          severity: 'info' as const,
          interpretation: component.description,
        }))
      : [
          {
            label: 'Riscos modificáveis',
            value: 0,
            severity: 'info' as const,
            interpretation: 'Nenhum fator de risco de sangramento modificável identificado.',
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