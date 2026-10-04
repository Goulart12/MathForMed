import { describe, expect, it } from 'vitest'
import {
  calculateGlasgow,
  EYES_SCALE,
  GLASGOW_MAX,
  GLASGOW_MIN,
  MOTOR_SCALE,
  VERBAL_SCALE,
} from '@/logic/calculators/emergencia/glasgow'
import { CalcValidationError } from '@/logic/types'

describe('calculateGlasgow', () => {
  it('returns 15 for a fully responsive patient', () => {
    const result = calculateGlasgow({ eyes: 4, verbal: 5, motor: 6 })
    expect(result.label).toBe('Glasgow Coma Scale')
    expect(result.value).toBe(15)
    expect(result.unit).toBe('points')
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Mild TBI')
  })

  it('returns 3 for the lowest possible score, which is critical', () => {
    const result = calculateGlasgow({ eyes: 1, verbal: 1, motor: 1 })
    expect(result.value).toBe(GLASGOW_MIN)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Severe TBI')
    expect(result.interpretation).toContain('coma')
  })

  it('grades a total of 9 as moderate TBI', () => {
    // E2 V1 M6 = 9
    const result = calculateGlasgow({ eyes: 2, verbal: 1, motor: 6 })
    expect(result.value).toBe(9)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Moderate TBI')
  })

  it('reports each component with its descriptor', () => {
    const result = calculateGlasgow({ eyes: 3, verbal: 4, motor: 5 })
    expect(result.subResults?.map(sub => sub.label)).toEqual([
      'Eye opening',
      'Verbal response',
      'Motor response',
    ])
    expect(result.subResults?.[0].interpretation).toBe('To verbal stimulus')
    expect(result.subResults?.[1].interpretation).toBe('Confused conversation')
    expect(result.subResults?.[2].interpretation).toBe('Localises pain')
  })

  it('throws CalcValidationError for out-of-range component scores', () => {
    expect(() => calculateGlasgow({ eyes: 5 as 4, verbal: 5, motor: 6 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateGlasgow({ eyes: 4, verbal: 6 as 5, motor: 6 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateGlasgow({ eyes: 4, verbal: 5, motor: 7 as 6 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for a score below 1', () => {
    expect(() => calculateGlasgow({ eyes: 0 as 1, verbal: 5, motor: 6 })).toThrow(
      CalcValidationError,
    )
  })

  it('names the offending component field', () => {
    try {
      calculateGlasgow({ eyes: 4, verbal: 9 as 5, motor: 6 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('verbal')
    }
  })

  it('boundary: 13 is mild, 12 is moderate', () => {
    // E4 V4 M5 = 13
    expect(calculateGlasgow({ eyes: 4, verbal: 4, motor: 5 }).severity).toBe('attention')
    // E4 V3 M5 = 12
    expect(calculateGlasgow({ eyes: 4, verbal: 3, motor: 5 }).interpretation).toContain(
      'Moderate TBI',
    )
  })

  it('boundary: 9 is moderate, 8 is severe', () => {
    expect(calculateGlasgow({ eyes: 2, verbal: 1, motor: 6 }).interpretation).toContain(
      'Moderate',
    )
    expect(calculateGlasgow({ eyes: 2, verbal: 1, motor: 5 }).interpretation).toContain('Severe')
  })

  it('boundary: accepts the maximum score', () => {
    expect(GLASGOW_MAX).toBe(15)
    expect(calculateGlasgow({ eyes: 4, verbal: 5, motor: 6 }).value).toBe(GLASGOW_MAX)
  })
})

describe('GCS scales', () => {
  it('describes every eye score, highest first', () => {
    expect(EYES_SCALE.map(scale => scale.score)).toEqual([4, 3, 2, 1])
    expect(EYES_SCALE[0].label).toBe('Spontaneous')
  })

  it('describes every verbal and motor score, highest first', () => {
    expect(VERBAL_SCALE.map(scale => scale.score)).toEqual([5, 4, 3, 2, 1])
    expect(MOTOR_SCALE.map(scale => scale.score)).toEqual([6, 5, 4, 3, 2, 1])
    expect(MOTOR_SCALE[5].label).toBe('No motor response')
  })
})