import { describe, expect, it } from 'vitest'
import { calculateQsofa } from '@/logic/calculators/emergencia/qsofa'
import { CalcValidationError } from '@/logic/types'

const baseline = { respiratoryRate: 16, alteredMentation: false, sysBp: 120 }

describe('calculateQsofa', () => {
  it('returns 0 and normal severity for a well patient', () => {
    const result = calculateQsofa(baseline)
    expect(result.label).toBe('qSOFA Score')
    expect(result.value).toBe(0)
    expect(result.unit).toBe('points')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('does not exclude sepsis')
  })

  it('returns critical severity at 2 or more', () => {
    const result = calculateQsofa({ respiratoryRate: 24, alteredMentation: true, sysBp: 88 })
    expect(result.value).toBe(3)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('consider sepsis evaluation')
  })

  it('returns critical severity at exactly 2', () => {
    const result = calculateQsofa({ respiratoryRate: 24, alteredMentation: true, sysBp: 120 })
    expect(result.value).toBe(2)
    expect(result.severity).toBe('critical')
  })

  it('returns normal severity at exactly 1', () => {
    const result = calculateQsofa({ respiratoryRate: 22, alteredMentation: false, sysBp: 120 })
    expect(result.value).toBe(1)
    expect(result.severity).toBe('normal')
  })

  it('reports each criterion as a sub-result', () => {
    const result = calculateQsofa({ respiratoryRate: 24, alteredMentation: true, sysBp: 88 })
    expect(result.subResults).toHaveLength(3)
    expect(result.subResults?.map(sub => sub.value)).toEqual([1, 1, 1])
    expect(result.subResults?.[1]?.label).toContain('Altered mentation')
  })

  it('throws CalcValidationError for out-of-range vital signs', () => {
    expect(() => calculateQsofa({ ...baseline, respiratoryRate: 3 })).toThrow(CalcValidationError)
    expect(() => calculateQsofa({ ...baseline, respiratoryRate: 61 })).toThrow(CalcValidationError)
    expect(() => calculateQsofa({ ...baseline, sysBp: 39 })).toThrow(CalcValidationError)
    expect(() => calculateQsofa({ ...baseline, sysBp: 301 })).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateQsofa({ ...baseline, sysBp: 500 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('sysBp')
    }
  })

  it('boundary: a respiratory rate of exactly 22 scores a point', () => {
    expect(calculateQsofa({ ...baseline, respiratoryRate: 22 }).value).toBe(1)
    expect(calculateQsofa({ ...baseline, respiratoryRate: 21 }).value).toBe(0)
  })

  it('boundary: a systolic pressure of exactly 100 scores a point', () => {
    expect(calculateQsofa({ ...baseline, sysBp: 100 }).value).toBe(1)
    expect(calculateQsofa({ ...baseline, sysBp: 101 }).value).toBe(0)
  })

  it('boundary: accepts the minimum and maximum vital signs', () => {
    expect(() => calculateQsofa({ respiratoryRate: 4, alteredMentation: false, sysBp: 40 })).not.toThrow()
    expect(() => calculateQsofa({ respiratoryRate: 60, alteredMentation: true, sysBp: 300 })).not.toThrow()
  })
})