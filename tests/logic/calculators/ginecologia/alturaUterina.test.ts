import { describe, expect, it } from 'vitest'
import {
  calculateAlturaUterina,
  expectedAuByMcDonald,
} from '@/logic/calculators/ginecologia/alturaUterina'
import { CalcValidationError } from '@/logic/types'

describe('calculateAlturaUterina', () => {
  it('classifies a measurement equal to the gestational age as normal', () => {
    const result = calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 28 })
    expect(result.severity).toBe('normal')
    expect(result.value).toBe('+0.0')
    expect(result.unit).toBe('cm')
  })

  it('treats a difference of exactly 2 cm as normal', () => {
    expect(calculateAlturaUterina({ alturaUterinaCm: 30, igSemanas: 28 }).severity).toBe('normal')
    expect(calculateAlturaUterina({ alturaUterinaCm: 26, igSemanas: 28 }).severity).toBe('normal')
  })

  it('escalates to attention just past the 2 cm window', () => {
    expect(calculateAlturaUterina({ alturaUterinaCm: 31, igSemanas: 28 }).severity).toBe('attention')
    expect(calculateAlturaUterina({ alturaUterinaCm: 25, igSemanas: 28 }).severity).toBe('attention')
  })

  it('never renders a negative zero', () => {
    // A sub-half-centimetre difference rounds to zero; the sign must not leak.
    const result = calculateAlturaUterina({ alturaUterinaCm: 28.01, igSemanas: 28 })
    expect(result.value).toBe('+0.0')
    expect(result.value).not.toContain('-')
  })

  it.each([
    [25, 28, 'attention', 'pequena'],
    [31, 28, 'attention', 'grande'],
    [23, 28, 'critical', 'muito pequena'],
    [33, 28, 'critical', 'muito grande'],
  ])('classifies %i cm at %i weeks as %s (%s)', (au, weeks, severity, label) => {
    const result = calculateAlturaUterina({ alturaUterinaCm: au, igSemanas: weeks })
    expect(result.severity).toBe(severity)
    expect(result.label.toLowerCase()).toContain(label)
  })

  it('flags a small measurement as possible growth restriction', () => {
    const result = calculateAlturaUterina({ alturaUterinaCm: 23, igSemanas: 28 })
    expect(result.interpretation).toContain('RCIU')
  })

  it('signs the delta and reports its magnitude', () => {
    expect(calculateAlturaUterina({ alturaUterinaCm: 31, igSemanas: 28 }).value).toBe('+3.0')
    expect(calculateAlturaUterina({ alturaUterinaCm: 25, igSemanas: 28 }).value).toBe('-3.0')
  })

  it('accepts a fractional measurement', () => {
    expect(calculateAlturaUterina({ alturaUterinaCm: 27.5, igSemanas: 28 }).value).toBe('-0.5')
    expect(calculateAlturaUterina({ alturaUterinaCm: 27.5, igSemanas: 28 }).severity).toBe('normal')
  })

  it.each([16, 19, 37, 42])(
    'reports age %i weeks as outside the window, without classifying it',
    (weeks) => {
      const result = calculateAlturaUterina({ alturaUterinaCm: weeks, igSemanas: weeks })
      expect(result.severity).toBe('info')
      expect(result.label).toContain('Fora da janela')
    },
  )

  it('applies the window at both boundaries', () => {
    expect(calculateAlturaUterina({ alturaUterinaCm: 20, igSemanas: 20 }).severity).toBe('normal')
    expect(calculateAlturaUterina({ alturaUterinaCm: 36, igSemanas: 36 }).severity).toBe('normal')
  })

  it('names the measurement and the expected range as sub-results', () => {
    const result = calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 28 })
    expect(result.subResults).toHaveLength(2)
    expect(result.subResults?.[0]?.value).toBe(28)
    expect(result.subResults?.[1]?.value).toBe(28)
    expect(result.subResults?.[1]?.interpretation).toContain('26 a 30')
  })

  it('publishes reference bands whose bounds match the classification', () => {
    const result = calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 28 })
    expect(result.references).toHaveLength(5)
    // The bands must leave no gap: ±2 around 28 covers 26–30.
    const adequate = result.references?.find((r) => r.severity === 'normal')
    expect(adequate?.min).toBe(26)
    expect(adequate?.max).toBe(30)
  })

  it('throws CalcValidationError for a measurement outside 10–50 cm', () => {
    expect(() => calculateAlturaUterina({ alturaUterinaCm: 9, igSemanas: 28 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateAlturaUterina({ alturaUterinaCm: 51, igSemanas: 28 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for an age outside 16–42 weeks', () => {
    expect(() => calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 15 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 43 })).toThrow(
      CalcValidationError,
    )
    expect(() =>
      calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 28, igDias: 7 }),
    ).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateAlturaUterina({ alturaUterinaCm: 5, igSemanas: 28 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('alturaUterinaCm')
    }
  })
})

describe('expectedAuByMcDonald', () => {
  it('expects one centimetre per week', () => {
    expect(expectedAuByMcDonald(20)).toBe(20)
    expect(expectedAuByMcDonald(36)).toBe(36)
  })
})