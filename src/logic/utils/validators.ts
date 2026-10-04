/**
 * Input validators shared by every calculator.
 *
 * All validators throw {@link CalcValidationError}; none of them return a
 * boolean, which makes it impossible to forget to check a return value.
 *
 * @module logic/utils/validators
 */

import { CalcValidationError } from '../types'

/**
 * Throws {@link CalcValidationError} if `value` is not a finite number or falls
 * outside the inclusive range `[min, max]`.
 *
 * @param value - Value to validate.
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound.
 * @param field - Input field name, surfaced on the error for UI field mapping.
 * @param unit - Unit of measure, interpolated into the error message.
 * @throws {CalcValidationError} When the value is not finite or is out of range.
 *
 * @example
 * assertRange(1.78, 0.3, 2.5, 'heightM', 'm')
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  field: string,
  unit: string,
): void {
  assertFinite(value, field, unit)

  if (value < min || value > max) {
    throw new CalcValidationError(
      field,
      `Field '${field}' must be between ${min} and ${max} ${unit}. Received: ${value}`,
    )
  }
}

/**
 * Throws {@link CalcValidationError} when `value` is `NaN`, `Infinity` or
 * `-Infinity`. Guards against empty numeric inputs reaching a formula.
 *
 * @param value - Value to validate.
 * @param field - Input field name.
 * @param unit - Unit of measure, interpolated into the error message.
 * @throws {CalcValidationError} When the value is not a finite number.
 */
export function assertFinite(value: number, field: string, unit = ''): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CalcValidationError(
      field,
      `Field '${field}' must be a finite number${unit ? ` in ${unit}` : ''}. Received: ${String(value)}`,
    )
  }
}

/**
 * Throws {@link CalcValidationError} unless `value > 0`.
 *
 * @param value - Value to validate.
 * @param field - Input field name.
 * @param unit - Unit of measure, interpolated into the error message.
 * @param min - Exclusive lower bound. Defaults to `0`.
 * @throws {CalcValidationError} When the value is not greater than `min`.
 *
 * @example
 * assertPositive(5, 'concentrationPerMl', 'mg/mL')
 */
export function assertPositive(
  value: number,
  field: string,
  unit = '',
  min = 0,
): void {
  assertFinite(value, field, unit)

  if (value <= min) {
    throw new CalcValidationError(
      field,
      `Field '${field}' must be greater than ${min}${unit ? ` ${unit}` : ''}. Received: ${value}`,
    )
  }
}

/**
 * Throws {@link CalcValidationError} unless `value` is one of `allowed`.
 *
 * @param value - Value to validate.
 * @param allowed - Permitted values.
 * @param field - Input field name.
 * @throws {CalcValidationError} When the value is not in `allowed`.
 */
export function assertOneOf<T extends string | number>(
  value: T,
  allowed: readonly T[],
  field: string,
): void {
  if (!allowed.includes(value)) {
    throw new CalcValidationError(
      field,
      `Field '${field}' must be one of: ${allowed.join(', ')}. Received: ${String(value)}`,
    )
  }
}

/**
 * Throws {@link CalcValidationError} when a required input is `null` or `undefined`.
 *
 * Optional inputs should be validated with {@link assertOptionalFinite} instead.
 *
 * @param value - Value to validate.
 * @param field - Input field name.
 * @throws {CalcValidationError} When the value is absent.
 */
export function assertDefined<T>(value: T, field: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new CalcValidationError(field, `Field '${field}' is required.`)
  }
}

/**
 * Validates an optional numeric input, tolerating `null`/`undefined`.
 *
 * @param value - Value to validate.
 * @param field - Input field name.
 * @param unit - Unit of measure, interpolated into the error message.
 * @throws {CalcValidationError} When the value is present but not finite.
 */
export function assertOptionalFinite(
  value: number | null | undefined,
  field: string,
  unit = '',
): void {
  if (value === null || value === undefined) return
  assertFinite(value, field, unit)
}