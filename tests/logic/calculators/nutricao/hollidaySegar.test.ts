import { describe, expect, it } from 'vitest'
import {
  calculateHollidaySegar,
  MAX_ML_PER_DAY,
} from '@/logic/calculators/nutricao/hollidaySegar'
import { CalcValidationError } from '@/logic/types'

describe('calculateHollidaySegar', () => {
  it('returns 48 mL/h for a 14 kg child', () => {
    const result = calculateHollidaySegar({ weightKg: 14 })
    expect(result.label).toBe('Maintenance Fluid Rate')
    expect(result.value).toBe(48)
    expect(result.unit).toBe('mL/h')
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('next 10 kg')
  })

  it('applies 4 mL/kg/h below 10 kg', () => {
    expect(calculateHollidaySegar({ weightKg: 5 }).value).toBe(20)
    expect(calculateHollidaySegar({ weightKg: 10 }).value).toBe(40)
  })

  it('applies the 40 + 2 × (weight − 10) tier between 10 and 20 kg', () => {
    expect(calculateHollidaySegar({ weightKg: 15 }).value).toBe(50)
    expect(calculateHollidaySegar({ weightKg: 20 }).value).toBe(60)
  })

  it('applies the 60 + 1 × (weight − 20) tier above 20 kg', () => {
    expect(calculateHollidaySegar({ weightKg: 30 }).value).toBe(70)
    expect(calculateHollidaySegar({ weightKg: 50 }).value).toBe(90)
  })

  it('reports the daily volume as a sub-result', () => {
    expect(calculateHollidaySegar({ weightKg: 14 }).subResults?.[0].value).toBe(48 * 24)
  })

  it('caps the daily volume at 2500 mL and explains why', () => {
    const result = calculateHollidaySegar({ weightKg: 100 })
    const daily = result.subResults?.[0]
    expect(daily?.value).toBe(MAX_ML_PER_DAY)
    expect(daily?.interpretation).toContain('capped')
    expect(daily?.interpretation).toContain('30 kg')
  })

  it('does not cap below the ceiling', () => {
    // 50 kg → 90 mL/h → 2160 mL/day, below the cap.
    const result = calculateHollidaySegar({ weightKg: 50 })
    expect(result.subResults?.[0].value).toBe(2160)
    expect(result.subResults?.[0].interpretation).not.toContain('capped')
  })

  it('reminds the clinician to account for ongoing losses', () => {
    const result = calculateHollidaySegar({ weightKg: 12 })
    expect(result.interpretation).toContain('ongoing losses')
  })

  it('throws CalcValidationError for out-of-range weight', () => {
    expect(() => calculateHollidaySegar({ weightKg: 0.4 })).toThrow(CalcValidationError)
    expect(() => calculateHollidaySegar({ weightKg: 100.1 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-finite weight', () => {
    expect(() => calculateHollidaySegar({ weightKg: Number.NaN })).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateHollidaySegar({ weightKg: 0 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('weightKg')
    }
  })

  it('boundary: accepts the minimum and maximum permitted weight', () => {
    expect(() => calculateHollidaySegar({ weightKg: 0.5 })).not.toThrow()
    expect(() => calculateHollidaySegar({ weightKg: 100 })).not.toThrow()
  })

  it('boundary: the 10 kg and 20 kg transitions are continuous', () => {
    expect(Number(calculateHollidaySegar({ weightKg: 10 }).value)).toBe(
      Number(calculateHollidaySegar({ weightKg: 10.001 }).value),
    )
    expect(Number(calculateHollidaySegar({ weightKg: 20 }).value)).toBe(
      Number(calculateHollidaySegar({ weightKg: 20.001 }).value),
    )
  })
})