import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_FACTORS,
  calculateHarrisBenedict,
  PROTEIN_G_PER_KG,
} from '@/logic/calculators/nutricao/harrisBenedict'
import { CalcValidationError } from '@/logic/types'

const baseline = {
  weightKg: 70,
  heightCm: 175,
  age: 30,
  sex: 'M' as const,
  activityFactor: 1.55 as const,
}

describe('calculateHarrisBenedict', () => {
  it('returns 2628 kcal/day for a 70 kg, 175 cm, 30-year-old male at moderate activity', () => {
    const result = calculateHarrisBenedict(baseline)
    expect(result.label).toBe('Gasto Energético Diário Total')
    expect(result.value).toBe(2628)
    expect(result.unit).toBe('kcal/dia')
    expect(result.severity).toBe('info')
  })

  it('uses the revised female equation', () => {
    const result = calculateHarrisBenedict({ ...baseline, sex: 'F' })
    expect(result.value).toBe(2336)
  })

  it('reports the BMR, activity level and protein target as sub-results', () => {
    const result = calculateHarrisBenedict(baseline)
    expect(result.subResults?.find(sub => sub.label === 'Taxa Metabólica de Repouso')?.value).toBe(
      1696,
    )
    expect(result.subResults?.find(sub => sub.label === 'Nível de atividade')?.value).toBe(1.55)
    expect(result.subResults?.find(sub => sub.label === 'Alvo de proteína')?.value).toBe(
      PROTEIN_G_PER_KG * 70,
    )
  })

  it('applies the optional stress factor', () => {
    const without = calculateHarrisBenedict(baseline)
    const withStress = calculateHarrisBenedict({ ...baseline, stressFactor: 1.3 })
    // 2628.28 × 1.3 = 3416.76 → 3417
    expect(withStress.value).toBe(3417)
    expect(withStress.value).toBeGreaterThan(Number(without.value))
    expect(withStress.interpretation).toContain('estresse 1.3')
  })

  it('scales the requirement with the activity factor', () => {
    const sedentary = calculateHarrisBenedict({ ...baseline, activityFactor: 1.2 })
    const extraActive = calculateHarrisBenedict({ ...baseline, activityFactor: 1.9 })
    expect(Number(extraActive.value)).toBeGreaterThan(Number(sedentary.value))
    expect(ACTIVITY_FACTORS).toHaveLength(5)
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() => calculateHarrisBenedict({ ...baseline, sex: 'X' as 'M' })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for an unknown activity factor', () => {
    expect(() =>
      calculateHarrisBenedict({ ...baseline, activityFactor: 1.3 as 1.2 }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range inputs', () => {
    expect(() => calculateHarrisBenedict({ ...baseline, weightKg: 0.4 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateHarrisBenedict({ ...baseline, heightCm: 49 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateHarrisBenedict({ ...baseline, age: 121 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a stress factor below one', () => {
    expect(() => calculateHarrisBenedict({ ...baseline, stressFactor: 0.8 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for a non-finite stress factor', () => {
    expect(() =>
      calculateHarrisBenedict({ ...baseline, stressFactor: Number.NaN }),
    ).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateHarrisBenedict({ ...baseline, activityFactor: 2 as 1.2 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('activityFactor')
    }
  })

  it('boundary: accepts the minimum and maximum permitted inputs', () => {
    expect(() =>
      calculateHarrisBenedict({ ...baseline, weightKg: 0.5, heightCm: 50, age: 1 }),
    ).not.toThrow()
    expect(() =>
      calculateHarrisBenedict({ ...baseline, weightKg: 300, heightCm: 250, age: 120 }),
    ).not.toThrow()
  })

  it('boundary: a stress factor of exactly one is accepted', () => {
    expect(() => calculateHarrisBenedict({ ...baseline, stressFactor: 1 })).not.toThrow()
  })
})