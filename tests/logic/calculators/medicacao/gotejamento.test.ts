import { describe, expect, it } from 'vitest'
import {
  calculateDripRate,
  DROP_FACTOR,
} from '@/logic/calculators/medicacao/gotejamento'
import { CalcValidationError } from '@/logic/types'

describe('calculateDripRate', () => {
  it('returns 42 gtt/min for 500 mL over 4 h on macrodrip', () => {
    const result = calculateDripRate({ volumeMl: 500, timeMins: 240, tubingType: 'macro' })
    expect(result.label).toBe('Drip Rate')
    expect(result.value).toBe(42)
    expect(result.unit).toBe('gtt/min')
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('20 gtt/mL')
  })

  it('returns the mL/h flow rate as a sub-result', () => {
    const result = calculateDripRate({ volumeMl: 500, timeMins: 240, tubingType: 'macro' })
    expect(result.subResults?.find(sub => sub.label === 'Flow Rate')?.value).toBe(125)
  })

  it('triples the drop rate on microdrip for the same volume and time', () => {
    const macro = calculateDripRate({ volumeMl: 100, timeMins: 60, tubingType: 'macro' })
    const micro = calculateDripRate({ volumeMl: 100, timeMins: 60, tubingType: 'micro' })
    expect(macro.value).toBe(33)
    expect(micro.value).toBe(100)
  })

  it('rounds the drop rate to whole drops per minute', () => {
    const result = calculateDripRate({ volumeMl: 1, timeMins: 1, tubingType: 'micro' })
    expect(Number.isInteger(result.value)).toBe(true)
  })

  it('exposes the drop factor used', () => {
    const result = calculateDripRate({ volumeMl: 500, timeMins: 240, tubingType: 'micro' })
    expect(result.subResults?.find(sub => sub.label === 'Drop Factor')?.value).toBe(
      DROP_FACTOR.micro,
    )
  })

  it('throws CalcValidationError for an unknown tubing type', () => {
    expect(() =>
      calculateDripRate({ volumeMl: 500, timeMins: 240, tubingType: 'pediatric' as 'macro' }),
    ).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for out-of-range volume and time', () => {
    expect(() => calculateDripRate({ volumeMl: 0, timeMins: 60, tubingType: 'macro' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateDripRate({ volumeMl: 5001, timeMins: 60, tubingType: 'macro' })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateDripRate({ volumeMl: 500, timeMins: 0, tubingType: 'macro' })).toThrow(
      CalcValidationError,
    )
    expect(() =>
      calculateDripRate({ volumeMl: 500, timeMins: 10081, tubingType: 'macro' }),
    ).toThrow(CalcValidationError)
  })

  it('boundary: accepts the minimum and maximum permitted volume and time', () => {
    expect(() => calculateDripRate({ volumeMl: 1, timeMins: 1, tubingType: 'macro' })).not.toThrow()
    expect(() =>
      calculateDripRate({ volumeMl: 5000, timeMins: 10080, tubingType: 'micro' }),
    ).not.toThrow()
  })

  it('boundary: full 7-day duration at the volume ceiling', () => {
    const result = calculateDripRate({ volumeMl: 5000, timeMins: 10080, tubingType: 'macro' })
    expect(result.value).toBe(10)
    expect(result.interpretation).toContain('168 h')
  })
})