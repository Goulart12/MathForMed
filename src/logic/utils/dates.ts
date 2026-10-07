/**
 * Calendar-date helpers for the obstetric calculators.
 *
 * Every function works on **local calendar dates**, never on instants: a due
 * date is a day on a wall calendar, not a moment in time, so a timezone shift
 * must never move it. Dates cross the module boundary as ISO 8601
 * (`YYYY-MM-DD`) strings — the only date format `<input type="date">` and
 * `JSON.stringify` both agree on — and are held internally as native `Date`
 * objects pinned to midnight local time.
 *
 * @module logic/utils/dates
 */

/** Milliseconds in one day, for the arithmetic below. */
const MS_PER_DAY = 86_400_000

/**
 * Parses an ISO 8601 date string (`YYYY-MM-DD`) into midnight local time.
 *
 * @param iso - Calendar date, e.g. `'2025-03-01'`.
 * @returns A `Date` at 00:00:00.000 local time on that day.
 * @throws {RangeError} When the string is not a `YYYY-MM-DD` date.
 */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new RangeError(`Data inválida: "${iso}"`)
  }
  const date = new Date(year, month - 1, day)
  // Rejects values like `2025-13-01`, which JS would silently roll over.
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month - 1) {
    throw new RangeError(`Data inválida: "${iso}"`)
  }
  return date
}

/**
 * Formats a date as `DD/MM/YYYY`, the convention the pt-BR reader expects.
 *
 * @param date - The date to render.
 * @returns The formatted date, e.g. `'05/12/2025'`.
 */
export function formatBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

/**
 * Formats a date as the ISO 8601 `YYYY-MM-DD` string `<input type="date">`
 * binds to.
 *
 * Deliberately **not** `Date.prototype.toISOString()`: that renders in UTC, so
 * at 21:30 in São Paulo it returns tomorrow's date and a `:max="today"`
 * attribute would silently reject today.
 *
 * @param date - The date to render.
 * @returns The formatted date, e.g. `'2025-12-05'`.
 */
export function formatIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/**
 * Today at midnight local time — the reference day for "how far along is she".
 *
 * Truncating the time of day is what makes the age a whole number of days:
 * at 09:40 she is not 0.57 days pregnant, she is 0 days pregnant.
 *
 * @returns Today's date at 00:00 local time.
 */
export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Adds whole days to a date, returning a new `Date`.
 *
 * Goes through `setDate`, so it stays correct across daylight-saving
 * transitions, where a day is 23 or 25 hours long.
 *
 * @param date - Starting date.
 * @param days - Days to add; may be negative.
 * @returns A new date `days` days later.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Whole days from `date2` to `date1`; positive when `date1` is later.
 *
 * Both dates are projected onto UTC before subtracting so the result counts
 * calendar days rather than elapsed hours — that keeps a DST weekend at 1 day
 * instead of 0.958.
 *
 * @param date1 - The later date in the subtraction.
 * @param date2 - The earlier date in the subtraction.
 * @returns The signed difference in whole days.
 */
export function diffDays(date1: Date, date2: Date): number {
  const d1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.round((d1 - d2) / MS_PER_DAY)
}

/**
 * Splits a total of gestational days into weeks and the days into that week.
 *
 * @param totalDays - Age in days.
 * @returns `weeks` and the remaining `days`, 0–6.
 */
export function decomposeGA(totalDays: number): { weeks: number; days: number } {
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 }
}

/**
 * Renders a gestational age as `24s 3d` — semanas e dias.
 *
 * @param totalDays - Age in days.
 * @returns The formatted age, e.g. `'24s 3d'`.
 */
export function formatGA(totalDays: number): string {
  const { weeks, days } = decomposeGA(totalDays)
  return `${weeks}s ${days}d`
}

/**
 * Converts a gestational age given in weeks and days to a total day count.
 *
 * @param weeks - Completed weeks.
 * @param days - Days into the current week.
 * @returns The equivalent number of days.
 */
export function gaStringToDays(weeks: number, days: number): number {
  return weeks * 7 + days
}