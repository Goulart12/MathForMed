import { describe, expect, it } from 'vitest'
import { calculateOsmolality } from '@/logic/calculators/laboratorial/osmolalidade'
import { CalcValidationError } from '@/logic/types'

const baseline = { sodium: 140, glucoseMgDl: 100, bunMgDl: 20 }

describe('calculateOsmolality', () => {
  it('returns 292.7 mOsm/kg for normal values', () => {
    const result = calculateOsmolality(baseline)
    expect(result.label).toBe('Serum Osmolality')
    expect(result.value).toBeCloseTo(292.7, 1)
    expect(result.unit).toBe('mOsm/kg')
    expect(result.severity).toBe('normal')
  })

  it('returns attention severity for hypotonic plasma', () => {
    // 260 + 4.44 + 3.57 = 268.0
    const result = calculateOsmolality({ sodium: 130, glucoseMgDl: 80, bunMgDl: 10 })
    expect(result.value).toBeCloseTo(268, 1)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('hypotonic')
  })

  it('returns attention severity for hypertonic plasma', () => {
    // 300 + 22.22 + 10.71 = 332.9
    const result = calculateOsmolality({ sodium: 150, glucoseMgDl: 400, bunMgDl: 30 })
    expect(result.value).toBeCloseTo(332.9, 1)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('hypertonic')
  })

  it('returns critical severity and names toxic alcohols on an elevated gap', () => {
    const result = calculateOsmolality({ ...baseline, measuredOsmolality: 320 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('methanol')
    const gap = result.subResults?.find(sub => sub.label === 'Osmolal Gap')
    expect(gap?.value).toBeCloseTo(27.3, 1)
    expect(gap?.severity).toBe('critical')
  })

  it('returns normal severity for a gap below 10', () => {
    const result = calculateOsmolality({ ...baseline, measuredOsmolality: 295 })
    expect(result.severity).toBe('normal')
    const gap = result.subResults?.find(sub => sub.label === 'Osmolal Gap')
    expect(gap?.value).toBeCloseTo(2.3, 1)
    expect(gap?.severity).toBe('normal')
  })

  it('omits the gap sub-result when no measured value is given', () => {
    const result = calculateOsmolality(baseline)
    expect(result.subResults?.find(sub => sub.label === 'Osmolal Gap')).toBeUndefined()
  })

  it('accepts an explicit null measured osmolality', () => {
    const result = calculateOsmolality({ ...baseline, measuredOsmolality: null })
    expect(result.subResults?.find(sub => sub.label === 'Osmolal Gap')).toBeUndefined()
  })

  it('reports each contributor as a sub-result', () => {
    const result = calculateOsmolality(baseline)
    expect(result.subResults?.map(sub => sub.label)).toEqual([
      'Sodium Contribution',
      'Glucose Contribution',
      'Urea Contribution',
    ])
    expect(result.subResults?.[1]?.value).toBeCloseTo(5.6, 1)
  })

  it('throws CalcValidationError for out-of-range analytes', () => {
    expect(() => calculateOsmolality({ ...baseline, sodium: 99 })).toThrow(CalcValidationError)
    expect(() => calculateOsmolality({ ...baseline, sodium: 191 })).toThrow(CalcValidationError)
    expect(() => calculateOsmolality({ ...baseline, glucoseMgDl: 19 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateOsmolality({ ...baseline, bunMgDl: 0 })).toThrow(CalcValidationError)
    expect(() => calculateOsmolality({ ...baseline, bunMgDl: 151 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range measured osmolality', () => {
    expect(() => calculateOsmolality({ ...baseline, measuredOsmolality: 199 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateOsmolality({ ...baseline, measuredOsmolality: 401 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for a non-finite measured osmolality', () => {
    expect(() =>
      calculateOsmolality({ ...baseline, measuredOsmolality: Number.NaN }),
    ).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateOsmolality({ ...baseline, sodium: 500 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('sodium')
    }
  })

  it('boundary: an osmolality just below 275 mOsm/kg is hypotonic', () => {
    // 135 mEq/L → 279.1 mOsm/kg (normal); 130 mEq/L → 268.0 (hypotonic).
    expect(
      calculateOsmolality({ sodium: 135, glucoseMgDl: 100, bunMgDl: 10 }).severity,
    ).toBe('normal')
    expect(
      calculateOsmolality({ sodium: 130, glucoseMgDl: 100, bunMgDl: 10 }).severity,
    ).toBe('attention')
  })

  it('boundary: a gap of exactly 10 is critical', () => {
    const result = calculateOsmolality({ ...baseline, measuredOsmolality: 302.7 })
    const gap = result.subResults?.find(sub => sub.label === 'Osmolal Gap')
    expect(gap?.value).toBeCloseTo(10, 0)
    expect(gap?.severity).toBe('critical')
  })
})