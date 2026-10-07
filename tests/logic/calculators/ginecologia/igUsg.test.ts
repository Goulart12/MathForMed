import { describe, expect, it } from 'vitest'
import { calculateIgUsg, crlToGaWeeks } from '@/logic/calculators/ginecologia/igUsg'
import { CalcValidationError } from '@/logic/types'

describe('crlToGaWeeks', () => {
  it('converts a CRL of 25 mm to about 9.1 weeks (Hadlock 1982)', () => {
    // (8.052 × √25 + 23,73) / 7 = 9.14 weeks
    expect(crlToGaWeeks(25)).toBeCloseTo(9.14, 2)
  })

  it('converts a CRL of 48 mm to about 11.4 weeks', () => {
    // (8.052 × √48 + 23,73) / 7 = 11.36 weeks
    expect(crlToGaWeeks(48)).toBeCloseTo(11.36, 2)
  })

  it('converts a CRL of 60 mm to about 12.3 weeks', () => {
    expect(crlToGaWeeks(60)).toBeCloseTo(12.3, 1)
  })

  it('increases monotonically with the CRL', () => {
    expect(crlToGaWeeks(10)).toBeLessThan(crlToGaWeeks(30))
    expect(crlToGaWeeks(30)).toBeLessThan(crlToGaWeeks(70))
  })

  it('throws CalcValidationError outside 2–90 mm', () => {
    expect(() => crlToGaWeeks(1.9)).toThrow(CalcValidationError)
    expect(() => crlToGaWeeks(90.1)).toThrow(CalcValidationError)
  })

  it('boundary: accepts the extremes of the validated range', () => {
    expect(() => crlToGaWeeks(2)).not.toThrow()
    expect(() => crlToGaWeeks(90)).not.toThrow()
  })
})

describe('calculateIgUsg', () => {
  it('returns the corrected due date from a reported age', () => {
    // 12w0d = 84 days, so the LMP is 2024-12-07 and the due date + 280 days.
    const result = calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 12, igDays: 0 })
    expect(result.value).toBe('13/09/2025')
    expect(result.label).toBe('DPP Corrigida pela USG')
    expect(result.severity).toBe('info')
  })

  it('agrees with the CRL route when both describe the same age', () => {
    const byAge = calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 12, igDays: 0 })
    // 12w0d = 84 days; invert Hadlock for the CRL that yields it (~56.0 mm).
    const crlFor84Days = ((84 - 23.73) / 8.052) ** 2
    expect(crlFor84Days).toBeCloseTo(56.03, 1)
    const byCrl = calculateIgUsg({ usgDateIso: '2025-03-01', crlMm: crlFor84Days })
    expect(byCrl.value).toBe(byAge.value)
  })

  it('back-calculates the LMP from the scan', () => {
    const result = calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 12, igDays: 0 })
    const atUsg = result.subResults?.[0]
    expect(atUsg?.value).toBe('12s 0d')
    expect(atUsg?.interpretation).toContain('12s')
  })

  it('reports the current age corrected by the scan', () => {
    const result = calculateIgUsg({
      usgDateIso: isoDaysAgo(56), // 8 weeks ago
      igWeeks: 12,
      igDays: 0,
    })
    expect(result.subResults?.[1]?.value).toBe('20s 0d')
  })

  it('asks for an LMP to judge redating when none is given', () => {
    const result = calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 12 })
    expect(result.severity).toBe('info')
    expect(result.interpretation).toContain('Informe a DUM')
    expect(result.subResults).toHaveLength(2)
  })

  it.each([
    // Scan age in days, ACOG tolerance, discrepancy in days.
    [56, 5, 4, 'normal'],
    [56, 5, 6, 'attention'],
    [84, 7, 7, 'normal'],
    [84, 7, 8, 'attention'],
    [140, 10, 10, 'normal'],
    [140, 10, 11, 'attention'],
    [168, 14, 15, 'attention'],
    [210, 21, 22, 'attention'],
  ])(
    'at %i days scan age, a %i-day discrepancy against a %i-day tolerance is %s',
    (scanAge, _tolerance, discrepancy, severity) => {
      // Build an LMP that sits `discrepancy` days away from the scan's own age.
      const usgDate = isoDaysAgo(30)
      const result = calculateIgUsg({
        usgDateIso: usgDate,
        igWeeks: Math.floor(scanAge / 7),
        igDays: scanAge % 7,
        dumIso: isoDaysAgo(30 + scanAge - discrepancy),
      })
      expect(result.severity).toBe(severity)
    },
  )

  it('says to redate and names the old due date when over tolerance', () => {
    const result = calculateIgUsg({
      usgDateIso: isoDaysAgo(30),
      igWeeks: 12,
      igDays: 0,
      dumIso: isoDaysAgo(30 + 84 - 10),
    })
    expect(result.interpretation).toContain('REEDITAR')
    expect(result.subResults?.at(-1)?.severity).toBe('attention')
  })

  it('says to keep the LMP dating when within tolerance', () => {
    const result = calculateIgUsg({
      usgDateIso: isoDaysAgo(30),
      igWeeks: 12,
      igDays: 0,
      dumIso: isoDaysAgo(30 + 84 - 3),
    })
    expect(result.interpretation).toContain('Manter a datação pela DUM')
    expect(result.subResults?.at(-1)?.severity).toBe('normal')
  })

  it('is symmetric — the direction of the discrepancy does not matter', () => {
    const earlierLmp = calculateIgUsg({
      usgDateIso: isoDaysAgo(30),
      igWeeks: 12,
      igDays: 0,
      dumIso: isoDaysAgo(30 + 84 - 10),
    })
    const laterLmp = calculateIgUsg({
      usgDateIso: isoDaysAgo(30),
      igWeeks: 12,
      igDays: 0,
      dumIso: isoDaysAgo(30 + 84 + 10),
    })
    expect(earlierLmp.severity).toBe('attention')
    expect(laterLmp.severity).toBe('attention')
  })

  it('prefers the CRL when both are supplied', () => {
    const result = calculateIgUsg({
      usgDateIso: '2025-03-01',
      igWeeks: 20,
      crlMm: 48,
    })
    expect(result.subResults?.[0]?.interpretation).toContain('CCN')
  })

  it('throws when neither an age nor a CRL is given', () => {
    expect(() => calculateIgUsg({ usgDateIso: '2025-03-01' })).toThrow(/semanas e dias/)
  })

  it('throws for a scan date in the future', () => {
    expect(() => calculateIgUsg({ usgDateIso: isoDaysAgo(-5), igWeeks: 10 })).toThrow(
      'A data da USG não pode ser futura.',
    )
  })

  it('throws for an out-of-range reported age', () => {
    expect(() => calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 42 })).toThrow(
      CalcValidationError,
    )
    expect(() =>
      calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 10, igDays: 7 }),
    ).toThrow(CalcValidationError)
  })

  it('publishes the six ACOG tolerance bands', () => {
    const result = calculateIgUsg({ usgDateIso: '2025-03-01', igWeeks: 12 })
    expect(result.references).toHaveLength(6)
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