import { describe, expect, it } from 'vitest'
import { calculateCkdEpi } from '@/logic/calculators/renal/tfgCkdEpi'
import { CalcValidationError } from '@/logic/types'

describe('calculateCkdEpi', () => {
  it('computes 62.5 mL/min/1.73 m² for a 65-year-old female with creatinine 1.0 mg/dL', () => {
    const result = calculateCkdEpi({ age: 65, serumCreatinineMgDl: 1, sex: 'F' })
    expect(result.label).toBe('TFGe (CKD-EPI 2021)')
    expect(result.value).toBeCloseTo(62.5, 1)
    expect(result.unit).toBe('mL/min/1.73 m²')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('G2')
  })

  it('computes 114.7 mL/min/1.73 m² for a 40-year-old male with creatinine 0.8 mg/dL', () => {
    const result = calculateCkdEpi({ age: 40, serumCreatinineMgDl: 0.8, sex: 'M' })
    expect(result.value).toBeCloseTo(114.7, 1)
    expect(result.severity).toBe('normal')
  })

  it('discounts with age', () => {
    const young = calculateCkdEpi({ age: 30, serumCreatinineMgDl: 0.8, sex: 'M' })
    const old = calculateCkdEpi({ age: 70, serumCreatinineMgDl: 0.8, sex: 'M' })
    expect(Number(old.value)).toBeLessThan(Number(young.value))
  })

  it('returns critical severity in kidney failure', () => {
    const result = calculateCkdEpi({ age: 75, serumCreatinineMgDl: 5, sex: 'M' })
    expect(result.value).toBeCloseTo(11.4, 1)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('G5')
    expect(result.interpretation).toContain('CKD')
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() => calculateCkdEpi({ age: 65, serumCreatinineMgDl: 1, sex: 'X' as 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for out-of-range age and creatinine', () => {
    expect(() => calculateCkdEpi({ age: 0, serumCreatinineMgDl: 1, sex: 'M' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCkdEpi({ age: 121, serumCreatinineMgDl: 1, sex: 'M' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCkdEpi({ age: 65, serumCreatinineMgDl: 0.05, sex: 'M' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateCkdEpi({ age: 65, serumCreatinineMgDl: 50.1, sex: 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('names the offending field', () => {
    try {
      calculateCkdEpi({ age: 65, serumCreatinineMgDl: 100, sex: 'M' })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('serumCreatinineMgDl')
    }
  })

  it('boundary: creatinine exactly at κ collapses the min branch to 1', () => {
    // At Scr = κ the min term is exactly 1, so eGFR = 142 × 0.9938^age.
    const result = calculateCkdEpi({ age: 60, serumCreatinineMgDl: 0.9, sex: 'M' })
    expect(result.value).toBeCloseTo(97.8, 1)
    expect(result.interpretation).toContain('G1')
  })

  it('boundary: eGFR of exactly 90 is G1 and normal', () => {
    const result = calculateCkdEpi({ age: 20, serumCreatinineMgDl: 0.9316, sex: 'F' })
    expect(result.value).toBeCloseTo(90, 0)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('G1')
  })

  it('boundary: eGFR of exactly 60 is G2 and normal', () => {
    const result = calculateCkdEpi({ age: 20, serumCreatinineMgDl: 1.3058, sex: 'F' })
    expect(result.value).toBeCloseTo(60, 0)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('G2')
  })

  it('boundary: eGFR of exactly 45 is G3a and attention', () => {
    const result = calculateCkdEpi({ age: 20, serumCreatinineMgDl: 1.6592, sex: 'F' })
    expect(result.value).toBeCloseTo(45, 0)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('G3a')
  })

  it('flags the equation as the race-neutral 2021 revision', () => {
    const result = calculateCkdEpi({ age: 50, serumCreatinineMgDl: 1, sex: 'M' })
    expect(result.subResults?.find(sub => sub.label === 'Fórmula')?.value).toBe('CKD-EPI 2021')
  })
})