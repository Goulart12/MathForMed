import { describe, expect, it } from 'vitest'
import { calculateIdadeGestacional } from '@/logic/calculators/ginecologia/idadeGestacional'

describe('calculateIdadeGestacional', () => {
  it('computes the age from the LMP at a fixed reference date', () => {
    const result = calculateIdadeGestacional({
      dumIso: '2025-01-01',
      referenceDateIso: '2025-04-09', // 98 days = 14w0d
    })
    expect(result.value).toBe('14s 0d')
    expect(result.label).toBe('Idade Gestacional')
  })

  it('leaves the remaining days as the remainder of the week', () => {
    const result = calculateIdadeGestacional({
      dumIso: '2025-01-01',
      referenceDateIso: '2025-04-11', // 100 days = 14w2d
    })
    expect(result.value).toBe('14s 2d')
  })

  it.each([
    [50, '1º trimestre'],
    [98, '2º trimestre'],
    [196, '3º trimestre'],
    [280, '3º trimestre'],
  ])('assigns a %i-day pregnancy to the %s', (days, trimester) => {
    const result = calculateIdadeGestacional({
      dumIso: isoDaysAgo(days),
      referenceDateIso: isoDaysAgo(0),
    })
    expect(result.subResults?.[0]?.value).toBe(trimester)
  })

  it('defaults the reference date to today', () => {
    const result = calculateIdadeGestacional({ dumIso: isoDaysAgo(70) })
    expect(result.value).toBe('10s 0d')
  })

  it.each([
    [5, 'info'],
    [100, 'normal'],
    [266, 'normal'],
    [283, 'attention'],
    [294, 'critical'],
  ])('classifies a %i-day-old pregnancy as %s', (days, severity) => {
    expect(calculateIdadeGestacional({ dumIso: isoDaysAgo(days) }).severity).toBe(severity)
  })

  it('reports the trimester as the only sub-result', () => {
    const result = calculateIdadeGestacional({
      dumIso: '2025-01-01',
      referenceDateIso: '2025-04-09',
    })
    expect(result.subResults).toHaveLength(1)
    expect(result.subResults?.[0]?.label).toBe('Trimestre')
    expect(result.subResults?.[0]?.value).toBe('2º trimestre')
  })

  it('counts the time remaining to term instead of a due date', () => {
    const result = calculateIdadeGestacional({ dumIso: isoDaysAgo(70) }) // 10w0d
    expect(result.interpretation).toContain('Faltam 30 semanas e 0 dias para 40s0d')
    expect(result.interpretation).not.toMatch(/DPP|parto/i)
  })

  it('flags post-term gestations without a due date', () => {
    const result = calculateIdadeGestacional({ dumIso: isoDaysAgo(294) }) // 42w0d
    expect(result.interpretation).toContain('Pós-datismo')
    expect(result.interpretation).not.toMatch(/DPP/i)
  })

  it('throws when the LMP is missing', () => {
    expect(() => calculateIdadeGestacional({})).toThrow(/Informe a DUM/)
  })

  it('no longer accepts a due date as the dating source', () => {
    // `dppIso` was removed from the payload; a caller still sending it must fail
    // loudly rather than be silently ignored.
    expect(() => calculateIdadeGestacional({ dppIso: '2025-10-08' } as never)).toThrow(
      /Informe a DUM/,
    )
  })

  it('throws when the reference date precedes the LMP', () => {
    expect(() =>
      calculateIdadeGestacional({ dumIso: '2025-06-01', referenceDateIso: '2025-01-01' }),
    ).toThrow(/anterior à DUM/)
  })

  describe('ultrasound mode', () => {
    it('delegates to the ultrasound dating calculation', () => {
      // 12w0d at the scan fixes the LMP at 2024-12-07 and the due date 280
      // days later.
      const result = calculateIdadeGestacional({
        usgDateIso: '2025-03-01',
        igWeeks: 12,
        igDays: 0,
      })
      expect(result.value).toBe('13/09/2025')
      expect(result.label).toBe('DPP Corrigida pela USG')
      expect(result.severity).toBe('info')
    })

    it('accepts a crown-rump length instead of a reported age', () => {
      const result = calculateIdadeGestacional({ usgDateIso: '2025-03-01', crlMm: 48 })
      expect(result.subResults?.[0]?.interpretation).toContain('Hadlock')
    })

    it('compares the scan with the LMP when both are given', () => {
      const result = calculateIdadeGestacional({
        usgDateIso: '2025-03-01',
        igWeeks: 12,
        igDays: 0,
        dumIso: '2024-12-01',
      })
      expect(result.subResults?.some((sub) => sub.label === 'Discrepância USG vs DUM')).toBe(true)
    })
  })
})

/** An ISO date exactly `days` before today (negative for a future date). */
function isoDaysAgo(days: number): string {
  const base = new Date()
  base.setHours(12, 0, 0, 0)
  base.setDate(base.getDate() - days)
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${base.getFullYear()}-${m}-${d}`
}
