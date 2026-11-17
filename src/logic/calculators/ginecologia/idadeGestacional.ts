/**
 * Gestational age, derived from the LMP or from an early ultrasound.
 *
 * The ultrasound branch delegates to {@link calculateIgUsg}, so a single entry
 * point covers both dating modes the calculator exposes.
 *
 * @module logic/calculators/ginecologia/idadeGestacional
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { decomposeGA, diffDays, parseIsoDate, today } from '../../utils/dates'
import { calculateIgUsg, type IgUsgInput } from './igUsg'

/** Manual dating inputs: the LMP, plus the day to measure the age at. */
export interface IdadeGestacionalDatesInput {
  /** First day of the last menstrual period, as `YYYY-MM-DD`. */
  dumIso?: string
  /** Day to measure the age at, as `YYYY-MM-DD`. Defaults to today. */
  referenceDateIso?: string
}

/**
 * Inputs for {@link calculateIdadeGestacional}: manual dating from the LMP, or
 * ultrasound dating (see {@link IgUsgInput}).
 */
export type IdadeGestacionalInput = IdadeGestacionalDatesInput | IgUsgInput

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
/** Term, counted from the LMP: 40s0d. */
const TERM_DAYS = 280

/**
 * Calculates gestational age from the LMP, or redates it from an early
 * ultrasound when the payload carries a scan date.
 *
 * @param input - Either the LMP plus an optional reference day, or the
 *   ultrasound payload accepted by {@link calculateIgUsg}.
 * @returns The age in weeks and days, with the trimester and, for the manual
 *   mode, the time remaining to term (40s0d).
 * @throws {RangeError} When the LMP is missing, or the reference day precedes
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
  // The scan payload is the discriminator: only the ultrasound shape has it.
  if ('usgDateIso' in input) return calculateIgUsg(input)

  if (!input.dumIso) {
    throw new RangeError('Informe a DUM para calcular a idade gestacional.')
  }

  const refDate = input.referenceDateIso ? parseIsoDate(input.referenceDateIso) : today()
  const dum = parseIsoDate(input.dumIso)

  const igDays = diffDays(refDate, dum)
  if (igDays < 0) {
    throw new RangeError('A data de referência é anterior à DUM. Verifique os dados.')
  }

  const { weeks, days } = decomposeGA(igDays)
  const daysUntilTerm = TERM_DAYS - igDays

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
    interpretation = `${trimester} de baixo risco. Faltam ${Math.floor(daysUntilTerm / 7)} semanas e ${daysUntilTerm % 7} dias para 40s0d.`
  } else if (weeks < 40) {
    severity = 'normal'
    interpretation = 'Gestação a termo.'
  } else if (weeks < 42) {
    severity = 'attention'
    interpretation = `Gestação com ${weeks} semanas completas. Avalie o bem-estar fetal e a necessidade de indução.`
  } else {
    severity = 'critical'
    interpretation = `Pós-datismo (${weeks} semanas). Avaliação obstétrica imediata.`
  }

  return {
    value: `${weeks}s ${days}d`,
    label: 'Idade Gestacional',
    severity,
    interpretation,
    subResults: [{ label: 'Trimestre', value: trimester, severity: 'info', interpretation: '' }],
    references: IDADE_GESTACIONAL_REFERENCES,
  }
}
