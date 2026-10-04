import { describe, expect, it } from 'vitest'
import {
  calculateSofa,
  SOFA_MAX,
  SOFA_ORGAN_SCALES,
  SOFA_SCORE_TIERS,
  sofaIcuMortality,
} from '@/logic/calculators/emergencia/sofa'
import { CalcValidationError } from '@/logic/types'

const allZero = {
  respirationScore: 0,
  coagulationScore: 0,
  liverScore: 0,
  cardiovascularScore: 0,
  cnsScore: 0,
  renalScore: 0,
} as const

describe('calculateSofa', () => {
  it('returns 0 and normal severity with no organ dysfunction', () => {
    const result = calculateSofa(allZero)
    expect(result.label).toBe('SOFA Score')
    expect(result.value).toBe(0)
    expect(result.unit).toBe('points')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('low organ dysfunction')
  })

  it('returns attention severity at 7', () => {
    const result = calculateSofa({ ...allZero, respirationScore: 4, coagulationScore: 3 })
    expect(result.value).toBe(7)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('moderate organ dysfunction')
  })

  it('returns critical severity at 10', () => {
    const result = calculateSofa({
      respirationScore: 3,
      coagulationScore: 3,
      liverScore: 2,
      cardiovascularScore: 1,
      cnsScore: 1,
      renalScore: 0,
    })
    expect(result.value).toBe(10)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('high organ dysfunction')
    expect(result.interpretation).toMatch(/reassess/i)
  })

  it('reports one sub-result per organ system with the table descriptor', () => {
    const result = calculateSofa({ ...allZero, cnsScore: 3, renalScore: 2 })
    expect(result.subResults).toHaveLength(6)
    const cns = result.subResults?.find(sub => sub.label === 'Central nervous system')
    expect(cns?.interpretation).toBe('GCS 6–9')
    expect(cns?.severity).toBe('attention')
    const respiration = result.subResults?.find(sub => sub.label === 'Respiration')
    expect(respiration?.severity).toBe('info')
  })

  it('quotes the expected ICU mortality for the score', () => {
    // A total of 8 corresponds to 60% ICU mortality in the Sepsis-3 trial.
    const result = calculateSofa({ ...allZero, respirationScore: 4, renalScore: 4 })
    expect(result.interpretation).toContain('60%')

    const severe = calculateSofa({
      ...allZero,
      respirationScore: 4,
      coagulationScore: 4,
      liverScore: 4,
      cardiovascularScore: 2,
    })
    expect(severe.value).toBe(14)
    expect(severe.interpretation).toContain('80%')
  })

  it('throws CalcValidationError for an organ score above 4', () => {
    expect(() => calculateSofa({ ...allZero, cnsScore: 5 as 4 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for an organ score below 0', () => {
    expect(() => calculateSofa({ ...allZero, liverScore: -1 as 0 })).toThrow(CalcValidationError)
  })

  it('names the offending organ field', () => {
    try {
      calculateSofa({ ...allZero, renalScore: 9 as 4 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('renalScore')
    }
  })

  it('boundary: 6 is normal, 7 is attention', () => {
    expect(calculateSofa({ ...allZero, respirationScore: 3, coagulationScore: 3 }).severity).toBe(
      'normal',
    )
    expect(
      calculateSofa({ ...allZero, respirationScore: 4, coagulationScore: 3 }).severity,
    ).toBe('attention')
  })

  it('boundary: 9 is attention, 10 is critical', () => {
    expect(
      calculateSofa({ ...allZero, respirationScore: 4, coagulationScore: 4, liverScore: 1 })
        .severity,
    ).toBe('attention')
    expect(
      calculateSofa({ ...allZero, respirationScore: 4, coagulationScore: 4, liverScore: 2 })
        .severity,
    ).toBe('critical')
  })

  it('boundary: accepts the maximum total of 24', () => {
    const result = calculateSofa({
      respirationScore: 4,
      coagulationScore: 4,
      liverScore: 4,
      cardiovascularScore: 4,
      cnsScore: 4,
      renalScore: 4,
    })
    expect(result.value).toBe(SOFA_MAX)
    expect(result.severity).toBe('critical')
  })
})

describe('sofaIcuMortality', () => {
  it('maps the Sepsis-3 mortality table', () => {
    expect(sofaIcuMortality(0)).toBe(0)
    expect(sofaIcuMortality(2)).toBe(0)
    expect(sofaIcuMortality(3)).toBe(15.7)
    expect(sofaIcuMortality(4)).toBe(31)
    expect(sofaIcuMortality(6)).toBe(50)
    expect(sofaIcuMortality(12)).toBe(77)
  })

  it('saturates above 14 points', () => {
    expect(sofaIcuMortality(14)).toBe(80)
    expect(sofaIcuMortality(24)).toBe(80)
  })

  it('throws CalcValidationError outside 0 to 24', () => {
    expect(() => sofaIcuMortality(-1)).toThrow(CalcValidationError)
    expect(() => sofaIcuMortality(25)).toThrow(CalcValidationError)
  })
})

describe('SOFA tables', () => {
  it('exposes five scoring tiers for the form steppers', () => {
    expect(SOFA_SCORE_TIERS).toEqual([0, 1, 2, 3, 4])
  })

  it('documents five bands for each of the six organ systems', () => {
    const organs = Object.values(SOFA_ORGAN_SCALES)
    expect(organs).toHaveLength(6)
    for (const bands of organs) expect(bands).toHaveLength(5)
  })
})