/**
 * Estimated due date by Naegele's rule, with the Brazilian prenatal-calendar
 * milestones that hang off it.
 *
 * @module logic/calculators/ginecologia/dppNaegele
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'
import { addDays, diffDays, formatBR, formatGA, parseIsoDate, today } from '../../utils/dates'

/** Inputs for {@link calculateDppNaegele}. */
export interface DppNaegeleInput {
  /** First day of the last menstrual period, as `YYYY-MM-DD`. */
  dumIso: string
  /** Mean menstrual cycle length in days. Defaults to 28 when omitted. */
  cycleDays?: number
  /**
   * Day to measure the current gestational age against, as `YYYY-MM-DD`.
   * Defaults to today.
   *
   * Present so the calculation can be pinned to a fixed date — needed both to
   * date a pregnancy being followed up after the fact and to test it against
   * known textbook dates.
   */
  referenceDateIso?: string
}

/** One dated event on the prenatal calendar. */
export interface PrenatalMilestone {
  /** What happens, e.g. `USG morfológico 1º trimestre`. */
  label: string
  /** Date, or a `DD/MM/AAAA – DD/MM/AAAA` window for the spanning exams. */
  date: string
  /** The gestational-age window, e.g. `11s–13s6d`. */
  weekRange: string
}

/** Result of {@link calculateDppNaegele}. */
export interface DppNaegeleResult extends CalcResult {
  /** The due date as `DD/MM/YYYY`. */
  dppFormatted: string
  /** Gestational age today, as `24s 3d`. */
  igAtual: string
  /** Gestational age today, in days. */
  igDaysAtual: number
  /** The prenatal calendar, anchored on the LMP. */
  milestones: PrenatalMilestone[]
}

/** Gestational-age bands, counted in days from the LMP. */
export const DPP_NAEGELE_REFERENCES: ReferenceRange[] = [
  { label: 'Pré-termo (até 36s6d)', max: 258, severity: 'attention' },
  { label: 'Termo antecipado (37s–40s6d)', min: 259, max: 286, severity: 'normal' },
  { label: 'Pós-termo precoce (41s–41s6d)', min: 287, max: 293, severity: 'attention' },
  { label: 'Pós-datismo (42s ou mais)', min: 294, severity: 'critical' },
]

/** Term pregnancy by ACOG: 37s0d. */
const TERM_ONSET_DAYS = 259
/** Post-dates by ACOG: 42s0d. */
const POST_TERM_DAYS = 294
/** 44 weeks — past this the LMP is wrong, not the pregnancy. */
const MAX_LMP_AGE_DAYS = 308

/**
 * Calculates the estimated due date by Naegele's rule.
 *
 * DPP = DUM + 280 + (ciclo − 28) days
 *
 * The 280 days are counted from the LMP, so a cycle longer than 28 days moves
 * the due date later by exactly the difference. That keeps the calculation on
 * the ACOG convention of 280 days from LMP rather than the older calendar form
 * of the rule (LMP + 7 dias − 3 meses + 1 ano), which drifts from 280 by one to
 * two days depending on the month the LMP falls in.
 *
 * @param input - LMP date and, optionally, the cycle length in days and a
 *   reference day to measure the current age against.
 * @returns The due date, today's gestational age and the prenatal milestones.
 * @throws {CalcValidationError} When the cycle length is outside 21–35 days.
 * @throws {RangeError} When the LMP is in the future or more than 44 weeks old.
 *
 * @reference Naegele FC. Lehrbuch der Geburtshilfe. 1806.
 * @reference ACOG Committee Opinion Nº 700. Obstet Gynecol. 2017;129:e150–4.
 * @reference Ministério da Saúde. Cadernos de Atenção Básica nº 32 — Pré-natal. 2012.
 * @reference FEBRASGO. Manual de Gestação de Alto Risco. 2022.
 *
 * @example
 * calculateDppNaegele({ dumIso: '2025-03-01' }).dppFormatted // '06/12/2025'
 */
