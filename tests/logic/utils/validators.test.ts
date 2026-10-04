import { describe, expect, it } from 'vitest'
import { CalcValidationError } from '@/logic/types'
import {
  assertDefined,
  assertFinite,
  assertOneOf,
  assertOptionalFinite,
  assertPositive,
  assertRange,
} from '@/logic/utils/validators'

const FIELD = 'weightKg'
const UNIT = 'kg'

describe('assertRange', () => {
  it('accepts values inside the range, including both boundaries', () => {
    expect(() => assertRange(0.5, 0.5, 300, FIELD, UNIT)).not.toThrow()
    expect(() => assertRange(300, 0.5, 300, FIELD, UNIT)).not.toThrow()
    expect(() => assertRange(70, 0.5, 300, FIELD, UNIT)).not.toThrow()
  })

  it('throws below the lower bound', () => {
    expect(() => assertRange(0.4, 0.5, 300, FIELD, UNIT)).toThrow(CalcValidationError)
  })

  it('throws above the upper bound', () => {
    expect(() => assertRange(300.1, 0.5, 300, FIELD, UNIT)).toThrow(CalcValidationError)
  })

  it('reports the offending field name and received value', () => {
    try {
      assertRange(999, 0.5, 300, FIELD, UNIT)
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(CalcValidationError)
      expect((error as CalcValidationError).field).toBe(FIELD)
      expect((error as CalcValidationError).name).toBe('CalcValidationError')
      expect((error as Error).message).toContain('weightKg')
      expect((error as Error).message).toContain('999')
    }
  })

  it('boundary: exactly 18.5 and 25 are both inside a BMI-style range', () => {
    expect(() => assertRange(18.5, 18.5, 25, 'bmi', 'kg/m²')).not.toThrow()
    expect(() => assertRange(25, 18.5, 25, 'bmi', 'kg/m²')).not.toThrow()
    expect(() => assertRange(18.49, 18.5, 25, 'bmi', 'kg/m²')).toThrow(CalcValidationError)
  })

  it('rejects NaN and Infinity as non-finite', () => {
    expect(() => assertRange(Number.NaN, 0.5, 300, FIELD, UNIT)).toThrow(CalcValidationError)
    expect(() => assertRange(Number.POSITIVE_INFINITY, 0.5, 300, FIELD, UNIT)).toThrow(
      CalcValidationError,
    )
  })
})

describe('assertFinite', () => {
  it('accepts finite numbers with and without a unit', () => {
    expect(() => assertFinite(1.5, 'rate', 'mL/h')).not.toThrow()
    expect(() => assertFinite(1.5, 'rate')).not.toThrow()
  })

  it('throws on NaN, Infinity and non-number input', () => {
    expect(() => assertFinite(Number.NaN, 'rate')).toThrow(CalcValidationError)
    expect(() => assertFinite(Number.NEGATIVE_INFINITY, 'rate')).toThrow(CalcValidationError)
    expect(() => assertFinite('7' as unknown as number, 'rate')).toThrow(CalcValidationError)
  })
})

describe('assertPositive', () => {
  it('accepts values greater than zero', () => {
    expect(() => assertPositive(0.001, 'dose')).not.toThrow()
  })

  it('throws for zero and negative values', () => {
    expect(() => assertPositive(0, 'dose')).toThrow(CalcValidationError)
    expect(() => assertPositive(-1, 'dose')).toThrow(CalcValidationError)
  })

  it('supports a custom exclusive minimum', () => {
    expect(() => assertPositive(5, 'stressFactor', '×', 1)).not.toThrow()
    expect(() => assertPositive(1, 'stressFactor', '×', 1)).toThrow(CalcValidationError)
  })

  it('validates finiteness first', () => {
    expect(() => assertPositive(Number.NaN, 'dose')).toThrow(CalcValidationError)
  })
})

describe('assertOneOf', () => {
  it('accepts a permitted value', () => {
    expect(() => assertOneOf('M', ['M', 'F'] as const, 'sex')).not.toThrow()
  })

  it('throws for a value outside the permitted set', () => {
    expect(() => assertOneOf('X' as 'M', ['M', 'F'] as const, 'sex')).toThrow(
      CalcValidationError,
    )
    try {
      assertOneOf('X' as 'M', ['M', 'F'] as const, 'sex')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('sex')
      expect((error as Error).message).toContain('M, F')
    }
  })
})

describe('assertDefined', () => {
  it('accepts a present value, including zero and false', () => {
    expect(() => assertDefined(0, 'age')).not.toThrow()
    expect(() => assertDefined('', 'label')).not.toThrow()
  })

  it('throws for null and undefined', () => {
    expect(() => assertDefined(null, 'age')).toThrow(CalcValidationError)
    expect(() => assertDefined(undefined, 'age')).toThrow(CalcValidationError)
  })
})

describe('assertOptionalFinite', () => {
  it('tolerates null and undefined', () => {
    expect(() => assertOptionalFinite(null, 'albumin', 'g/dL')).not.toThrow()
    expect(() => assertOptionalFinite(undefined, 'albumin', 'g/dL')).not.toThrow()
  })

  it('validates a present value', () => {
    expect(() => assertOptionalFinite(4, 'albumin', 'g/dL')).not.toThrow()
    expect(() => assertOptionalFinite(Number.NaN, 'albumin', 'g/dL')).toThrow(
      CalcValidationError,
    )
  })
})