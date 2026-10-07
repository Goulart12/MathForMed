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

  it('computes the same age from the due date', () => {
    const result = calculateIdadeGestacional({
      dppIso: '2025-10-08', // the 280-day due date for an LMP of 2025-01-01
      referenceDateIso: '2025-04-09',
    })
    expect(result.value).toBe('14s 0d')
  })

  it('agrees between the two entry points', () => {
    const fromDum = calculateIdadeGestacional({
      dumIso: '2025-06-10',
      referenceDateIso: '2025-08-01',
    })
    const fromDpp = calculateIdadeGestacional({
      dppIso: '2026-03-17',
      referenceDateIso: '2025-08-01',
    })
    expect(fromDpp.value).toBe(fromDum.value)
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

  it('reports the due date and the time remaining', () => {
    const result = calculateIdadeGestacional({
      dumIso: '2025-01-01',
      referenceDateIso: '2025-04-09',
    })
    expect(result.subResults).toHaveLength(3)
    expect(result.subResults?.[1]?.value).toBe('08/10/2025')
    // 182 days from 2025-04-09 to the due date = 26w0d.
    expect(result.subResults?.[2]?.value).toBe('26s 0d')
  })

  it('marks the time remaining as past-DPP once the due date passes', () => {
    const result = calculateIdadeGestacional({ dumIso: isoDaysAgo(290) })
    expect(result.subResults?.[2]?.value).toBe('Pós-DPP')
    expect(result.subResults?.[2]?.severity).toBe('attention')
  })

  it('throws when neither the LMP nor the due date is given', () => {
    expect(() => calculateIdadeGestacional({})).toThrow(/DUM ou a DPP/)
  })

  it('throws when the reference date precedes the LMP', () => {
    expect(() =>
      calculateIdadeGestacional({ dumIso: '2025-06-01', referenceDateIso: '2025-01-01' }),
    ).toThrow(/anterior à DUM/)
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