import { describe, expect, it } from 'vitest'
import { calculateInfusionRate } from '@/logic/calculators/medicacao/infusaoContinua'
import { CalcValidationError } from '@/logic/types'

describe('calculateInfusionRate', () => {
  it('computes 0.1 mL/h for a 0.05 mcg/kg/min noradrenaline infusion at 1600 mcg/mL', () => {
    const result = calculateInfusionRate({
      doseMcgKgMin: 0.05,
      weightKg: 70,
      concentrationMcgMl: 1600,
    })
    expect(result.label).toBe('Infusion Rate')
    expect(result.value).toBeCloseTo(0.13, 1)
    expect(result.unit).toBe('mL/h')
    expect(result.severity).toBe('info')
  })

  it('reports the daily and per-minute doses as sub-results', () => {
    const result = calculateInfusionRate({
      doseMcgKgMin: 1,
      weightKg: 70,
      concentrationMcgMl: 1000,
    })
    expect(result.subResults?.find(sub => sub.label === 'Daily Dose')?.value).toBeCloseTo(
      100.8,
      1,
    )
    expect(result.subResults?.find(sub => sub.label === 'Dose per Minute')?.value).toBe(70)
  })

  it('scales the rate linearly with dose and weight', () => {
    const single = calculateInfusionRate({
      doseMcgKgMin: 0.5,
      weightKg: 60,
      concentrationMcgMl: 1000,
    })
    const double = calculateInfusionRate({
      doseMcgKgMin: 1,
      weightKg: 60,
      concentrationMcgMl: 1000,
    })
    expect(Number(double.value)).toBeCloseTo(Number(single.value) * 2, 1)
  })

  it('inverts the rate as the solution becomes more concentrated', () => {
    const dilute = calculateInfusionRate({
      doseMcgKgMin: 1,
      weightKg: 70,
      concentrationMcgMl: 500,
    })
    const concentrated = calculateInfusionRate({
      doseMcgKgMin: 1,
      weightKg: 70,
      concentrationMcgMl: 2500,
    })
    expect(Number(dilute.value)).toBeCloseTo(Number(concentrated.value) * 5, 0)
  })

  it('throws CalcValidationError for a dose below the minimum', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 0, weightKg: 70, concentrationMcgMl: 1000 }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a dose above the maximum', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 1001, weightKg: 70, concentrationMcgMl: 1000 }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range weight', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 1, weightKg: 0.4, concentrationMcgMl: 1000 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 1, weightKg: 301, concentrationMcgMl: 1000 }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-positive concentration', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 1, weightKg: 70, concentrationMcgMl: 0 }),
    ).toThrow(CalcValidationError)
  })

  it('reports the correct field name', () => {
    try {
      calculateInfusionRate({ doseMcgKgMin: 1, weightKg: 70, concentrationMcgMl: 0 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('concentrationMcgMl')
    }
  })

  it('boundary: accepts the minimum dose and weight', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 0.001, weightKg: 0.5, concentrationMcgMl: 1 }),
    ).not.toThrow()
  })

  it('boundary: accepts the maximum dose and weight', () => {
    expect(() =>
      calculateInfusionRate({ doseMcgKgMin: 1000, weightKg: 300, concentrationMcgMl: 1 }),
    ).not.toThrow()
  })
})