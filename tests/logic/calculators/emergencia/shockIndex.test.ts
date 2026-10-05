import { describe, expect, it } from 'vitest'
import { calculateShockIndex } from '@/logic/calculators/emergencia/shockIndex'
import { CalcValidationError } from '@/logic/types'

describe('calculateShockIndex', () => {
  it('returns a normal result for 80 bpm at 130 mmHg', () => {
    const result = calculateShockIndex({ heartRate: 80, sysBp: 130 })
    expect(result.label).toBe('Índice de Choque')
    expect(result.value).toBeCloseTo(0.62, 2)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('limítrofe')
  })

  it('returns normal severity below 0.6', () => {
    const result = calculateShockIndex({ heartRate: 70, sysBp: 140 })
    expect(result.value).toBeCloseTo(0.5, 2)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('hemodinâmica estável')
  })

  it('returns critical severity at or above 1.0', () => {
    const result = calculateShockIndex({ heartRate: 110, sysBp: 80 })
    expect(result.value).toBeCloseTo(1.38, 2)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('choque moderado')
    expect(result.interpretation).toContain('mortalidade marcadamente elevada')
  })

  it('grades an index above 1.4 as severe shock', () => {
    const result = calculateShockIndex({ heartRate: 160, sysBp: 90 })
    expect(result.value).toBeCloseTo(1.78, 2)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('choque grave')
  })

  it('throws CalcValidationError for out-of-range heart rate', () => {
    expect(() => calculateShockIndex({ heartRate: 19, sysBp: 100 })).toThrow(CalcValidationError)
    expect(() => calculateShockIndex({ heartRate: 251, sysBp: 100 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range systolic pressure', () => {
    expect(() => calculateShockIndex({ heartRate: 80, sysBp: 39 })).toThrow(CalcValidationError)
    expect(() => calculateShockIndex({ heartRate: 80, sysBp: 301 })).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateShockIndex({ heartRate: 999, sysBp: 100 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('heartRate')
    }
  })

  it('boundary: an index of exactly 0.6 is borderline', () => {
    const result = calculateShockIndex({ heartRate: 78, sysBp: 130 })
    expect(result.value).toBeCloseTo(0.6, 2)
    expect(result.severity).toBe('attention')
  })

  it('boundary: an index of exactly 1.0 is moderate shock', () => {
    const result = calculateShockIndex({ heartRate: 100, sysBp: 100 })
    expect(result.value).toBeCloseTo(1, 2)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('choque moderado')
  })

  it('boundary: accepts the minimum and maximum vital signs', () => {
    expect(() => calculateShockIndex({ heartRate: 20, sysBp: 300 })).not.toThrow()
    expect(() => calculateShockIndex({ heartRate: 250, sysBp: 40 })).not.toThrow()
  })
})