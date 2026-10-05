import { describe, expect, it } from 'vitest'
import {
  calculateAnionGap,
  interpretDeltaRatio,
} from '@/logic/calculators/laboratorial/anionGap'
import { CalcValidationError } from '@/logic/types'

describe('calculateAnionGap', () => {
  it('returns a normal gap of 12 mEq/L at the reference ceiling', () => {
    const result = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 28 })
    expect(result.label).toBe('Gap Aniônico')
    expect(result.value).toBe(12)
    expect(result.unit).toBe('mEq/L')
    expect(result.severity).toBe('normal')
  })

  it('returns a critical gap above 20 mEq/L', () => {
    const result = calculateAnionGap({ sodium: 140, chloride: 90, bicarbonate: 16 })
    expect(result.value).toBe(34)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('ânions não medidos')
  })

  it('returns attention severity between 12 and 20', () => {
    const result = calculateAnionGap({ sodium: 140, chloride: 105, bicarbonate: 20 })
    expect(result.value).toBe(15)
    expect(result.severity).toBe('attention')
  })

  it('corrects for hypoalbuminaemia when albumin is supplied', () => {
    // AG = 12; correction = 2.5 × (4 − 2) = 5
    const result = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 28, albumin: 2 })
    expect(result.value).toBe(17)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('corrigido pela albumina')
    expect(result.subResults?.map(sub => sub.label)).toContain('Correção pela albumina')
  })

  it('accepts a null albumin as uncorrected', () => {
    const result = calculateAnionGap({
      sodium: 140,
      chloride: 100,
      bicarbonate: 28,
      albumin: null,
    })
    expect(result.value).toBe(12)
    expect(result.interpretation).not.toContain('corrigido pela albumina')
  })

  it('adds a delta ratio only when the corrected gap exceeds 12', () => {
    const normal = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 28 })
    expect(normal.subResults?.find(sub => sub.label === 'Razão delta')).toBeUndefined()

    const elevated = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 20 })
    const delta = elevated.subResults?.find(sub => sub.label === 'Razão delta')
    // (20 − 12) / (24 − 20) = 2
    expect(delta?.value).toBe(2)
    expect(delta?.interpretation).toContain('pura por gap aniônico elevado')
  })

  it('always reports the measured gap as a sub-result', () => {
    const result = calculateAnionGap({ sodium: 140, chloride: 90, bicarbonate: 16 })
    const measured = result.subResults?.find(sub => sub.label === 'Gap Aniônico medido')
    expect(measured?.value).toBe(34)
  })

  it('throws CalcValidationError for out-of-range analytes', () => {
    expect(() => calculateAnionGap({ sodium: 99, chloride: 100, bicarbonate: 24 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateAnionGap({ sodium: 140, chloride: 69, bicarbonate: 24 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 2 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 46 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for out-of-range albumin', () => {
    expect(() =>
      calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 24, albumin: 0.5 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 24, albumin: 6.5 }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-finite albumin', () => {
    expect(() =>
      calculateAnionGap({
        sodium: 140,
        chloride: 100,
        bicarbonate: 24,
        albumin: Number.NaN,
      }),
    ).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 24, albumin: 9 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('albumin')
    }
  })

  it('boundary: a gap of exactly 12 is normal, 12.1 is attention', () => {
    expect(calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 28 }).severity).toBe(
      'normal',
    )
    expect(
      calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 27.9 }).severity,
    ).toBe('attention')
  })

  it('boundary: a gap of exactly 20 is attention, 20.1 is critical', () => {
    // AG = 140 − (100 + HCO₃): HCO₃ 20 gives 20, HCO₃ 19.9 gives 20.1.
    expect(calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 20 }).severity).toBe(
      'attention',
    )
    expect(
      calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 19.9 }).severity,
    ).toBe('critical')
  })
})

describe('interpretDeltaRatio', () => {
  it('reports hyperchloraemic acidosis below 0.4', () => {
    // (13 − 12) / (24 − 10) ≈ 0.07
    const delta = interpretDeltaRatio(13, 10)
    expect(delta.ratio).toBeCloseTo(0.07, 2)
    expect(delta.interpretation).toContain('hiperclorêmica')
    expect(delta.severity).toBe('attention')
  })

  it('reports a mixed disorder between 0.4 and 0.8', () => {
    // (18 − 12) / (24 − 16) = 0.75
    const delta = interpretDeltaRatio(18, 16)
    expect(delta.ratio).toBeCloseTo(0.75, 2)
    expect(delta.interpretation).toContain('Distúrbio misto')
  })

  it('reports a pure elevated anion gap acidosis between 0.8 and 2', () => {
    // (24 − 12) / (24 − 12) = 1
    const delta = interpretDeltaRatio(24, 12)
    expect(delta.ratio).toBe(1)
    expect(delta.interpretation).toContain('pura por gap aniônico elevado')
  })

  it('boundary: a ratio of exactly 0.4 is still a mixed disorder', () => {
    // (16 − 12) / (24 − 14) = 0.4
    expect(interpretDeltaRatio(16, 14).interpretation).toContain('Distúrbio misto')
  })

  it('boundary: a ratio of exactly 2 is still a pure high anion gap acidosis', () => {
    // (20 − 12) / (24 − 20) = 2
    expect(interpretDeltaRatio(20, 20).interpretation).toContain('pura por gap aniônico elevado')
  })

  it('reports a concurrent metabolic alkalosis above 2', () => {
    // (40 − 12) / (24 − 12) ≈ 2.33
    const delta = interpretDeltaRatio(40, 12)
    expect(delta.ratio).toBeCloseTo(2.33, 2)
    expect(delta.interpretation).toContain('alcalose metabólica')
  })

  it('refuses to compute a ratio when bicarbonate is 24 or above', () => {
    const alkalosis = interpretDeltaRatio(30, 26)
    expect(alkalosis.ratio).toBeNull()
    expect(alkalosis.interpretation).toContain('não calculável')
    expect(alkalosis.severity).toBe('attention')
  })
})