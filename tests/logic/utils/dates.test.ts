import { describe, expect, it } from 'vitest'
import {
  addDays,
  decomposeGA,
  diffDays,
  formatBR,
  formatGA,
  formatIso,
  gaStringToDays,
  parseIsoDate,
  today,
} from '@/logic/utils/dates'

describe('parseIsoDate', () => {
  it('parses an ISO date at local midnight', () => {
    const date = parseIsoDate('2025-03-01')
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(1)
    expect(date.getHours()).toBe(0)
  })

  it('accepts a leap day', () => {
    expect(parseIsoDate('2024-02-29').getDate()).toBe(29)
  })

  it('throws RangeError for an unparseable date', () => {
    expect(() => parseIsoDate('not-a-date')).toThrow(RangeError)
  })
})

describe('formatBR', () => {
  it('formats as DD/MM/YYYY with zero padding', () => {
    expect(formatBR(parseIsoDate('2025-03-01'))).toBe('01/03/2025')
    expect(formatBR(parseIsoDate('2025-12-25'))).toBe('25/12/2025')
  })
})

describe('formatIso', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(formatIso(parseIsoDate('2025-03-01'))).toBe('2025-03-01')
    expect(formatIso(parseIsoDate('2025-11-09'))).toBe('2025-11-09')
  })

  it('round-trips through parseIsoDate', () => {
    for (const iso of ['2025-01-31', '2024-02-29', '2023-12-25']) {
      expect(formatIso(parseIsoDate(iso))).toBe(iso)
    }
  })
})

describe('today', () => {
  it('returns midnight, discarding the time of day', () => {
    const now = today()
    expect(now.getHours()).toBe(0)
    expect(now.getMinutes()).toBe(0)
    expect(now.getSeconds()).toBe(0)
  })
})

describe('addDays', () => {
  it('adds days across a month boundary', () => {
    expect(formatIso(addDays(parseIsoDate('2025-01-31'), 1))).toBe('2025-02-01')
  })

  it('subtracts days given a negative count', () => {
    expect(formatIso(addDays(parseIsoDate('2025-01-01'), -1))).toBe('2024-12-31')
  })

  it('crosses a leap day', () => {
    expect(formatIso(addDays(parseIsoDate('2024-02-28'), 1))).toBe('2024-02-29')
    expect(formatIso(addDays(parseIsoDate('2024-02-28'), 2))).toBe('2024-03-01')
  })

  it('does not mutate its argument', () => {
    const original = parseIsoDate('2025-03-01')
    addDays(original, 10)
    expect(formatIso(original)).toBe('2025-03-01')
  })
})

describe('diffDays', () => {
  it('is positive when the first date is later', () => {
    expect(diffDays(parseIsoDate('2025-03-11'), parseIsoDate('2025-03-01'))).toBe(10)
  })

  it('is negative when the first date is earlier', () => {
    expect(diffDays(parseIsoDate('2025-03-01'), parseIsoDate('2025-03-11'))).toBe(-10)
  })

  it('is zero for the same day', () => {
    expect(diffDays(parseIsoDate('2025-03-01'), parseIsoDate('2025-03-01'))).toBe(0)
  })

  it('is unaffected by the time of day', () => {
    const morning = new Date(2025, 2, 1, 0, 0)
    const night = new Date(2025, 2, 1, 23, 59)
    expect(diffDays(night, morning)).toBe(0)
  })

  it('counts a whole year', () => {
    expect(diffDays(parseIsoDate('2026-01-01'), parseIsoDate('2025-01-01'))).toBe(365)
    expect(diffDays(parseIsoDate('2025-01-01'), parseIsoDate('2024-01-01'))).toBe(366)
  })

  it('counts the leap day when the span includes it', () => {
    expect(diffDays(parseIsoDate('2025-01-01'), parseIsoDate('2024-03-01'))).toBe(306)
  })
})

describe('decomposeGA', () => {
  it.each([
    [0, 0, 0],
    [98, 14, 0],
    [100, 14, 2],
    [279, 39, 6],
    [280, 40, 0],
  ])('splits %i days into %iw %id', (total, weeks, days) => {
    expect(decomposeGA(total)).toEqual({ weeks, days })
  })
})

describe('formatGA', () => {
  it('renders semanas and dias', () => {
    expect(formatGA(100)).toBe('14s 2d')
    expect(formatGA(280)).toBe('40s 0d')
  })
})

describe('gaStringToDays', () => {
  it('inverts decomposeGA', () => {
    for (const total of [0, 7, 98, 100, 294]) {
      const { weeks, days } = decomposeGA(total)
      expect(gaStringToDays(weeks, days)).toBe(total)
    }
  })
})