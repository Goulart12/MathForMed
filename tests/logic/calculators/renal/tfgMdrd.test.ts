import { describe, expect, it } from 'vitest'
import { calculateMdrd, MDRD_FEMALE_FACTOR } from '@/logic/calculators/renal/tfgMdrd'
import { CalcValidationError } from '@/logic/types'

describe('calculateMdrd', () => {
  it('computes 61.8 mL/min/1.73 m² for a 60-year-old male with creatinine 1.2 mg/dL', () => {
    const result = calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2, sex: 'M' })
    expect(result.label).toBe('eGFR (MDRD)')
    expect(result.value).toBeCloseTo(61.8, 1)
    expect(result.unit).toBe('mL/min/1.73 m²')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('G2')
  })

  it('applies the 0.742 female factor', () => {
    const male = calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2, sex: 'M' })
    const female = calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2, sex: 'F' })
    expect(Number(female.value)).toBeCloseTo(Number(male.value) * MDRD_FEMALE_FACTOR, 0)
  })

  it('returns critical severity below 30 mL/min/1.73 m²', () => {
    const result = calculateMdrd({ age: 75, serumCreatinineMgDl: 3, sex: 'M' })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('G4')
  })

  it('warns that MDRD is less accurate above 90 mL/min/1.73 m²', () => {
    const result = calculateMdrd({ age: 30, serumCreatinineMgDl: 0.7, sex: 'M' })
    expect(result.interpretation).toContain('less accurate')
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() => calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2, sex: 'X' as 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for out-of-range inputs', () => {
    expect(() => calculateMdrd({ age: 0, serumCreatinineMgDl: 1.2, sex: 'M' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateMdrd({ age: 60, serumCreatinineMgDl: 51, sex: 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('names the offending field', () => {
    try {
      calculateMdrd({ age: 200, serumCreatinineMgDl: 1.2, sex: 'M' })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('age')
    }
  })

  it('boundary: eGFR of exactly 60 is G2 and normal', () => {
    const result = calculateMdrd({ age: 60, serumCreatinineMgDl: 1.2295, sex: 'M' })
    expect(result.value).toBeCloseTo(60, 0)
    expect(result.severity).toBe('normal')
  })

  it('boundary: eGFR of exactly 45 is G3a and attention', () => {
    const result = calculateMdrd({ age: 60, serumCreatinineMgDl: 1.5773, sex: 'M' })
    expect(result.value).toBeCloseTo(45, 0)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('G3a')
  })

  it('boundary: eGFR of exactly 30 is G3b and attention', () => {
    const result = calculateMdrd({ age: 60, serumCreatinineMgDl: 2.2402, sex: 'M' })
    expect(result.value).toBeCloseTo(30, 0)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('G3b')
  })
})