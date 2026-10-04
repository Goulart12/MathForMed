import { describe, expect, it } from 'vitest'
import {
  calculateCreatinineClearance,
  FEMALE_FACTOR,
} from '@/logic/calculators/renal/creatininaClearance'
import { CalcValidationError } from '@/logic/types'

describe('calculateCreatinineClearance', () => {
  it('computes 56.7 mL/min for a 70-year-old 70 kg male with creatinine 1.2 mg/dL', () => {
    const result = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 1.2,
      sex: 'M',
    })
    expect(result.label).toBe('Creatinine Clearance')
    expect(result.value).toBeCloseTo(56.7, 1)
    expect(result.unit).toBe('mL/min')
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('G3a')
  })

  it('applies the 0.85 female factor', () => {
    const male = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 1.2,
      sex: 'M',
    })
    const female = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 1.2,
      sex: 'F',
    })
    expect(Number(female.value)).toBeCloseTo(Number(male.value) * FEMALE_FACTOR, 1)
    expect(
      female.subResults?.find(sub => sub.label === 'Sex Factor')?.value,
    ).toBe(FEMALE_FACTOR)
  })

  it('returns normal severity for preserved renal function', () => {
    const result = calculateCreatinineClearance({
      age: 30,
      weightKg: 70,
      serumCreatinineMgDl: 0.9,
      sex: 'M',
    })
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('preserved')
  })

  it('returns critical severity below 15 mL/min', () => {
    const result = calculateCreatinineClearance({
      age: 80,
      weightKg: 60,
      serumCreatinineMgDl: 5,
      sex: 'M',
    })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('G5')
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() =>
      calculateCreatinineClearance({
        age: 70,
        weightKg: 70,
        serumCreatinineMgDl: 1.2,
        sex: 'X' as 'M',
      }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range age', () => {
    expect(() =>
      calculateCreatinineClearance({
        age: 0,
        weightKg: 70,
        serumCreatinineMgDl: 1.2,
        sex: 'M',
      }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateCreatinineClearance({
        age: 121,
        weightKg: 70,
        serumCreatinineMgDl: 1.2,
        sex: 'M',
      }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range weight and creatinine', () => {
    expect(() =>
      calculateCreatinineClearance({
        age: 70,
        weightKg: 0.4,
        serumCreatinineMgDl: 1.2,
        sex: 'M',
      }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateCreatinineClearance({
        age: 70,
        weightKg: 70,
        serumCreatinineMgDl: 51,
        sex: 'M',
      }),
    ).toThrow(CalcValidationError)
  })

  it('boundary: CrCl of exactly 60 mL/min is G2 and normal', () => {
    // (140 − 70) × 70 / (72 × Scr) = 60  →  Scr = 0.9056
    const result = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 4900 / (72 * 60),
      sex: 'M',
    })
    expect(Number(result.value)).toBeCloseTo(60, 1)
    expect(result.severity).toBe('normal')
  })

  it('boundary: CrCl of exactly 45 mL/min is G3a and attention', () => {
    const result = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 4900 / (72 * 45),
      sex: 'M',
    })
    expect(Number(result.value)).toBeCloseTo(45, 1)
    expect(result.severity).toBe('attention')
  })

  it('boundary: CrCl of exactly 15 mL/min is G4 and critical', () => {
    const result = calculateCreatinineClearance({
      age: 70,
      weightKg: 70,
      serumCreatinineMgDl: 4900 / (72 * 15),
      sex: 'M',
    })
    expect(Number(result.value)).toBeCloseTo(15, 1)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('G4')
  })
})