/**
 * Paediatric maintenance fluid requirement — the Holliday-Segar 4-2-1 rule.
 *
 * @module logic/calculators/nutricao/hollidaySegar
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateHollidaySegar}. */
export interface HollidaySegarInput {
  /** Body weight in kilograms. */
  weightKg: number
}

/** Maintenance fluid ceiling, in mL/day. */
export const MAX_ML_PER_DAY = 2500

export const HOLLIDAY_SEGAR_REFERENCES: ReferenceRange[] = [
  { label: 'Primeiros 10 kg: 4 mL/kg/h', min: 0.5, max: 10, severity: 'info' },
  { label: 'Próximos 10 kg: 2 mL/kg/h', min: 10, max: 20, severity: 'info' },
  { label: 'Acima de 20 kg: 1 mL/kg/h', min: 20, max: 100, severity: 'info' },
]

/**
 * Calculates maintenance fluid with the Holliday-Segar 4-2-1 rule.
 *
 * weight ≤ 10 kg : 4 mL/kg/h
 * 10 < weight ≤ 20 kg : 40 + 2 × (weight − 10) mL/h
 * weight > 20 kg : 60 + 1 × (weight − 20) mL/h
 *
 * The daily volume is capped at 2500 mL/day because the 4-2-1 rule
 * overestimates needs in children above about 30 kg; beyond that the
 * Holliday-Segar daily formula (100/50/20 mL/kg/day) gives a smaller figure.
 *
 * @param input - Body weight in kilograms.
 * @returns `CalcResult` whose value is the maintenance rate in mL/h, with the
 *   capped daily volume and the applicable rule as sub-results.
 * @throws {CalcValidationError} When the weight is outside 0.5–100 kg.
 *
 * @reference Holliday MA, Segar WE. Maintenance fluid therapy. Pediatrics. 1957;19(5):823–832.
 * @reference NICE IV fluid prescribing guideline. NG29. 2017.
 *
 * @example
 * calculateHollidaySegar({ weightKg: 14 }).value // 48
 */
export function calculateHollidaySegar(input: HollidaySegarInput): CalcResult {
  const { weightKg } = input

  assertRange(weightKg, 0.5, 100, 'weightKg', 'kg')

  const mlPerHour =
    weightKg <= 10
      ? 4 * weightKg
      : weightKg <= 20
        ? 40 + 2 * (weightKg - 10)
        : 60 + (weightKg - 20)

  const uncappedPerDay = mlPerHour * 24
  const capped = uncappedPerDay > MAX_ML_PER_DAY
  const mlPerDay = Math.min(uncappedPerDay, MAX_ML_PER_DAY)

  const rule =
    weightKg <= 10
      ? 'primeiros 10 kg a 4 mL/kg/h'
      : weightKg <= 20
        ? 'primeiros 10 kg a 4 mL/kg/h mais os próximos 10 kg a 2 mL/kg/h'
        : 'primeiros 10 kg a 4 mL/kg/h, próximos 10 kg a 2 mL/kg/h e o restante a 1 mL/kg/h'

  return {
    label: 'Taxa de manutenção de líquidos',
    value: round(mlPerHour, 1),
    unit: 'mL/h',
    severity: 'info',
    interpretation: `Manutenção de líquidos ${round(mlPerHour, 1)} mL/h (${mlPerHour} mL/h pela regra 4-2-1: ${rule}), equivalente a ${mlPerDay} mL/dia. Exclua deste valor as perdas insensíveis, a reposição do déficit e quaisquer perdas em curso, e reduza-o na insuficiência cardíaca ou na falência renal.`,
    references: HOLLIDAY_SEGAR_REFERENCES,
    subResults: [
      {
        label: 'Volume diário',
        value: mlPerDay,
        unit: 'mL/dia',
        severity: 'info',
        interpretation: capped
          ? `A regra 4-2-1 daria ${round(uncappedPerDay, 0)} mL/dia; valor limitado a ${MAX_ML_PER_DAY} mL/dia porque a regra horária superestima as necessidades acima de cerca de 30 kg.`
          : `${round(mlPerHour, 1)} mL/h × 24 h.`,
      },
    ],
  }
}