/**
 * Manual gestational age, derived from either the LMP or the due date.
 *
 * @module logic/calculators/ginecologia/idadeGestacional
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { addDays, decomposeGA, diffDays, formatBR, parseIsoDate, today } from '../../utils/dates'

/** Inputs for {@link calculateIdadeGestacional}. Provide `dumIso` or `dppIso`. */
export interface IdadeGestacionalInput {
  /** First day of the last menstrual period, as `YYYY-MM-DD`. */
  dumIso?: string
  /** Estimated due date, as `YYYY-MM-DD`. Used when no LMP is given. */
  dppIso?: string
  /** Day to measure the age at, as `YYYY-MM-DD`. Defaults to today. */
  referenceDateIso?: string
}

/** Gestational-age bands, counted in days from the LMP. */
export const IDADE_GESTACIONAL_REFERENCES: ReferenceRange[] = [
  { label: 'Pré-termo (até 36s6d)', max: 258, severity: 'attention' },
  { label: 'Termo antecipado (37s–40s6d)', min: 259, max: 286, severity: 'normal' },
  { label: 'Pós-termo precoce (41s–41s6d)', min: 287, max: 293, severity: 'attention' },
  { label: 'Pós-datismo (42s ou mais)', min: 294, severity: 'critical' },
]

/** End of the first trimester: 13s6d. */
const FIRST_TRIMESTER_END = 97
/** End of the second trimester: 27s6d. */
const SECOND_TRIMESTER_END = 195

/**
 * Calculates gestational age from the LMP or from the due date.
 *
 * When the due date is supplied instead of the LMP the LMP is back-calculated
 * as DPP − 280 days, which is the ACOG convention.
 *
 * @param input - LMP **or** due date, plus an optional reference day.
 * @returns The age in weeks and days, with the trimester and time remaining.
 * @throws {RangeError} When neither date is given, or the reference day precedes
 *   the LMP.
 *
 * @reference ACOG Committee Opinion Nº 700. Obstet Gynecol. 2017;129:e150–4.
 * @reference Pereira AP et al. BMC Res Notes. 2013;6:60.
 *
 * @example
 * calculateIdadeGestacional({ dumIso: '2025-01-01', referenceDateIso: '2025-04-09' }).value
 * // '14s 0d'
 */
export function calculateIdadeGestacional(input: IdadeGestacionalInput): CalcResult {
  if (!input.dumIso && !input.dppIso) {
    throw new RangeError('Informe a DUM ou a DPP para calcular a idade gestacional.')
  }

  const refDate = input.referenceDateIso ? parseIsoDate(input.referenceDateIso) : today()

  let dum: Date
  let dpp: Date
  if (input.dumIso) {
    dum = parseIsoDate(input.dumIso)
    dpp = addDays(dum, 280)
  } else {
    dpp = parseIsoDate(input.dppIso as string)
    dum = addDays(dpp, -280)
  }

  const igDays = diffDays(refDate, dum)
  if (igDays < 0) {
    throw new RangeError('A data de referência é anterior à DUM. Verifique os dados.')
  }

  const { weeks, days } = decomposeGA(igDays)
  const daysUntilDpp = diffDays(dpp, refDate)

  const trimester =
    igDays <= FIRST_TRIMESTER_END
      ? '1º trimestre'
      : igDays <= SECOND_TRIMESTER_END
        ? '2º trimestre'
        : '3º trimestre'

  let severity: CalcResult['severity']
  let interpretation: string

  if (weeks < 6) {
    severity = 'info'
    interpretation = 'Gestação muito inicial. Confirme com β-hCG e ultrassonografia transvaginal.'
  } else if (weeks < 37) {
    severity = 'normal'
    interpretation = `${trimester} de baixo risco. Faltam ${Math.floor(daysUntilDpp / 7)} semanas para a DPP (${formatBR(dpp)}).`
  } else if (weeks < 40) {
    severity = 'normal'
    interpretation = `Gestação a termo. DPP em ${formatBR(dpp)}.`
  } else if (weeks < 42) {
    severity = 'attention'
    interpretation = `Pós-DPP. Avalie a necessidade de indução. A DPP era ${formatBR(dpp)}.`
  } else {
    severity = 'critical'
    interpretation = `Pós-datismo (${weeks} semanas). Avaliação obstétrica imediata; a DPP era ${formatBR(dpp)}.`
  }

  return {
    value: `${weeks}s ${days}d`,
    label: 'Idade Gestacional',
    severity,
    interpretation,
    subResults: [
      { label: 'Trimestre', value: trimester, severity: 'info', interpretation: '' },
      {
        label: 'DPP estimada',
        value: formatBR(dpp),
        severity: 'info',
        interpretation: 'Calculada como DUM + 280 dias.',
      },
      {
        label: 'Tempo até a DPP',
        value:
          daysUntilDpp > 0
            ? `${Math.floor(daysUntilDpp / 7)}s ${daysUntilDpp % 7}d`
            : 'Pós-DPP',
        severity: daysUntilDpp > 0 ? 'info' : 'attention',
        interpretation:
          daysUntilDpp > 0
            ? ''
            : `A DPP passou há ${Math.abs(daysUntilDpp)} dias, pela datação menstrual.`,
      },
    ],
    references: IDADE_GESTACIONAL_REFERENCES,
  }
}