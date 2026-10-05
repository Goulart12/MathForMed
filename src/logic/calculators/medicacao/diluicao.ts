/**
 * Dilution via C₁·V₁ = C₂·V₂.
 *
 * @module logic/calculators/medicacao/diluicao
 */

import type { CalcResult } from '../../types'
import { CalcValidationError } from '../../types'
import { assertPositive } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateDilution}. */
export interface DilutionInput {
  /** Strength of the stock presentation, in any consistent unit. */
  initialConcentration: number
  /** Volume drawn from the stock presentation, in millilitres. */
  initialVolumeMl: number
  /** Target concentration, in the same unit as `initialConcentration`. */
  finalConcentration: number
}

/**
 * Calculates the final and solvent volumes needed to dilute a stock solution.
 *
 * finalVolume   = (C₁ × V₁) / C₂
 * solventVolume = finalVolume − V₁
 *
 * @param input - Stock concentration, drawn volume and target concentration.
 *   All concentrations must share the same unit.
 * @returns `CalcResult` whose value is the volume of diluent to add in
 *   millilitres, with the final volume as a sub-result.
 * @throws {CalcValidationError} When any concentration or volume is not
 *   positive, or when the target concentration is not lower than the stock
 *   concentration (this calculator dilutes, it does not concentrate).
 *
 * @reference Trissel LA. Handbook on Injectable Drugs. 18th ed. Bethesda: ASHP; 2008.
 *
 * @example
 * calculateDilution({
 *   initialConcentration: 100, initialVolumeMl: 2, finalConcentration: 10,
 * }).value // 18
 */
export function calculateDilution(input: DilutionInput): CalcResult {
  const { initialConcentration, initialVolumeMl, finalConcentration } = input

  assertPositive(initialConcentration, 'initialConcentration', 'per mL')
  assertPositive(initialVolumeMl, 'initialVolumeMl', 'mL')
  assertPositive(finalConcentration, 'finalConcentration', 'per mL')

  if (finalConcentration >= initialConcentration) {
    throw new CalcValidationError(
      'finalConcentration',
      `Field 'finalConcentration' must be lower than the stock concentration ${initialConcentration} — this calculator dilutes, it does not concentrate.`,
    )
  }

  const finalVolume = (initialConcentration * initialVolumeMl) / finalConcentration
  const solventVolume = finalVolume - initialVolumeMl

  return {
    label: 'Diluent Volume',
    value: round(solventVolume, 1),
    unit: 'mL',
    severity: 'info',
    interpretation: `Withdraw ${initialVolumeMl} mL of the stock solution and add ${round(solventVolume, 1)} mL of diluent to obtain ${round(finalVolume, 1)} mL at the target concentration.`,
    subResults: [
      {
        label: 'Final Volume',
        value: round(finalVolume, 1),
        unit: 'mL',
        severity: 'info',
        interpretation: `(${initialConcentration} × ${initialVolumeMl} mL) ÷ ${finalConcentration} = ${round(finalVolume, 1)} mL.`,
      },
      {
        label: 'Stock Volume',
        value: round(initialVolumeMl, 1),
        unit: 'mL',
        severity: 'info',
        interpretation: 'Volume taken from the stock presentation.',
      },
    ],
  }
}