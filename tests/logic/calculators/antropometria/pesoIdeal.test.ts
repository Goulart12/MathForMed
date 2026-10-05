import { describe, expect, it } from 'vitest'
import {
  ABW_TRIGGER_RATIO,
  calculateIdealBodyWeight,
  requiresAdjustedWeight,
} from '@/logic/calculators/antropometria/pesoIdeal'
import { CalcValidationError } from '@/logic/types'

describe('calculateIdealBodyWeight', () => {
  it('computes 75 kg IBW for a 180 cm male', () => {
    const result = calculateIdealBodyWeight({ heightM: 1.8, weightKg: 75, sex: 'M' })
    expect(result.value).toBeCloseTo(75, 1)
    expect(result.severity).toBe('info')
    expect(result.unit).toBe('kg')
  })

  it('applies the 45.5 kg female constant', () => {
    const result = calculateIdealBodyWeight({ heightM: 1.8, weightKg: 60, sex: 'F' })
    expect(result.value).toBeCloseTo(70.5, 1)
  })

  it('reports adjusted body weight above 120% of IBW', () => {
    const result = calculateIdealBodyWeight({ heightM: 1.8, weightKg: 120, sex: 'M' })
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('peso ajustado')
    const abw = result.subResults?.find(sub => sub.label === 'Peso Corporal Ajustado')
    // ABW = 75 + 0.4 × (120 − 75) = 93
    expect(abw?.value).toBeCloseTo(93, 1)
  })

  it('omits adjusted body weight at or below 120% of IBW', () => {
    const result = calculateIdealBodyWeight({ heightM: 1.8, weightKg: 85, sex: 'M' })
    expect(result.subResults?.find(sub => sub.label === 'Peso Corporal Ajustado')).toBeUndefined()
    expect(result.interpretation).toContain('aplica-se diretamente')
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() =>
      calculateIdealBodyWeight({ heightM: 1.8, weightKg: 70, sex: 'X' as 'M' }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range height and weight', () => {
    expect(() => calculateIdealBodyWeight({ heightM: 0, weightKg: 70, sex: 'M' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateIdealBodyWeight({ heightM: 1.8, weightKg: 0, sex: 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('boundary: adjusted weight triggers exactly above the ratio', () => {
    const ibw = 75
    const atThreshold = ibw * ABW_TRIGGER_RATIO
    expect(
      requiresAdjustedWeight(ibw, atThreshold),
    ).toBe(false)
    expect(requiresAdjustedWeight(ibw, atThreshold + 0.01)).toBe(true)
  })

  it('boundary: height at the Devine reference yields the base constant', () => {
    const male = calculateIdealBodyWeight({ heightM: 1.524, weightKg: 70, sex: 'M' })
    const female = calculateIdealBodyWeight({ heightM: 1.524, weightKg: 70, sex: 'F' })
    expect(male.value).toBeCloseTo(50, 1)
    expect(female.value).toBeCloseTo(45.5, 1)
  })
})