export function calculateDppNaegele(input: DppNaegeleInput): DppNaegeleResult {
  const cycle = input.cycleDays ?? 28
  assertRange(cycle, 21, 35, 'cycleDays', 'dias')

  const dum = parseIsoDate(input.dumIso)
  const now = input.referenceDateIso ? parseIsoDate(input.referenceDateIso) : today()

  const ageInDays = diffDays(now, dum)
  if (ageInDays < 0) throw new RangeError('A DUM não pode ser uma data futura.')
  // Guards against a mistyped year rather than a real pregnancy: past 44 weeks the
  // LMP is wrong, not the gestation.
  if (ageInDays > MAX_LMP_AGE_DAYS) {
    throw new RangeError(
      `A DUM informada tem ${Math.floor(ageInDays / 7)} semanas, acima do limite de 44. Verifique a data.`,
    )
  }

  const dpp = addDays(dum, 280 + (cycle - 28))
  const igDaysAtual = ageInDays
  const igAtual = formatGA(igDaysAtual)

  let severity: CalcResult['severity']
  let interpretation: string

  if (igDaysAtual < 42) {
    severity = 'info'
    interpretation = `Gestação muito inicial (${igAtual}). Confirme a datação com ultrassonografia de 1º trimestre.`
  } else if (igDaysAtual < TERM_ONSET_DAYS) {
    severity = 'normal'
    interpretation = `Gestação em andamento (${igAtual}), de baixo risco.`
  } else if (igDaysAtual < 287) {
    severity = 'normal'
    interpretation = `Gestação a termo (${igAtual}). DPP em ${formatBR(dpp)}.`
  } else if (igDaysAtual < POST_TERM_DAYS) {
    severity = 'attention'
    interpretation = `Gestação no pós-termo (${igAtual}). Avalie conducta e datação ultrassonográfica.`
  } else {
    severity = 'critical'
    interpretation = `Pós-datismo (${igAtual}, 42 semanas ou mais). Avaliação obstétrica imediata.`
  }

  const milestones = buildMilestones(dum, dpp)

  return {
    value: formatBR(dpp),
    label: 'Data Provável do Parto',
    severity,
    interpretation,
    dppFormatted: formatBR(dpp),
    igAtual,
    igDaysAtual,
    milestones,
    // The milestones ride along as sub-results so the shared ResultCard renders
    // the calendar without needing to know anything about obstetrics.
    subResults: [
      {
        label: 'Idade gestacional atual',
        value: igAtual,
        severity,
        interpretation: `${Math.floor(igDaysAtual / 7)} semanas e ${igDaysAtual % 7} dias desde a DUM.`,
      },
      ...milestones.map((milestone) => ({
        label: milestone.label,
        value: milestone.date,
        unit: milestone.weekRange,
        severity: 'info' as const,
        interpretation: '',
      })),
    ],
    references: DPP_NAEGELE_REFERENCES,
  }
}

/**
 * The prenatal calendar, anchored on the LMP.
 *
 * @param dum - Last menstrual period.
 * @param dpp - The computed due date, used for its own milestone.
 * @returns The seven dated milestones the Brazilian prenatal schedule tracks.
 */
function buildMilestones(dum: Date, dpp: Date): PrenatalMilestone[] {
  return [
    {
      label: 'USG de 1º trimestre (translucência nucal)',
      date: `${formatBR(addDays(dum, 77))} – ${formatBR(addDays(dum, 97))}`,
      weekRange: '11s–13s6d',
    },
    {
      label: 'USG morfológico do 2º trimestre',
      date: `${formatBR(addDays(dum, 140))} – ${formatBR(addDays(dum, 168))}`,
      weekRange: '20s–24s',
    },
    {
      label: 'Rastreamento de diabetes gestacional (TOTG 75 g)',
      date: `${formatBR(addDays(dum, 168))} – ${formatBR(addDays(dum, 196))}`,
      weekRange: '24s–28s',
    },
    { label: 'Início do 3º trimestre', date: formatBR(addDays(dum, 196)), weekRange: '28s' },
    {
      label: 'Termo antecipado',
      date: formatBR(addDays(dum, TERM_ONSET_DAYS)),
      weekRange: '37s0d',
    },
    { label: 'Data Provável do Parto', date: formatBR(dpp), weekRange: '40s0d' },
    {
      label: 'Limite do pós-datismo',
      date: formatBR(addDays(dum, POST_TERM_DAYS)),
      weekRange: '42s0d',
    },
  ]
}