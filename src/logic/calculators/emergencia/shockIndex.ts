/**
 * Shock Index — heart rate divided by systolic blood pressure.
 *
 * @module logic/calculators/emergencia/shockIndex
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateShockIndex}. */
export interface ShockIndexInput {
  /** Heart rate in beats per minute. */
  heartRate: number
  /** Systolic blood pressure in mmHg. */
  sysBp: number
}

export const SHOCK_INDEX_REFERENCES: ReferenceRange[] = [
  { label: 'Estável (< 0.6)', max: 0.59, severity: 'normal' },
  { label: 'Limítrofe (0.6–0.9)', min: 0.6, max: 0.89, severity: 'attention' },
  { label: 'Anormal (0.9–1.0)', min: 0.9, max: 0.99, severity: 'attention' },
  { label: 'Choque moderado (1.0–1.4)', min: 1, max: 1.4, severity: 'critical' },
  { label: 'Choque grave (> 1.4)', min: 1.4, severity: 'critical' },
]

/**
 * Calculates the Shock Index.
 *
 * SI = heart rate / systolic blood pressure
 *
 * @param input - Heart rate and systolic blood pressure.
 * @returns `CalcResult` whose value is the SI rounded to two decimals.
 * @throws {CalcValidationError} When the heart rate or systolic BP is outside
 *   its physiological range.
 *
 * @reference Allgöwer M, Burri C. Shock index. Dtsch Med Wochenschr. 1967;92(43):1947–1950.
 * @reference Mutschler SP, Kristensen CM, Gespe R, et al. Shock index: a simple clinical predictor of mortality in the emergency department. Ann Emerg Med. 2013;62(6):691.
 *
 * @example
 * calculateShockIndex({ heartRate: 110, sysBp: 80 }).value // 1.38
 */
export function calculateShockIndex(input: ShockIndexInput): CalcResult {
  const { heartRate, sysBp } = input

  assertRange(heartRate, 20, 250, 'heartRate', 'bpm')
  assertRange(sysBp, 40, 300, 'sysBp', 'mmHg')

  const index = heartRate / sysBp
  const rounded = round(index, 2)

  const severity =
    index < 0.6 ? 'normal' : index < 1 ? 'attention' : 'critical'
  const band =
    index < 0.6
      ? 'hemodinâmica estável'
      : index < 0.9
        ? 'limítrofe'
        : index <= 1.4
          ? 'choque moderado'
          : 'choque grave'

  return {
    label: 'Índice de Choque',
    value: rounded,
    severity,
    interpretation: `Índice de Choque ${rounded} (${heartRate} bpm / ${sysBp} mmHg) — ${band}.${
      index >= 1
        ? ' Um índice de 1.0 ou mais está associado a mortalidade marcadamente elevada e exige avaliação imediata de choque e de sua causa.'
        : ''
    }`,
    references: SHOCK_INDEX_REFERENCES,
  }
}