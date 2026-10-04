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
  1.2: 'Sedentary (little or no exercise)',
  1.375: 'Lightly active (1–3 days/week)',
  1.55: 'Moderately active (3–5 days/week)',
  1.725: 'Very active (6–7 days/week)',
  1.9: 'Extra active (physical job or twice daily)',
}

/** Default clinical protein target in g/kg/day. */
export const PROTEIN_G_PER_KG = 1.2

export const ENERGY_REFERENCES: ReferenceRange[] = [
  {
    label: 'Male BMR — revised Harris-Benedict',
    min: 1200,
    max: 2000,
    severity: 'info',
  },
  {
    label: 'Female BMR — revised Harris-Benedict',
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
  assertRange(age, 1, 120, 'age', 'years')
  assertOneOf(activityFactor, ACTIVITY_FACTORS, 'activityFactor')
  assertOptionalFinite(stressFactor, 'stressFactor', '×')
  if (stressFactor < 1) {
    throw new CalcValidationError(
      'stressFactor',
      `Field 'stressFactor' must be 1 or greater. Received: ${stressFactor}`,
    )
  }

  const bmr =
    sex === 'M'
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age

  const tdee = bmr * activityFactor * stressFactor
  const proteinG = weightKg * PROTEIN_G_PER_KG

  return {
    label: 'Total Daily Energy Expenditure',
    value: round(tdee, 0),
    unit: 'kcal/day',
    severity: 'info',
    interpretation: `Estimated energy requirement ${round(tdee, 0)} kcal/day (BMR ${round(bmr, 0)} kcal/day × activity ${activityFactor} × stress ${stressFactor}). For enteral or parenteral nutrition, protein target ${round(proteinG, 0)} g/day at ${PROTEIN_G_PER_KG} g/kg. Adjust to measured body weight and to the clinical course.`,
    references: ENERGY_REFERENCES,
    subResults: [
      {
        label: 'Resting Metabolic Rate',
        value: round(bmr, 0),
        unit: 'kcal/day',
        severity: 'info',
        interpretation: `Revised Harris-Benedict equation for a ${sex === 'M' ? 'male' : 'female'}.`,
      },
      {
        label: 'Activity Level',
        value: activityFactor,
        unit: '×',
        severity: 'info',
        interpretation: ACTIVITY_LABELS[activityFactor],
      },
      {
        label: 'Protein Target',
        value: round(proteinG, 0),
        unit: 'g/day',
        severity: 'info',
        interpretation: `${PROTEIN_G_PER_KG} g/kg/day × ${weightKg} kg.`,
      },
    ],
  }
}