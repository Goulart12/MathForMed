import { describe, expect, it } from 'vitest'
import { calculateCorrectedSodium } from '@/logic/calculators/laboratorial/correcaoSodio'
import { CalcValidationError } from '@/logic/types'

describe('calculateCorrectedSodium', () => {
  it('returns normal sodium when glucose is at the reference of 100 mg/dL', () => {
    const result = calculateCorrectedSodium({ measuredSodiumMeqL: 140, glucoseMgDl: 100 })
    expect(result.label).toBe('Corrected Sodium')
    expect(result.value).toBe(140)
    expect(result.unit).toBe('mEq/L')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('Normal sodium')
  })

  it('corrects 129 mEq/L at 300 mg/dL up to 132.2 mEq/L', () => {
    const result = calculateCorrectedSodium({ measuredSodiumMeqL: 129, glucoseMgDl: 300 })
    expect(result.value).toBeCloseTo(132.2, 1)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Hyponatraemia')
  })

  it('returns critical severity for hypernatraemia', () => {
    const result = calculateCorrectedSodium({ measuredSodiumMeqL: 150, glucoseMgDl: 100 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Hypernatraemia')
  })

  it('reports the measured sodium and correction as sub-results', () => {
    const result = calculateCorrectedSodium({ measuredSodiumMeqL: 129, glucoseMgDl: 300 })
    expect(result.subResults?.find(sub => sub.label === 'Measured Sodium')?.value).toBe(129)
    expect(result.subResults?.find(sub => sub.label === 'Correction Applied')?.value).toBeCloseTo(
      3.2,
      1,
    )
  })

  it('throws CalcValidationError for out-of-range inputs', () => {
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 99, glucoseMgDl: 100 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 191, glucoseMgDl: 100 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 140, glucoseMgDl: 19 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 140, glucoseMgDl: 1001 }),
    ).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateCorrectedSodium({ measuredSodiumMeqL: 10, glucoseMgDl: 100 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('measuredSodiumMeqL')
    }
  })

  it('boundary: a corrected value of exactly 135 is normal', () => {
    const result = calculateCorrectedSodium({ measuredSodiumMeqL: 134.9, glucoseMgDl: 100 })
    expect(result.value).toBeCloseTo(134.9, 1)
    expect(result.severity).toBe('attention')

    const normal = calculateCorrectedSodium({ measuredSodiumMeqL: 135, glucoseMgDl: 100 })
    expect(normal.severity).toBe('normal')
  })

  it('boundary: a corrected value of exactly 145 is normal', () => {
    expect(
      calculateCorrectedSodium({ measuredSodiumMeqL: 145, glucoseMgDl: 100 }).severity,
    ).toBe('normal')
    expect(
      calculateCorrectedSodium({ measuredSodiumMeqL: 145.1, glucoseMgDl: 100 }).severity,
    ).toBe('critical')
  })

  it('boundary: accepts the minimum and maximum permitted values', () => {
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 100, glucoseMgDl: 20 }),
    ).not.toThrow()
    expect(() =>
      calculateCorrectedSodium({ measuredSodiumMeqL: 190, glucoseMgDl: 1000 }),
    ).not.toThrow()
  })
})