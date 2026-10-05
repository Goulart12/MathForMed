/**
 * Unit conversions and molar masses.
 *
 * Every function here is pure and free of side effects.
 *
 * @module logic/utils/units
 */

/**
 * Molar masses (g/mol) of the analytes used by the unit converters.
 *
 * @reference IUPAC. Atomic Weights of the Elements.
 */
export const MOLAR_MASS = {
  glucose: 180.16,
  urea: 60.06,
} as const

/**
 * Converts a mass concentration from mg/dL to mmol/L.
 *
 * @param v - Concentration in mg/dL.
 * @param mm - Molar mass in g/mol (use {@link MOLAR_MASS}).
 * @returns Concentration in mmol/L.
 *
 * @example
 * mgDlToMmolL(100, MOLAR_MASS.glucose) // 5.55
 */
export const mgDlToMmolL = (v: number, mm: number): number => (v / mm) * 10

/**
 * Converts a mass concentration from mmol/L to mg/dL.
 *
 * @param v - Concentration in mmol/L.
 * @param mm - Molar mass in g/mol (use {@link MOLAR_MASS}).
 * @returns Concentration in mg/dL.
 *
 * @example
 * mmolLToMgDl(5.55, MOLAR_MASS.glucose) // 100
 */
export const mmolLToMgDl = (v: number, mm: number): number => (v * mm) / 10

/**
 * Converts an infusion rate from mL/h to drops/min.
 *
 * @param mlH - Rate in mL/h.
 * @param factor - Drop factor: `20` for macrodrip, `60` for microdrip.
 * @returns Rate in drops/min.
 *
 * @reference Infusion Nurses Society. Infusion Therapy Standards of Practice. 2021.
 */
export const mlHToDropsMin = (mlH: number, factor: 20 | 60): number =>
  (mlH * factor) / 60

/**
 * Converts an infusion rate from drops/min to mL/h.
 *
 * @param drops - Rate in drops/min.
 * @param factor - Drop factor: `20` for macrodrip, `60` for microdrip.
 * @returns Rate in mL/h.
 *
 * @reference Infusion Nurses Society. Infusion Therapy Standards of Practice. 2021.
 */
export const dropsMinToMlH = (drops: number, factor: 20 | 60): number =>
  (drops / factor) * 60

/** Converts kilograms to pounds. */
export const kgToLb = (kg: number): number => kg * 2.20462

/** Converts pounds to kilograms. */
export const lbToKg = (lb: number): number => lb / 2.20462

/** Converts centimetres to metres. */
export const cmToM = (cm: number): number => cm / 100

/**
 * Rounds to a fixed number of decimals without floating-point drift.
 *
 * @param value - Value to round.
 * @param decimals - Number of decimal places. Defaults to `1`.
 */
export const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Truncates a float to `decimals` places without rounding, used where a value
 * must never be rounded *up* (e.g. a volume to withdraw).
 *
 * @param value - Value to truncate.
 * @param decimals - Number of decimal places. Defaults to `1`.
 */
export const truncate = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals
  return Math.trunc(value * factor) / factor
}