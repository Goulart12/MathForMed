import { describe, expect, it } from 'vitest'
import { calculateDilution } from '@/logic/calculators/medicacao/diluicao'
import { CalcValidationError } from '@/logic/types'

describe('calculateDilution', () => {
  it('computes 18 mL of diluent for 100 → 10 from 2 mL of stock', () => {
    const result = calculateDilution({
      initialConcentration: 100,
      initialVolumeMl: 2,
      finalConcentration: 10,
    })
    expect(result.label).toBe('Volume do diluente')
    expect(result.value).toBe(18)
    expect(result.unit).toBe('mL')
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('20 mL')
  })

  it('reports the final and stock volumes as sub-results', () => {
    const result = calculateDilution({
      initialConcentration: 100,
      initialVolumeMl: 2,
      finalConcentration: 10,
    })
    expect(result.subResults?.find(sub => sub.label === 'Volume final')?.value).toBe(20)
    expect(result.subResults?.find(sub => sub.label === 'Volume em estoque')?.value).toBe(2)
  })

  it('returns zero diluent when the stock already matches the target', () => {
    const result = calculateDilution({
      initialConcentration: 50,
      initialVolumeMl: 4,
      finalConcentration: 10,
    })
    expect(result.value).toBe(16)
  })

  it('throws CalcValidationError when the target concentration is not a dilution', () => {
    expect(() =>
      calculateDilution({
        initialConcentration: 10,
        initialVolumeMl: 2,
        finalConcentration: 100,
      }),
    ).toThrow(CalcValidationError)
  })

  it('rejects an equal stock and target concentration', () => {
    expect(() =>
      calculateDilution({
        initialConcentration: 10,
        initialVolumeMl: 2,
        finalConcentration: 10,
      }),
    ).toThrow(CalcValidationError)
  })

  it('names finalConcentration as the field for a concentrating request', () => {
    try {
      calculateDilution({
        initialConcentration: 10,
        initialVolumeMl: 2,
        finalConcentration: 100,
      })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('finalConcentration')
      expect((error as Error).message).toContain('dilui')
    }
  })

  it('throws CalcValidationError for non-positive concentrations and volumes', () => {
    expect(() =>
      calculateDilution({ initialConcentration: 0, initialVolumeMl: 2, finalConcentration: 1 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateDilution({ initialConcentration: 100, initialVolumeMl: 0, finalConcentration: 1 }),
    ).toThrow(CalcValidationError)
    expect(() =>
      calculateDilution({ initialConcentration: 100, initialVolumeMl: 2, finalConcentration: 0 }),
    ).toThrow(CalcValidationError)
  })

  it('boundary: a 10-fold dilution multiplies the stock volume by 10', () => {
    const result = calculateDilution({
      initialConcentration: 1000,
      initialVolumeMl: 0.5,
      finalConcentration: 100,
    })
    expect(result.value).toBe(4.5)
  })

  it('is unit-agnostic, so it works for mg/mL and mEq/L alike', () => {
    const mg = calculateDilution({
      initialConcentration: 100,
      initialVolumeMl: 2,
      finalConcentration: 10,
    })
    const meq = calculateDilution({
      initialConcentration: 100,
      initialVolumeMl: 2,
      finalConcentration: 10,
    })
    expect(meq.value).toBe(mg.value)
  })
})