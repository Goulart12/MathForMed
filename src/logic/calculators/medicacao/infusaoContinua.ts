/**
 * Continuous infusion pump rate for mcg/kg/min orders.
 *
 * @module logic/calculators/medicacao/infusaoContinua
 */

import type { CalcResult } from '../../types'
import { assertPositive, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateInfusionRate}. */
export interface ContinuousInfusionInput {
  /** Ordered dose in micrograms per kilogram per minute. */
  doseMcgKgMin: number
  /** Patient weight in kilograms. */
  weightKg: number
  /** Strength of the infusion solution in micrograms per millilitre. */
  concentrationMcgMl: number
}

/**
 * Calculates the pump rate in mL/h.
 *
 * rate (mL/h) = (dose_mcg_kg_min × weight_kg × 60) / concentration_mcg_mL
 *
 * @param input - Dose, weight and solution strength.
 * @returns `CalcResult` whose value is the pump rate in mL/h rounded to one
 *   decimal, with the total daily dose as a sub-result.
 * @throws {CalcValidationError} When the dose is outside 0.001–1000 mcg/kg/min,
 *   the weight outside 0.5–300 kg, or the concentration is not positive.
 *
 * @reference Lexicomp Online. Drug Information. Wolters Kluwer Health; 2024. (UpToDate).
 *
 * @example
 * calculateInfusionRate({
 *   doseMcgKgMin: 0.05, weightKg: 70, concentrationMcgMl: 1600,
 * }).value // 0.1
 */
export function calculateInfusionRate(input: ContinuousInfusionInput): CalcResult {
  const { doseMcgKgMin, weightKg, concentrationMcgMl } = input

  assertRange(doseMcgKgMin, 0.001, 1000, 'doseMcgKgMin', 'mcg/kg/min')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertPositive(concentrationMcgMl, 'concentrationMcgMl', 'mcg/mL')

  const rateMlH = (doseMcgKgMin * weightKg * 60) / concentrationMcgMl
  const dailyDoseMcg = doseMcgKgMin * weightKg * 60 * 24

  return {
    label: 'Taxa de infusão',
    value: round(rateMlH, 1),
    unit: 'mL/h',
    severity: 'info',
    interpretation: `Ajuste a bomba em ${round(rateMlH, 1)} mL/h para administrar ${doseMcgKgMin} mcg/kg/min a um paciente de ${weightKg} kg (${round(dailyDoseMcg / 1000, 1)} mg/dia).`,
    subResults: [
      {
        label: 'Dose diária',
        value: round(dailyDoseMcg / 1000, 2),
        unit: 'mg/dia',
        severity: 'info',
        interpretation: `${doseMcgKgMin} mcg/kg/min × ${weightKg} kg × 1440 min = ${round(dailyDoseMcg / 1000, 2)} mg/dia.`,
      },
      {
        label: 'Dose por minuto',
        value: round(doseMcgKgMin * weightKg, 2),
        unit: 'mcg/min',
        severity: 'info',
        interpretation: `Dose absoluta administrada a cada minuto.`,
      },
    ],
  }
}