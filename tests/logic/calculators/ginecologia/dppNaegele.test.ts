import { describe, expect, it } from 'vitest'
import { calculateDppNaegele } from '@/logic/calculators/ginecologia/dppNaegele'
import { CalcValidationError } from '@/logic/types'

describe('calculateDppNaegele', () => {
  /** A reference day 30 days after the LMP, so the 44-week guard never fires. */
const REF = '2025-04-01'

it('adds 280 days to the LMP for a 28-day cycle', () => {
    // 01/03 + 280 = 06/12.
    expect(
      calculateDppNaegele({ dumIso: '2025-03-01', referenceDateIso: REF }).dppFormatted,
    ).toBe('06/12/2025')
  })

  it('matches the textbook Naegele example', () => {
    expect(
      calculateDppNaegele({ dumIso: '2010-08-20', referenceDateIso: '2010-09-19' }).dppFormatted,
    ).toBe('27/05/2011')
  })

  it('treats the cycle as 28 days when it is omitted', () => {
    expect(
      calculateDppNaegele({ dumIso: '2025-03-01', referenceDateIso: REF }).dppFormatted,
    ).toBe(
      calculateDppNaegele({ dumIso: '2025-03-01', cycleDays: 28, referenceDateIso: REF })
        .dppFormatted,
    )
  })

  it('shifts the due date one day per cycle day beyond 28', () => {
    const base = { dumIso: '2025-02-05', referenceDateIso: REF }
    // 05/02 + 280 = 12/11; each cycle day past 28 moves it a day later.
    expect(calculateDppNaegele({ ...base, cycleDays: 28 }).dppFormatted).toBe('12/11/2025')
    expect(calculateDppNaegele({ ...base, cycleDays: 35 }).dppFormatted).toBe('19/11/2025')
    expect(calculateDppNaegele({ ...base, cycleDays: 21 }).dppFormatted).toBe('05/11/2025')
  })

  it('steps the due date by exactly one day per cycle day', () => {
    const base = { dumIso: '2025-02-05', referenceDateIso: REF }
    const shift = (from: number, to: number) => {
      const diff = (br: string) => {
        const [day = 0, month = 1, year = 1970] = br.split('/').map(Number)
        return new Date(year, month - 1, day).getTime()
      }
      return diff(calculateDppNaegele({ ...base, cycleDays: to }).dppFormatted) -
        diff(calculateDppNaegele({ ...base, cycleDays: from }).dppFormatted)
    }
    expect(shift(28, 29)).toBe(86_400_000)
    expect(shift(28, 33)).toBe(5 * 86_400_000)
    expect(shift(28, 22)).toBe(-6 * 86_400_000)
  })

  it('spans a leap day in the LMP year without shifting by a day', () => {
    // 2024 is a leap year, so 29/02 + 280 lands a day earlier than in 2023.
    expect(
      calculateDppNaegele({ dumIso: '2024-02-29', referenceDateIso: '2024-03-30' }).dppFormatted,
    ).toBe('05/12/2024')
    expect(
      calculateDppNaegele({ dumIso: '2024-02-15', referenceDateIso: '2024-03-16' }).dppFormatted,
    ).toBe('21/11/2024')
  })

  it('crosses the year boundary', () => {
    // A December LMP puts the due date in the following year.
    expect(
      calculateDppNaegele({ dumIso: '2025-12-01', referenceDateIso: '2025-12-31' }).dppFormatted,
    ).toBe('07/09/2026')
  })

  it('reports the gestational age in weeks and days', () => {
    const daysAgo = 172 // 24w4d
    const dum = isoDaysAgo(daysAgo)
    const result = calculateDppNaegele({ dumIso: dum })
    expect(result.igDaysAtual).toBe(daysAgo)
    expect(result.igAtual).toBe('24s 4d')
  })

  it('returns the seven prenatal milestones anchored on the LMP', () => {
    const result = calculateDppNaegele({ dumIso: '2025-03-01', referenceDateIso: REF })
    expect(result.milestones).toHaveLength(7)
    // 11s–13s6d = 77 to 97 days from the LMP → 17/05 to 06/06.
    expect(result.milestones[0]?.weekRange).toBe('11s–13s6d')
    expect(result.milestones[0]?.date).toBe('17/05/2025 – 06/06/2025')
    // The due date appears as its own milestone and matches the hero value.
    const dpp = result.milestones.find((m) => m.label === 'Data Provável do Parto')
    expect(dpp?.date).toBe(result.dppFormatted)
    // Post-dates threshold is 42s0d = 294 days after the LMP.
    expect(result.milestones.at(-1)?.date).toBe('20/12/2025')
  })

  it('dates each milestone window from the gestational age it names', () => {
    const result = calculateDppNaegele({ dumIso: '2025-03-01', referenceDateIso: REF })
    const byLabel = new Map(result.milestones.map((m) => [m.label, m.date]))
    // 24s–28s = 168 to 196 days after the LMP of 01/03 → 16/08 to 13/09.
    expect(byLabel.get('Rastreamento de diabetes gestacional (TOTG 75 g)')).toBe(
      '16/08/2025 – 13/09/2025',
    )
    // 37s0d = 259 days.
    expect(byLabel.get('Termo antecipado')).toBe('15/11/2025')
  })

  it('exposes the milestones as sub-results so ResultCard renders them', () => {
    const result = calculateDppNaegele({ dumIso: '2025-03-01', referenceDateIso: REF })
    // Current age plus the seven milestones.
    expect(result.subResults).toHaveLength(8)
    expect(result.subResults?.[0]?.label).toBe('Idade gestacional atual')
    expect(result.subResults?.[1]?.value).toBe(result.milestones[0]?.date)
    expect(result.subResults?.[1]?.unit).toBe('11s–13s6d')
  })

  it.each([
    [7, 'info'],
    [90, 'normal'],
    [266, 'normal'],
    [290, 'attention'],
    [294, 'critical'],
    [308, 'critical'],
  ])('classifies a %i-day-old pregnancy as %s', (days, severity) => {
    expect(calculateDppNaegele({ dumIso: isoDaysAgo(days) }).severity).toBe(severity)
  })

  it('throws for a cycle length outside 21–35 days', () => {
    expect(() => calculateDppNaegele({ dumIso: '2024-06-01', cycleDays: 18 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateDppNaegele({ dumIso: '2024-06-01', cycleDays: 40 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws for a future LMP', () => {
    expect(() => calculateDppNaegele({ dumIso: isoDaysAgo(-10) })).toThrow(
      'A DUM não pode ser uma data futura.',
    )
  })

  it('throws for an LMP older than 44 weeks', () => {
    expect(() => calculateDppNaegele({ dumIso: isoDaysAgo(309) })).toThrow(/44/)
  })

  it('names the offending field for a bad cycle length', () => {
    try {
      calculateDppNaegele({ dumIso: '2025-03-01', cycleDays: 18 })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as CalcValidationError).field).toBe('cycleDays')
    }
  })

  it('boundary: accepts the extreme permitted cycle lengths', () => {
    // A recent LMP, so the 44-week ceiling is not what is under test here.
    const base = { dumIso: isoDaysAgo(30) }
    expect(() => calculateDppNaegele({ ...base, cycleDays: 21 })).not.toThrow()
    expect(() => calculateDppNaegele({ ...base, cycleDays: 35 })).not.toThrow()
  })

  it('boundary: accepts an LMP of exactly 44 weeks', () => {
    expect(() => calculateDppNaegele({ dumIso: isoDaysAgo(308) })).not.toThrow()
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