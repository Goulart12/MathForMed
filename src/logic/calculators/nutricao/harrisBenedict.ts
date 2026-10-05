/**
 * Revised Harris-Benedict resting energy expenditure and daily targets.
 *
 * @module logic/calculators/nutricao/harrisBenedict
 */

import type { CalcResult, ReferenceRange, Sex } from '../../types'
import { CalcValidationError } from '../../types'
import {
  assertOneOf,
  assertOptionalFinite,
  assertRange,
} from '../../utils/validators'
import { round } from '../../utils/units'

/** Physical activity multipliers (PAL). */
export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725 | 1.9

/** Inputs for {@link calculateHarrisBenedict}. */
export interface HarrisBenedictInput {
  /** Body weight in kilograms. */
  weightKg: number
  /** Height in centimetres. */
  heightCm: number
  /** Age in whole years. */
  age: number
  /** Biological sex; selects the revised equation. */
  sex: Sex
  /** Physical activity level multiplier. */
  activityFactor: ActivityFactor
  /** Optional stress/illness multiplier, e.g. `1.3` for sepsis. Defaults to 1. */
  stressFactor?: number
}

const SEXES: readonly Sex[] = ['M', 'F']

/** The five accepted activity multipliers, for building the form's selector. */
export const ACTIVITY_FACTORS: readonly ActivityFactor[] = [
  1.2, 1.375, 1.55, 1.725, 1.9,
]

const ACTIVITY_LABELS: Record<ActivityFactor, string> = {
  1.2: 'Sedentário (pouco ou nenhum exercício)',
  1.375: 'Levemente ativo (1–3 dias/semana)',
  1.55: 'Moderadamente ativo (3–5 dias/semana)',
  1.725: 'Muito ativo (6–7 dias/semana)',
  1.9: 'Extra ativo (trabalho físico ou treino duas vezes ao dia)',
}

/** Default clinical protein target in g/kg/day. */
export const PROTEIN_G_PER_KG = 1.2

export const ENERGY_REFERENCES: ReferenceRange[] = [
  {
    label: 'TMB masculino — Harris-Benedict revisada',
    min: 1200,
    max: 2000,
    severity: 'info',
  },
  {
    label: 'TMB feminino — Harris-Benedict revisada',
    min: 1000,
    max: 1700,
    severity: 'info',
  },
]

/**
 * Calculates the revised Harris-Benedict BMR, TDEE and a protein target.
 *
 * BMR(M) = 88.362 + (13.397 × weight) + (4.799 × height) − (5.677 × age)
 * BMR(F) = 447.593 + (9.247 × weight) + (3.098 × height) − (4.330 × age)
 * TDEE   = BMR × activityFactor × stressFactor
 *
 * @param input - Weight, height, age, sex, activity and optional stress factor.
 * @returns `CalcResult` whose value is the TDEE in kcal/day, with BMR and the
 *   protein target as sub-results.
 * @throws {CalcValidationError} When weight, height or age is out of range, the
 *   sex or activity factor is unknown, or the stress factor is not positive.
 *
 * @reference Roza AM, Shizgal HM. A critical evaluation of the energy requirements for maintenance of body weight. Am J Clin Nutr. 1984;40(1):168–182.
 *
 * @example
 * calculateHarrisBenedict({
 *   weightKg: 70, heightCm: 175, age: 30, sex: 'M',
 *   activityFactor: 1.55,
 * }).value // 2768
 */
export function calculateHarrisBenedict(input: HarrisBenedictInput): CalcResult {
  const { weightKg, heightCm, age, sex, activityFactor, stressFactor = 1 } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertRange(heightCm, 50, 250, 'heightCm', 'cm')
  assertRange(age, 1, 120, 'age', 'anos')
  assertOneOf(activityFactor, ACTIVITY_FACTORS, 'activityFactor')
  assertOptionalFinite(stressFactor, 'stressFactor', '×')
  if (stressFactor < 1) {
    throw new CalcValidationError(
      'stressFactor',
      `O campo 'stressFactor' deve ser 1 ou maior. Recebido: ${stressFactor}`,
    )
  }

  const bmr =
    sex === 'M'
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age

  const tdee = bmr * activityFactor * stressFactor
  const proteinG = weightKg * PROTEIN_G_PER_KG

  return {
    label: 'Gasto Energético Diário Total',
    value: round(tdee, 0),
    unit: 'kcal/dia',
    severity: 'info',
    interpretation: `Necessidade energética estimada ${round(tdee, 0)} kcal/dia (TMB ${round(bmr, 0)} kcal/dia × atividade ${activityFactor} × estresse ${stressFactor}). Para nutrição enteral ou parenteral, alvo de proteína ${round(proteinG, 0)} g/dia a ${PROTEIN_G_PER_KG} g/kg. Ajuste ao peso corporal medido e à evolução clínica.`,
    references: ENERGY_REFERENCES,
    subResults: [
      {
        label: 'Taxa Metabólica de Repouso',
        value: round(bmr, 0),
        unit: 'kcal/dia',
        severity: 'info',
        interpretation: `Equação de Harris-Benedict revisada para ${sex === 'M' ? 'um homem' : 'uma mulher'}.`,
      },
      {
        label: 'Nível de atividade',
        value: activityFactor,
        unit: '×',
        severity: 'info',
        interpretation: ACTIVITY_LABELS[activityFactor],
      },
      {
        label: 'Alvo de proteína',
        value: round(proteinG, 0),
        unit: 'g/dia',
        severity: 'info',
        interpretation: `${PROTEIN_G_PER_KG} g/kg/dia × ${weightKg} kg.`,
      },
    ],
  }
}