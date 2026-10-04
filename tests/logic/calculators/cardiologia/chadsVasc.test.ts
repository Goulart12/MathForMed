import { describe, expect, it } from 'vitest'
import { calculateChadsVasc } from '@/logic/calculators/cardiologia/chadsVasc'
import { CalcValidationError } from '@/logic/types'

const allAbsent = {
  age: 50,
  chf: false,
  hypertension: false,
  stroke: false,
  vascularDisease: false,
  diabetes: false,
  sex: 'M' as const,
}

describe('calculateChadsVasc', () => {
  it('returns a score of 0 and normal risk for a low-risk male', () => {
    const result = calculateChadsVasc(allAbsent)
    expect(result.label).toBe('CHA₂DS₂-VASc Score')
    expect(result.value).toBe(0)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('No anticoagulation recommended')
  })

  it('scores 6 for a 78-year-old female with CHF, hypertension and diabetes', () => {
    const result = calculateChadsVasc({
      age: 78,
      chf: true,
      hypertension: true,
      stroke: false,
      vascularDisease: false,
      diabetes: true,
      sex: 'F',
    })
    // CHF 1 + HTN 1 + age ≥75 2 + DM 1 + female 1 = 6
    expect(result.value).toBe(6)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('high risk')
  })

  it('awards two points for stroke and two for age ≥ 75', () => {
    const withStroke = calculateChadsVasc({ ...allAbsent, stroke: true })
    expect(withStroke.value).toBe(2)
    expect(withStroke.severity).toBe('critical')

    const withAge = calculateChadsVasc({ ...allAbsent, age: 80 })
    expect(withAge.value).toBe(2)
  })

  it('awards one point for ages 65 to 74 only', () => {
    expect(calculateChadsVasc({ ...allAbsent, age: 64 }).value).toBe(0)
    expect(calculateChadsVasc({ ...allAbsent, age: 65 }).value).toBe(1)
    expect(calculateChadsVasc({ ...allAbsent, age: 74 }).value).toBe(1)
    expect(calculateChadsVasc({ ...allAbsent, age: 75 }).value).toBe(2)
  })

  it('treats female sex alone as low risk', () => {
    const result = calculateChadsVasc({ ...allAbsent, sex: 'F' })
    expect(result.value).toBe(1)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('does not warrant anticoagulation on its own')
  })

  it('uses a higher threshold for females at the same score', () => {
    const male = calculateChadsVasc({ ...allAbsent, chf: true })
    const female = calculateChadsVasc({ ...allAbsent, chf: true, sex: 'F' })
    expect(male.value).toBe(1)
    expect(male.severity).toBe('attention')
    expect(female.value).toBe(2)
    expect(female.severity).toBe('attention')
  })

  it('awards one point for vascular disease', () => {
    const result = calculateChadsVasc({ ...allAbsent, vascularDisease: true })
    expect(result.value).toBe(1)
    expect(result.severity).toBe('attention')
    expect(result.subResults?.map(sub => sub.label)).toEqual(['Vascular disease'])
  })

  it('lists only the present criteria as sub-results', () => {
    const result = calculateChadsVasc({ ...allAbsent, chf: true, diabetes: true })
    const labels = result.subResults?.map(sub => sub.label)
    expect(labels).toEqual(['Congestive heart failure', 'Diabetes mellitus'])
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() => calculateChadsVasc({ ...allAbsent, sex: 'X' as 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for out-of-range age', () => {
    expect(() => calculateChadsVasc({ ...allAbsent, age: 10 })).toThrow(CalcValidationError)
    expect(() => calculateChadsVasc({ ...allAbsent, age: 130 })).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateChadsVasc({ ...allAbsent, age: 500 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('age')
    }
  })

  it('boundary: male score of 1 is moderate, 2 is high', () => {
    expect(calculateChadsVasc({ ...allAbsent, chf: true }).severity).toBe('attention')
    expect(calculateChadsVasc({ ...allAbsent, chf: true, diabetes: true }).severity).toBe(
      'critical',
    )
  })

  it('boundary: female score of 2 is moderate, 3 is high', () => {
    expect(calculateChadsVasc({ ...allAbsent, chf: true, sex: 'F' }).severity).toBe('attention')
    expect(
      calculateChadsVasc({ ...allAbsent, chf: true, diabetes: true, sex: 'F' }).severity,
    ).toBe('critical')
  })
})