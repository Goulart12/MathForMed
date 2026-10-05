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
  { label: 'Hipoosmolar (< 275 mOsm/kg)', max: 275, severity: 'attention' },
  { label: 'Normal (275–295 mOsm/kg)', min: 275, max: 295, severity: 'normal' },
  { label: 'Hiperosmolar (> 295 mOsm/kg)', min: 295, severity: 'attention' },
]

export const OSMOL_GAP_REFERENCES: ReferenceRange[] = [
  { label: 'Gap normal (< 10 mOsm/kg)', max: 9.9, severity: 'normal' },
  { label: 'Gap elevado (≥ 10 mOsm/kg)', min: 10, severity: 'critical' },
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
  let interpretation = `Osmolalidade calculada ${rounded} mOsm/kg — dentro do intervalo de referência de 275 a 295 mOsm/kg.`

  if (rounded < 275) {
    severity = 'attention'
    interpretation = `Osmolalidade calculada ${rounded} mOsm/kg — hiposmolar (< 275 mOsm/kg), com excesso de água livre em relação aos solutos.`
  } else if (rounded > 295) {
    severity = 'attention'
    interpretation = `Osmolalidade calculada ${rounded} mOsm/kg — hiperosmolar (> 295 mOsm/kg), refletindo excesso de solutos eficazes.`
  }

  const subResults: CalcResult[] = [
    {
      label: 'Contribuição do sódio',
      value: round(2 * sodium, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `2 × ${sodium} mEq/L.`,
    },
    {
      label: 'Contribuição da glicose',
      value: round(glucoseMgDl / GLUCOSE_DIVISOR, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `${glucoseMgDl} mg/dL ÷ ${GLUCOSE_DIVISOR}.`,
    },
    {
      label: 'Contribuição da ureia',
      value: round(bunMgDl / UREA_DIVISOR, 1),
      unit: 'mOsm/kg',
      severity: 'info',
      interpretation: `${bunMgDl} mg/dL de ureia ÷ ${UREA_DIVISOR}.`,
    },
  ]

  if (measuredOsmolality != null) {
    const gap = measuredOsmolality - calculated
    const roundedGap = round(gap, 1)
    const gapCritical = roundedGap >= OSMOL_GAP_THRESHOLD

    if (gapCritical) severity = 'critical'

    subResults.push({
      label: 'Gap Osmolal',
      value: roundedGap,
      unit: 'mOsm/kg',
      severity: gapCritical ? 'critical' : 'normal',
      interpretation: gapCritical
        ? `Medido ${measuredOsmolality} − calculado ${rounded} = ${roundedGap} mOsm/kg. Um gap de 10 mOsm/kg ou mais indica osmoles não medidos: suspeite de intoxicação por etanol, metanol ou etilenoglicol.`
        : `Medido ${measuredOsmolality} − calculado ${rounded} = ${roundedGap} mOsm/kg, abaixo do limiar de 10 mOsm/kg.`,
    })

    if (gapCritical) {
      interpretation = `Osmolalidade calculada ${rounded} mOsm/kg com gap osmolal de ${roundedGap} mOsm/kg — suspeite de um osmole não medido, como etanol, metanol ou etilenoglicol.`
    }
  }

  return {
    label: 'Osmolalidade plasmática',
    value: rounded,
    unit: 'mOsm/kg',
    severity,
    interpretation,
    references: OSMOLALITY_REFERENCES,
    subResults,
  }
}