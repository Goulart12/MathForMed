import { describe, expect, it } from 'vitest'
import { calculateBmi, classifyBmi, BMI_REFERENCES } from '@/logic/calculators/antropometria/imc'
import { CalcValidationError } from '@/logic/types'

describe('calculateBmi', () => {
  it('returns a normal result for BMI 22.1', () => {
    const result = calculateBmi({ weightKg: 70, heightM: 1.78 })
    expect(result.value).toBeCloseTo(22.1, 1)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toBeTruthy()
    expect(result.label).toBe('Índice de Massa Corporal')
    expect(result.unit).toBe('kg/m²')
    expect(result.references).toEqual(BMI_REFERENCES)
  })

  it('returns critical for class III obesity', () => {
    const result = calculateBmi({ weightKg: 130, heightM: 1.7 })
    expect(result.value).toBeCloseTo(45, 1)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Obesidade grau III')
  })

  it('returns critical for class II obesity', () => {
    const result = calculateBmi({ weightKg: 90, heightM: 1.6 })
    expect(result.value).toBeCloseTo(35.2, 1)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Obesidade grau II')
  })

  it('returns attention for class I obesity and overweight', () => {
    expect(calculateBmi({ weightKg: 92, heightM: 1.75 }).severity).toBe('attention')
    expect(calculateBmi({ weightKg: 80, heightM: 1.75 }).interpretation).toContain('Sobrepeso')
  })

  it('returns attention for underweight', () => {
    const result = calculateBmi({ weightKg: 45, heightM: 1.8 })
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Baixo peso')
  })

  it('throws CalcValidationError for zero height', () => {
    expect(() => calculateBmi({ weightKg: 70, heightM: 0 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError with the correct field name', () => {
    try {
      calculateBmi({ weightKg: 70, heightM: 0 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('heightM')
    }
  })

  it('throws for out-of-range weight', () => {
    expect(() => calculateBmi({ weightKg: 0.2, heightM: 1.7 })).toThrow(CalcValidationError)
    expect(() => calculateBmi({ weightKg: 400, heightM: 1.7 })).toThrow(CalcValidationError)
  })

  it('boundary: BMI of exactly 18.5 is normal weight', () => {
    const result = calculateBmi({ weightKg: 18.5, heightM: 1 })
    expect(result.value).toBe(18.5)
    expect(result.severity).toBe('normal')
  })

  it('boundary: BMI of exactly 25.0 is overweight (attention)', () => {
    const result = calculateBmi({ weightKg: 25, heightM: 1 })
    expect(result.value).toBe(25)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Sobrepeso')
  })

  it('boundary: BMI of exactly 40.0 is class III obesity (critical)', () => {
    const result = calculateBmi({ weightKg: 40, heightM: 1 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Obesidade grau III')
  })

  it('accepts the minimum and maximum permitted inputs', () => {
    expect(() => calculateBmi({ weightKg: 0.5, heightM: 0.3 })).not.toThrow()
    expect(() => calculateBmi({ weightKg: 300, heightM: 2.5 })).not.toThrow()
  })
})

describe('classifyBmi', () => {
  it('classifies each WHO band', () => {
    expect(classifyBmi(15).label).toBe('Baixo peso')
    expect(classifyBmi(22).label).toBe('Peso normal')
    expect(classifyBmi(27).label).toBe('Sobrepeso')
    expect(classifyBmi(32).label).toBe('Obesidade grau I')
    expect(classifyBmi(37).label).toBe('Obesidade grau II')
    expect(classifyBmi(50).label).toBe('Obesidade grau III')
  })

  it('falls back to the top band for a non-finite value', () => {
    expect(classifyBmi(Number.POSITIVE_INFINITY).label).toBe('Obesidade grau III')
  })
})