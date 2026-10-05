/**
 * Weight-based dose conversion: order (mg/kg) → total dose → volume to draw.
 *
 * @module logic/calculators/medicacao/dosePorPeso
 */

import type { CalcResult, Severity } from '../../types'
import { assertOneOf, assertPositive, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Dose denominators accepted by this calculator. */
export type UnitDoseUnit = 'mg/kg' | 'mcg/kg' | 'IU/kg'

/** Inputs for {@link calculateDoseByWeight}. */
export interface DoseByWeightInput {
  /** Prescribed dose per kilogram. */
  unitDose: number
  /** Denominator of `unitDose`. */
  unitDoseUnit: UnitDoseUnit
  /** Patient weight used for the calculation. */
  weightKg: number
  /** Strength of the available presentation, e.g. `10` for a 10 mg/mL vial. */
  concentrationPerMl: number
  /** Total volume available in the presentation, in millilitres. */
  availableVolumeMl: number
}

const UNIT_DOSE_UNITS: readonly UnitDoseUnit[] = ['mg/kg', 'mcg/kg', 'IU/kg']

/** Base unit for each denominator. */
const BASE_UNITS: Record<UnitDoseUnit, string> = {
  'mg/kg': 'mg',
  'mcg/kg': 'mcg',
  'IU/kg': 'IU',
}

/** Decimal places for the total dose; international units are whole numbers. */
const DOSE_DECIMALS: Record<UnitDoseUnit, number> = {
  'mg/kg': 1,
  'mcg/kg': 1,
  'IU/kg': 0,
}

/**
 * Converts a per-kilogram order into the volume to withdraw.
 *
 * totalDose    = unitDose × weight
 * volumeNeeded = totalDose / concentrationPerMl
 *
 * @param input - Prescription, weight, presentation strength and available volume.
 * @returns `CalcResult` whose value is the volume to draw in millilitres, with
 *   the total dose as a sub-result. `severity` is `critical` when the required
 *   volume exceeds the volume actually available in the presentation.
 * @throws {CalcValidationError} When the weight is outside 0.5–300 kg, the unit
 *   dose or concentration is not positive, or the denominator is unknown.
 *
 * @reference Brunton LL, Knollmann BC. Goodman & Gilman’s The Pharmacological Basis of Therapeutics. 14th ed. McGraw Hill; 2023.
 *
 * @example
 * calculateDoseByWeight({
 *   unitDose: 15, unitDoseUnit: 'mg/kg', weightKg: 20,
 *   concentrationPerMl: 50, availableVolumeMl: 10,
 * }).value // 6
 */
export function calculateDoseByWeight(input: DoseByWeightInput): CalcResult {
  const { unitDose, unitDoseUnit, weightKg, concentrationPerMl, availableVolumeMl } = input

  assertOneOf(unitDoseUnit, UNIT_DOSE_UNITS, 'unitDoseUnit')
  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertPositive(unitDose, 'unitDose', unitDoseUnit)
  assertPositive(concentrationPerMl, 'concentrationPerMl', 'mg/mL')
  assertPositive(availableVolumeMl, 'availableVolumeMl', 'mL')

  const baseUnit = BASE_UNITS[unitDoseUnit]
  const totalDose = unitDose * weightKg
  const volumeNeeded = totalDose / concentrationPerMl

  const exceedsPresentation = volumeNeeded > availableVolumeMl
  const severity: Severity = exceedsPresentation ? 'critical' : 'info'

  const doseText = round(totalDose, DOSE_DECIMALS[unitDoseUnit])
  const volumeText = round(volumeNeeded, 1)

  return {
    label: 'Dose necessária',
    value: volumeText,
    unit: 'mL',
    severity,
    interpretation: `Dose total: ${doseText} ${baseUnit} (${unitDose} ${unitDoseUnit} × ${weightKg} kg). ${
      exceedsPresentation
        ? `Este cálculo exige ${volumeText} mL, mas há apenas ${availableVolumeMl} mL disponíveis — a prescrição não pode ser atendida com uma única apresentação.`
        : `Aspire ${volumeText} mL da solução disponível.`
    }`,
    subResults: [
      {
        label: 'Dose total',
        value: doseText,
        unit: baseUnit,
        severity: 'info',
        interpretation: `${unitDose} ${unitDoseUnit} × ${weightKg} kg = ${doseText} ${baseUnit}.`,
      },
      {
        label: 'Volume disponível',
        value: round(availableVolumeMl, 1),
        unit: 'mL',
        severity: exceedsPresentation ? 'critical' : 'info',
        interpretation: exceedsPresentation
          ? 'Volume insuficiente na apresentação para esta dose.'
          : 'Volume suficiente na apresentação para esta dose.',
      },
    ],
  }
}