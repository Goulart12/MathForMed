import { describe, expect, it } from 'vitest'
import {
  ADULT_MEAN_BSA_M2,
  calculateBsa,
} from '@/logic/calculators/antropometria/superficieCorporal'
import { CalcValidationError } from '@/logic/types'

describe('calculateBsa', () => {
  it('computes 1.86 m² by Mosteller for 70 kg / 178 cm', () => {
    const result = calculateBsa({ weightKg: 70, heightM: 1.78, formula: 'mosteller' })
    expect(result.value).toBeCloseTo(1.86, 2)
    expect(result.severity).toBe('info')
    expect(result.unit).toBe('m²')
    expect(result.interpretation).toContain('Mosteller')
  })

  it('computes 1.87 m² by Du Bois for the same patient', () => {
    const result = calculateBsa({ weightKg: 70, heightM: 1.78, formula: 'dubois' })
    expect(result.value).toBeCloseTo(1.87, 2)
    expect(result.interpretation).toContain('Du Bois')
  })

  it('anchors the interpretation to the adult mean BSA', () => {
    const result = calculateBsa({ weightKg: 70, heightM: 1.78, formula: 'mosteller' })
    expect(result.interpretation).toContain(String(ADULT_MEAN_BSA_M2))
    expect(result.references?.[0]).toMatchObject({ min: 1.5, max: 2.0 })
  })

  it('throws for an unknown formula', () => {
    expect(() =>
      calculateBsa({ weightKg: 70, heightM: 1.78, formula: 'haycock' as 'mosteller' }),
    ).toThrow(CalcValidationError)
  })

  it('reports the correct field for an invalid formula', () => {
    try {
      calculateBsa({ weightKg: 70, heightM: 1.78, formula: 'x' as 'mosteller' })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('formula')
    }
  })

  it('throws for out-of-range weight and height', () => {
    expect(() => calculateBsa({ weightKg: 0, heightM: 1.78, formula: 'mosteller' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateBsa({ weightKg: 70, heightM: 3, formula: 'mosteller' })).toThrow(
      CalcValidationError,
    )
  })

  it('boundary: accepts the minimum and maximum permitted inputs', () => {
    expect(() => calculateBsa({ weightKg: 0.5, heightM: 0.3, formula: 'mosteller' })).not.toThrow()
    expect(() => calculateBsa({ weightKg: 300, heightM: 2.5, formula: 'dubois' })).not.toThrow()
  })

  it('scales monotonically with body size', () => {
    const small = calculateBsa({ weightKg: 50, heightM: 1.6, formula: 'mosteller' })
    const large = calculateBsa({ weightKg: 110, heightM: 1.9, formula: 'mosteller' })
    expect(Number(large.value)).toBeGreaterThan(Number(small.value))
  })
})