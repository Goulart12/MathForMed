/**
 * Gestational age redating by early ultrasound, from a reported age or from the
 * crown-rump length.
 *
 * @module logic/calculators/ginecologia/igUsg
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import {
  addDays,
  diffDays,
  formatBR,
  formatGA,
  gaStringToDays,
  parseIsoDate,
  today,
} from '../../utils/dates'

/** Inputs for {@link calculateIgUsg}. Supply `igWeeks` **or** `crlMm`. */
export interface IgUsgInput {
  /** Date of the scan, as `YYYY-MM-DD`. */
  usgDateIso: string
  /** Gestational age the scan reported, in completed weeks. */
  igWeeks?: number
  /** Days into the current week, accompanying `igWeeks`. */
  igDays?: number
  /** Crown-rump length in millimetres, as an alternative to `igWeeks`. */
  crlMm?: number
  /** LMP-derived LMP date, to test whether redating is warranted. */
  dumIso?: string
}

interface RedatingThreshold {
  /** Inclusive upper bound of the scan-age interval, in days. */
  maxDays: number
  /** Discrepancy, in days, above which the pregnancy is redated. */
  thresholdDays: number
  /** The interval as clinicians write it. */
  label: string
}

/**
 * ACOG redating thresholds, keyed on the gestational age **at the time of the
 * scan**. The tolerance widens as the pregnancy advances because dating by LMP
 * drifts with normal ovulatory variation.
 */
export const REDATING_THRESHOLDS: RedatingThreshold[] = [
  { maxDays: 62, thresholdDays: 5, label: '≤ 8s6d' },
  { maxDays: 97, thresholdDays: 7, label: '9s–13s6d' },
  { maxDays: 111, thresholdDays: 7, label: '14s–15s6d' },
  { maxDays: 153, thresholdDays: 10, label: '16s–21s6d' },
  { maxDays: 195, thresholdDays: 14, label: '22s–27s6d' },
  { maxDays: Infinity, thresholdDays: 21, label: '≥ 28s' },
]

/** The tolerance table, rendered for the reference disclosure. */
export const IG_USG_REFERENCES: ReferenceRange[] = REDATING_THRESHOLDS.map((row) => ({
  label: `IG na USG ${row.label} — reeditar se discrepância > ${row.thresholdDays} d`,
  max: row.maxDays,
  severity: 'info',
}))

/**
 * Looks up the redating tolerance for a given age at the time of the scan.
 *
 * @param igUsgDays - Gestational age at the scan, in days.
 * @returns The threshold in days and its interval label.
 */
function getRedatingThreshold(igUsgDays: number): RedatingThreshold {
  return REDATING_THRESHOLDS.find((row) => igUsgDays <= row.maxDays) ?? {
    maxDays: Infinity,
    thresholdDays: 21,
    label: '≥ 28s',
  }
}

/**
 * Converts a crown-rump length to a gestational age.
 *
 * Hadlock's first-trimester CRL equation:
 *
 * IG (dias) = 8,052 × √CCN(mm) + 23,73
 *
 * @param crlMm - Crown-rump length in millimetres.
 * @returns Gestational age in decimal weeks.
 * @throws {CalcValidationError} When the CRL is outside 2–90 mm.
 *
 * @reference Hadlock FP, Fogarty HW, Howard TF. Radiology. 1982;142(2):497–501.
 */
export function crlToGaWeeks(crlMm: number): number {
  assertRange(crlMm, 2, 90, 'crlMm', 'mm')
  return (8.052 * Math.sqrt(crlMm) + 23.73) / 7
}

