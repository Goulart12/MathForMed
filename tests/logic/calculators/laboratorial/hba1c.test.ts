import { describe, expect, it } from 'vitest'
import { ADAG_EAG_MGDL, ADAG_EAG_MMOL, calculateHba1c } from '@/logic/calculators/laboratorial/hba1c'
import { CalcValidationError } from '@/logic/types'

describe('calculateHba1c', () => {
  it('returns normal severity below 5.7%', () => {
    const result = calculateHba1c({ hba1cPercent: 5.4 })
    expect(result.label).toBe('HbA1c')
    expect(result.value).toBe(5.4)
    expect(result.unit).toBe('%')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('Normal')
  })

  it('returns critical severity at the diagnostic threshold of 6.5%', () => {
    const result = calculateHba1c({ hba1cPercent: 6.5 })
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Diabetes')
  })

  it('returns attention severity for prediabetes', () => {
    const result = calculateHba1c({ hba1cPercent: 6 })
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Pré-diabetes')
  })

  it('derives the ADAG estimated glucose in both units', () => {
    const result = calculateHba1c({ hba1cPercent: 7 })
    const values = result.subResults
      ?.filter(sub => sub.label === 'Glicose Média Estimada')
      .map(sub => sub.value)
    expect(values).toEqual([154, 8.5])
    expect(result.subResults?.find(sub => sub.unit === 'mg/dL')?.value).toBe(154)
  })

  it('assesses the type 2 diabetes target', () => {
    const onTarget = calculateHba1c({ hba1cPercent: 6.5 }).subResults?.find(
      sub => sub.label === 'Alvo para diabetes tipo 2',
    )
    expect(onTarget?.value).toBe('No alvo')
    expect(onTarget?.severity).toBe('normal')

    const near = calculateHba1c({ hba1cPercent: 7.5 }).subResults?.find(
      sub => sub.label === 'Alvo para diabetes tipo 2',
    )
    expect(near?.value).toBe('Próximo do alvo')
    expect(near?.severity).toBe('attention')

    const off = calculateHba1c({ hba1cPercent: 9 }).subResults?.find(
      sub => sub.label === 'Alvo para diabetes tipo 2',
    )
    expect(off?.value).toBe('Fora do alvo')
    expect(off?.severity).toBe('critical')
  })

  it('throws CalcValidationError for out-of-range HbA1c', () => {
    expect(() => calculateHba1c({ hba1cPercent: 2.9 })).toThrow(CalcValidationError)
    expect(() => calculateHba1c({ hba1cPercent: 20.1 })).toThrow(CalcValidationError)
  })

  it('throws CalcValidationError for a non-finite HbA1c', () => {
    expect(() => calculateHba1c({ hba1cPercent: Number.NaN })).toThrow(CalcValidationError)
  })

  it('names the offending field', () => {
    try {
      calculateHba1c({ hba1cPercent: 99 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('hba1cPercent')
    }
  })

  it('boundary: 5.7% is prediabetes, not normal', () => {
    expect(calculateHba1c({ hba1cPercent: 5.7 }).severity).toBe('attention')
    expect(calculateHba1c({ hba1cPercent: 5.6 }).severity).toBe('normal')
  })

  it('boundary: the 7% treatment target switches from on-target to near-target', () => {
    expect(
      calculateHba1c({ hba1cPercent: 6.9 }).subResults?.find(sub => sub.label === 'Alvo para diabetes tipo 2')
        ?.value,
    ).toBe('No alvo')
    expect(
      calculateHba1c({ hba1cPercent: 7 }).subResults?.find(sub => sub.label === 'Alvo para diabetes tipo 2')
        ?.value,
    ).toBe('Próximo do alvo')
  })

  it('boundary: accepts the minimum and maximum permitted HbA1c', () => {
    expect(() => calculateHba1c({ hba1cPercent: 3 })).not.toThrow()
    expect(() => calculateHba1c({ hba1cPercent: 20 })).not.toThrow()
  })
})

describe('ADAG conversions', () => {
  it('maps the published ADAG reference points', () => {
    expect(ADAG_EAG_MGDL(4)).toBeCloseTo(68.1, 1)
    expect(ADAG_EAG_MGDL(6)).toBeCloseTo(125.5, 1)
    expect(ADAG_EAG_MGDL(7)).toBeCloseTo(154.2, 1)
    expect(ADAG_EAG_MGDL(8)).toBeCloseTo(182.9, 1)
    expect(ADAG_EAG_MGDL(9)).toBeCloseTo(211.6, 1)
    expect(ADAG_EAG_MGDL(10)).toBeCloseTo(240.3, 1)
  })

  it('maps the published ADAG millimole reference points', () => {
    expect(ADAG_EAG_MMOL(4)).toBeCloseTo(3.8, 1)
    expect(ADAG_EAG_MMOL(7)).toBeCloseTo(8.5, 1)
    expect(ADAG_EAG_MMOL(10)).toBeCloseTo(13.3, 1)
  })
})