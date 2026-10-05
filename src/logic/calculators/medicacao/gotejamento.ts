/**
 * IV drip rate in drops per minute and mL/h.
 *
 * @module logic/calculators/medicacao/gotejamento
 */

import type { CalcResult } from '../../types'
import { assertOneOf, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Tubing type. `macro` = adult primary set (20 gtt/mL), `micro` = burette (60 gtt/mL). */
export type TubingType = 'macro' | 'micro'

/** Inputs for {@link calculateDripRate}. */
export interface DripRateInput {
  /** Volume to be infused, in millilitres. */
  volumeMl: number
  /** Duration of the infusion, in minutes. */
  timeMins: number
  /** Tubing drop factor. */
  tubingType: TubingType
}

const TUBING_TYPES: readonly TubingType[] = ['macro', 'micro']

/** Standard drop factors in drops per millilitre. */
export const DROP_FACTOR: Record<TubingType, 20 | 60> = { macro: 20, micro: 60 }

const TUBING_LABELS: Record<TubingType, string> = {
  macro: 'macrogotejamento (20 gtt/mL)',
  micro: 'microgotejamento (60 gtt/mL)',
}

/**
 * Calculates the drip rate for a volume, time and tubing type.
 *
 * dropsPerMin = (volume × dropFactor) / time
 * mlPerHour   = (volume / time) × 60
 *
 * @param input - Volume, duration and tubing type.
 * @returns `CalcResult` whose value is the rate rounded to whole drops/min,
 *   with the mL/h flow rate as a sub-result.
 * @throws {CalcValidationError} When the volume or time is outside its range,
 *   or the tubing type is unknown.
 *
 * @reference Infusion Nurses Society. Infusion Therapy Standards of Practice. J Infus Nurs. 2021;44(1S):S1–S225.
 *
 * @example
 * calculateDripRate({ volumeMl: 500, timeMins: 240, tubingType: 'macro' }).value // 42
 */
export function calculateDripRate(input: DripRateInput): CalcResult {
  const { volumeMl, timeMins, tubingType } = input

  assertOneOf(tubingType, TUBING_TYPES, 'tubingType')
  assertRange(volumeMl, 1, 5000, 'volumeMl', 'mL')
  assertRange(timeMins, 1, 10080, 'timeMins', 'min')

  const dropFactor = DROP_FACTOR[tubingType]
  const dropsPerMin = Math.round((volumeMl * dropFactor) / timeMins)
  const mlPerHour = round((volumeMl / timeMins) * 60, 1)

  return {
    label: 'Velocidade de gotejamento',
    value: dropsPerMin,
    unit: 'gtt/min',
    severity: 'info',
    interpretation: `Ajuste a infusão em ${dropsPerMin} gtt/min usando ${TUBING_LABELS[tubingType]} para infundir ${volumeMl} mL em ${round(timeMins / 60, 1)} h.`,
    subResults: [
      {
        label: 'Vazão',
        value: mlPerHour,
        unit: 'mL/h',
        severity: 'info',
        interpretation: `${volumeMl} mL em ${timeMins} min equivalem a ${mlPerHour} mL/h.`,
      },
      {
        label: 'Fator de gotejamento',
        value: dropFactor,
        unit: 'gtt/mL',
        severity: 'info',
        interpretation: `Tipo de equipo: ${TUBING_LABELS[tubingType]}.`,
      },
    ],
  }
}