/**
 * Redates a pregnancy from an early ultrasound and compares it with the
 * menstrual date.
 *
 * The scan's age fixes the corrected LMP (data da USG − idade), and the due
 * date follows from it. When an LMP is also supplied the two ages are compared
 * and the ACOG tolerance for that scan-age interval decides whether to redate.
 *
 * @param input - Scan date plus either a reported age or a CRL, optionally with
 *   the LMP for comparison.
 * @returns The corrected due date, corrected and current ages, and the
 *   redating decision.
 * @throws {CalcValidationError} When the CRL or the reported age is out of range.
 * @throws {RangeError} When the scan date is in the future, or neither an age nor
 *   a CRL was supplied.
 *
 * @reference ACOG Committee Opinion Nº 700. Obstet Gynecol. 2017;129:e150–4.
 * @reference Hadlock FP et al. Radiology. 1982;142:497–501.
 * @reference ISUOG Practice Guidelines. Ultrasound Obstet Gynecol. 2023;61:127–143.
 *
 * @example
 * calculateIgUsg({ usgDateIso: '2025-03-01', crlMm: 48 }).value // '23/09/2025'
 */
export function calculateIgUsg(input: IgUsgInput): CalcResult {
  const usgDate = parseIsoDate(input.usgDateIso)
  if (diffDays(today(), usgDate) < 0) throw new RangeError('A data da USG não pode ser futura.')

  let igAtUsgDays: number
  let source: string

  if (input.crlMm != null) {
    igAtUsgDays = Math.round(crlToGaWeeks(input.crlMm) * 7)
    source = `pelo CCN de ${input.crlMm} mm (Hadlock 1982)`
  } else if (input.igWeeks != null) {
    assertRange(input.igWeeks, 0, 41, 'igWeeks', 'semanas')
    const days = input.igDays ?? 0
    assertRange(days, 0, 6, 'igDays', 'dias')
    igAtUsgDays = gaStringToDays(input.igWeeks, days)
    source = `pela IG informada de ${input.igWeeks}s${days ? ` ${days}d` : ''}`
  } else {
    throw new RangeError('Informe a IG pela USG em semanas e dias ou o CCN em milímetros.')
  }

  const correctedDum = addDays(usgDate, -igAtUsgDays)
  const correctedDpp = addDays(correctedDum, 280)
  const igCurrentDays = diffDays(today(), correctedDum)

  const { thresholdDays, label: intervalLabel } = getRedatingThreshold(igAtUsgDays)

  let severity: CalcResult['severity']
  let interpretation: string
  const subResults: CalcResult[] = [
    {
      label: 'IG na data da USG',
      value: formatGA(igAtUsgDays),
      severity: 'info',
      interpretation: `Calculada ${source}.`,
    },
    {
      label: 'IG atual (corrigida)',
      value: formatGA(igCurrentDays),
      severity: 'info',
      interpretation: '',
    },
  ]

  if (!input.dumIso) {
    severity = 'info'
    interpretation = `Datação pela USG de ${formatBR(usgDate)}: ${formatGA(igAtUsgDays)} na data do exame. DPP corrigida ${formatBR(correctedDpp)}. Informe a DUM para que a ferramenta avalie se a gestação deve ser reeditada.`
  } else {
    const dum = parseIsoDate(input.dumIso)
    const discrepancy = Math.abs(igAtUsgDays - diffDays(usgDate, dum))
    const shouldRedate = discrepancy > thresholdDays

    subResults.push({
      label: 'Discrepância USG vs DUM',
      value: `${discrepancy} dias`,
      severity: shouldRedate ? 'attention' : 'normal',
      interpretation: `Limiar ACOG para ${intervalLabel}: ${thresholdDays} dias.`,
    })

    if (shouldRedate) {
      severity = 'attention'
      interpretation = `Discrepância de ${discrepancy} dias entre DUM e USG no intervalo ${intervalLabel} (limiar: ${thresholdDays} dias). REEDITAR a gestação pela USG. DPP corrigida ${formatBR(correctedDpp)}, contra ${formatBR(addDays(dum, 280))} pela DUM.`
    } else {
      severity = 'normal'
      interpretation = `Discrepância de ${discrepancy} dias, dentro do limiar de ${thresholdDays} dias para ${intervalLabel}. Manter a datação pela DUM: DPP ${formatBR(addDays(dum, 280))}.`
    }
  }

  return {
    value: formatBR(correctedDpp),
    label: 'DPP Corrigida pela USG',
    severity,
    interpretation,
    subResults,
    references: IG_USG_REFERENCES,
  }
}