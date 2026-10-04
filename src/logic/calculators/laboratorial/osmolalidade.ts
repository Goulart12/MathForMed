/**
 * Plasma osmolality and the osmolal gap.
 *
 * @module logic/calculators/laboratorial/osmolalidade
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertOptionalFinite, assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateOsmolality}. */
export interface OsmolalityInput {
  /** Serum sodium in mEq/L. */
  sodium: number
  /** Serum glucose in mg/dL. */
  glucoseMgDl: number
  /** Blood urea nitrogen in mg/dL. */
  bunMgDl: number
  /** Laboratory-measured osmolality in mOsm/kg. Optional. */
  measuredOsmolality?: number | null
}

/** Divisors converting mg/dL to mmol/L for glucose and urea. */
export const GLUCOSE_DIVISOR = 18
export const UREA_DIVISOR = 2.8

/** Osmolal gap above which unmeasured osmoles are suspected. */
export const OSMOL_GAP_THRESHOLD = 10

export const OSMOLALITY_REFERENCES: ReferenceRange[] = [
  { label: 'Hypotonic (< 275 mOsm/kg)', max: 275, severity: 'attention' },
  { label: 'Normal (275–295 mOsm/kg)', min: 275, max: 295, severity: 'normal' },
  { label: 'Hypertonic (> 295 mOsm/kg)', min: 295, severity: 'attention' },
]

export const OSMOL_GAP_REFERENCES: ReferenceRange[] = [
  { label: 'Normal gap (< 10 mOsm/kg)', max: 9.9, severity: 'normal' },
  { label: 'Elevated gap (≥ 10 mOsm/kg)', min: 10, severity: 'critical' },
]

/**
 * Calculates plasma osmolality.
 *
 * calculated = (2 × Na) + (glucose / 18) + (BUN / 2.8)
 *
 * @param input - Sodium, glucose, BUN and an optional measured osmolality.
 * @returns `CalcResult` whose value is the calculated osmolality in mOsm/kg,
 *   with the osmolal gap as a sub-result when a measured value is supplied.
 * @throws {CalcValidationError} When any analyte or the measured osmolality is
 *   outside its physiological range.
 *
 * @reference Bhagat CI, Das BS, Srivastava LM. Serum osmolality: a simple index of diabetic ketoacidosis. Clin Chem. 1984;30(10):1706–1708.
 *
 * @example
 * calculateOsmolality({ sodium: 140, glucoseMgDl: 100, bunMgDl: 20 }).value // 291.4
 */
export function calculateOsmolality(input: OsmolalityInput): CalcResult {
  const { sodium, glucoseMgDl, bunMgDl, measuredOsmolality } = input

  assertRange(sodium, 100, 190, 'sodium', 'mEq/L')
  assertRange(glucoseMgDl, 20, 1000, 'glucoseMgDl', 'mg/dL')
  assertRange(bunMgDl, 1, 150, 'bunMgDl', 'mg/dL')
  assertOptionalFinite(measuredOsmolality, 'measuredOsmolality', 'mOsm/kg')
  if (measuredOsmolality !== null && measuredOsmolality !== undefined) {
    assertRange(measuredOsmolality, 200, 400, 'measuredOsmolality', 'mOsm/kg')
  }

  const calculated =
    2 * sodium + glucoseMgDl / GLUCOSE_DIVISOR + bunMgDl / UREA_DIVISOR
  const rounded = round(calculated, 1)

  let severity: Severity = 'normal'
  let interpretation = `Calculated osmolality ${rounded} mOsm/kg — within the reference range of 275 to 295 mOsm/kg.`

  if (rounded < 275) {
    severity = 'attention'
    interpretation = `Calculated osmolality ${rounded} mOsm/kg — hypotonic (< 275 mOsm/kg), a free-water excess relative to solutes.`
  } else if (rounded > 295) {
    severity = 'attention'
    interpretation = `Calculated osmolality ${rounded} mOsm/kg — hypertonic (> 295 mOsm/kg), reflecting an excess of effective solutes.`
  }

  const subResults: CalcResult[] = [
    {
      label: 'Sodium Contribution',
      value: round(2 * sodium, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `2 × ${sodium} mEq/L.`,
    },
    {
      label: 'Glucose Contribution',
      value: round(glucoseMgDl / GLUCOSE_DIVISOR, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `${glucoseMgDl} mg/dL ÷ ${GLUCOSE_DIVISOR}.`,
    },
    {
      label: 'Urea Contribution',
      value: round(bunMgDl / UREA_DIVISOR, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `${bunMgDl} mg/dL BUN ÷ ${UREA_DIVISOR}.`,
    },
  ]

  if (measuredOsmolality != null) {
    const gap = measuredOsmolality - calculated
    const roundedGap = round(gap, 1)
    const gapCritical = roundedGap >= OSMOL_GAP_THRESHOLD

    if (gapCritical) severity = 'critical'

    subResults.push({
      label: 'Osmolal Gap',
      value: roundedGap,
      unit: 'mOsm/kg',
      severity: gapCritical ? 'critical' : 'normal',
      interpretation: gapCritical
        ? `Measured ${measuredOsmolality} − calculated ${rounded} = ${roundedGap} mOsm/kg. A gap of 10 mOsm/kg or more indicates unmeasured osmoles: suspect ethanol, methanol or ethylene glycol poisoning.`
        : `Measured ${measuredOsmolality} − calculated ${rounded} = ${roundedGap} mOsm/kg, below the 10 mOsm/kg threshold.`,
    })

    if (gapCritical) {
      interpretation = `Calculated osmolality ${rounded} mOsm/kg with an osmolal gap of ${roundedGap} mOsm/kg — suspect an unmeasured osmole such as ethanol, methanol or ethylene glycol.`
    }
  }

  return {
    label: 'Serum Osmolality',
    value: rounded,
    unit: 'mOsm/kg',
    severity,
    interpretation,
    references: OSMOLALITY_REFERENCES,
    subResults,
  }
}