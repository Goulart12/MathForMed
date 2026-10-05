import { describe, expect, it } from 'vitest'
import { calculateCorrectedCalcium } from '@/logic/calculators/laboratorial/correcaoCalcio'
import { CalcValidationError } from '@/logic/types'

describe('calculateCorrectedCalcium', () => {
  it('returns 9.6 mg/dL for 8 mg/dL at an albumin of 2 g/dL', () => {
    const result = calculateCorrectedCalcium({ measuredCalciumMgDl: 8, albuminGDl: 2 })
    expect(result.label).toBe('Corrected Calcium')
    expect(result.value).toBeCloseTo(9.6, 1)
    expect(result.unit).toBe('mg/dL')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('normal calcium')
  })

  it('applies no correction at the 4 g/dL albumin anchor', () => {
    const result = calculateCorrectedCalcium({ measuredCalciumMgDl: 9, albuminGDl: 4 })
    expect(result.value).toBe(9)
    expect(result.subResults?.find(sub => sub.label === 'Correction Applied')?.value).toBe(0)
  })

  it('returns critical severity for critical hypocalcaemia', () => {
    const result = calculateCorrectedCalcium({ measuredCalciumMgDl: 6, albuminGDl: 4 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('critical hypocalcaemia')
  })

  it('returns critical severity for critical hypercalcaemia', () => {
    const result = calculateCorrectedCalcium({ measuredCalciumMgDl: 13, albuminGDl: 4 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('critical hypercalcaemia')
  })

  it('returns attention severity for mild derangement', () => {
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 8, albuminGDl: 4 }).severity,
    ).toBe('attention')
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 11, albuminGDl: 4 }).severity,
    ).toBe('attention')
  })

  it('rescues a critically low total calcium in hypoalbuminaemia', () => {
    const uncorrected = calculateCorrectedCalcium({ measuredCalciumMgDl: 7, albuminGDl: 4 })
    const corrected = calculateCorrectedCalcium({ measuredCalciumMgDl: 7, albuminGDl: 2 })
    // 7 mg/dL is critical hypocalcaemia; 7 + 1.6 = 8.6 mg/dL is normal.
    expect(uncorrected.severity).toBe('critical')
    expect(corrected.value).toBeCloseTo(8.6, 1)
    expect(corrected.severity).toBe('normal')
  })

  it('reports the measured value and correction as sub-results', () => {
    const result = calculateCorrectedCalcium({ measuredCalciumMgDl: 8, albuminGDl: 2 })
    expect(result.subResults?.find(sub => sub.label === 'Measured Calcium')?.value).toBe(8)
    expect(result.subResults?.find(sub => sub.label === 'Correction Applied')?.value).toBeCloseTo(
      1.6,
      1,
    )
  })

  it('throws CalcValidationError for out-of-range inputs', () => {
    expect(() => calculateCorrectedCalcium({ measuredCalciumMgDl: 3, albuminGDl: 4 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCorrectedCalcium({ measuredCalciumMgDl: 17, albuminGDl: 4 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCorrectedCalcium({ measuredCalciumMgDl: 9, albuminGDl: 0.5 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCorrectedCalcium({ measuredCalciumMgDl: 9, albuminGDl: 6.5 })).toThrow(
      CalcValidationError,
    )
  })

  it('names the offending field', () => {
    try {
      calculateCorrectedCalcium({ measuredCalciumMgDl: 9, albuminGDl: 0 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('albuminGDl')
    }
  })

  it('boundary: 8.5 mg/dL is normal, 8.4 is attention', () => {
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 8.5, albuminGDl: 4 }).severity,
    ).toBe('normal')
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 8.4, albuminGDl: 4 }).severity,
    ).toBe('attention')
  })

  it('boundary: 10.5 mg/dL is normal, 10.6 is attention', () => {
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 10.5, albuminGDl: 4 }).severity,
    ).toBe('normal')
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 10.6, albuminGDl: 4 }).severity,
    ).toBe('attention')
  })

  it('boundary: 7.5 mg/dL is attention, 7.4 is critical', () => {
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 7.5, albuminGDl: 4 }).severity,
    ).toBe('attention')
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 7.4, albuminGDl: 4 }).severity,
    ).toBe('critical')
  })

  it('boundary: 12 mg/dL is attention, 12.1 is critical', () => {
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 12, albuminGDl: 4 }).severity,
    ).toBe('attention')
    expect(
      calculateCorrectedCalcium({ measuredCalciumMgDl: 12.1, albuminGDl: 4 }).severity,
    ).toBe('critical')
  })
})