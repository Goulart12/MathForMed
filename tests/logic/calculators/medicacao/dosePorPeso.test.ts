import { describe, expect, it } from 'vitest'
import { calculateDoseByWeight } from '@/logic/calculators/medicacao/dosePorPeso'
import { CalcValidationError } from '@/logic/types'

const base = {
  unitDose: 15,
  unitDoseUnit: 'mg/kg' as const,
  weightKg: 20,
  concentrationPerMl: 50,
  availableVolumeMl: 10,
}

describe('calculateDoseByWeight', () => {
  it('converts 15 mg/kg × 20 kg into 6 mL at 50 mg/mL', () => {
    const result = calculateDoseByWeight(base)
    expect(result.label).toBe('Required Dose')
    expect(result.value).toBe(6)
    expect(result.unit).toBe('mL')
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('300 mg')
    expect(result.interpretation).toContain('6 mL')
  })

  it('exposes the total dose as a sub-result', () => {
    const result = calculateDoseByWeight(base)
    const dose = result.subResults?.find(sub => sub.label === 'Total Dose')
    expect(dose?.value).toBe(300)
    expect(dose?.unit).toBe('mg')
  })

  it('derives the base unit from the denominator', () => {
    const mcg = calculateDoseByWeight({ ...base, unitDoseUnit: 'mcg/kg', unitDose: 0.5 })
    expect(mcg.subResults?.find(sub => sub.label === 'Total Dose')?.unit).toBe('mcg')

    const iu = calculateDoseByWeight({ ...base, unitDoseUnit: 'IU/kg', unitDose: 50 })
    expect(iu.subResults?.find(sub => sub.label === 'Total Dose')?.unit).toBe('IU')
  })

  it('rounds international units to whole numbers', () => {
    const result = calculateDoseByWeight({
      ...base,
      unitDoseUnit: 'IU/kg',
      unitDose: 10.5,
    })
    expect(result.subResults?.find(sub => sub.label === 'Total Dose')?.value).toBe(210)
  })

  it('escalates to critical when the required volume exceeds the presentation', () => {
    const result = calculateDoseByWeight({ ...base, availableVolumeMl: 4 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('only 4 mL is available')
    expect(result.subResults?.find(sub => sub.label === 'Volume Available')?.severity).toBe(
      'critical',
    )
  })

  it('throws CalcValidationError for an unknown denominator', () => {
    expect(() =>
      calculateDoseByWeight({ ...base, unitDoseUnit: 'g/kg' as 'mg/kg' }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-positive unit dose', () => {
    expect(() => calculateDoseByWeight({ ...base, unitDose: 0 })).toThrow(CalcValidationError)
    expect(() => calculateDoseByWeight({ ...base, unitDose: -5 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-positive concentration', () => {
    expect(() => calculateDoseByWeight({ ...base, concentrationPerMl: 0 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for out-of-range weight', () => {
    expect(() => calculateDoseByWeight({ ...base, weightKg: 0.4 })).toThrow(CalcValidationError)
    expect(() => calculateDoseByWeight({ ...base, weightKg: 350 })).toThrow(CalcValidationError)
  })

  it('reports the correct field name for each rejected input', () => {
    const fields: [keyof typeof base, string][] = [
      ['weightKg', 'weightKg'],
      ['unitDose', 'unitDose'],
      ['concentrationPerMl', 'concentrationPerMl'],
      ['availableVolumeMl', 'availableVolumeMl'],
      ['unitDoseUnit', 'unitDoseUnit'],
    ]

    for (const [key, field] of fields) {
      try {
        calculateDoseByWeight({ ...base, [key]: key === 'unitDoseUnit' ? 'bad' : 0 })
        expect.unreachable(`should have thrown for ${key}`)
      } catch (error) {
        expect((error as CalcValidationError).field, key).toBe(field)
      }
    }
  })

  it('boundary: accepts the minimum and maximum permitted weight', () => {
    expect(() =>
      calculateDoseByWeight({ ...base, weightKg: 0.5, concentrationPerMl: 1000 }),
    ).not.toThrow()
    expect(() =>
      calculateDoseByWeight({ ...base, weightKg: 300, concentrationPerMl: 1000 }),
    ).not.toThrow()
  })

  it('boundary: a required volume exactly equal to the available volume is not critical', () => {
    const result = calculateDoseByWeight({ ...base, availableVolumeMl: 6 })
    expect(result.value).toBe(6)
    expect(result.severity).toBe('info')
  })
})