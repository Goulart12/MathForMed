/**
 * Framingham 10-year risk of hard coronary heart disease (Wilson 1998).
 *
 * The Wilson 1998 revision of the Anderson 1991 point system is implemented
 * table-for-table: age, age-conditional total cholesterol, HDL, treated and
 * untreated systolic blood pressure, smoking and diabetes. The point total is
 * then mapped onto the published 10-year CHD risk.
 *
 * @module logic/calculators/cardiologia/framingham
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertDefined, assertOneOf, assertRange } from '../../utils/validators'
import { pluralize } from '../../utils/units'

/** Inputs for {@link calculateFramingham}. */
export interface FraminghamInput {
  /** Age in whole years. */
  age: number
  /** Total (or LDL) cholesterol in mg/dL. */
  totalCholesterolMgDl: number
  /** HDL cholesterol in mg/dL. */
  hdlCholesterolMgDl: number
  /** Systolic blood pressure in mmHg. */
  sysBpMmhg: number
  /** Current cigarette smoker. */
  smoker: boolean
  /** Diabetes mellitus. */
  diabetic: boolean
  /** Whether the measured systolic BP is on antihypertensive treatment. */
  bpTreated: boolean
  /** Biological sex; selects the whole point table. */
  sex: 'M' | 'F'
}

const SEXES: readonly ('M' | 'F')[] = ['M', 'F']

/** Age columns used by the cholesterol and smoking tables: 20–39 … 70–79. */
type AgeColumn = 0 | 1 | 2 | 3 | 4

/** One row of the total-cholesterol table, holding a point value per age column. */
type AgeColumnPoints = readonly [number, number, number, number, number]

/** The five total-cholesterol rows, indexed by {@link CholesterolRow}. */
type CholesterolTable = readonly [
  AgeColumnPoints,
  AgeColumnPoints,
  AgeColumnPoints,
  AgeColumnPoints,
  AgeColumnPoints,
]

/** Index of a total-cholesterol row: <160, 160–199, 200–239, 240–279, ≥280 mg/dL. */
type CholesterolRow = 0 | 1 | 2 | 3 | 4

/** Index of the four HDL bands: <40, 40–49, 50–59, ≥60 mg/dL. */
type HdlBand = 0 | 1 | 2 | 3

/**
 * Index of the five systolic blood pressure bands:
 * <120, 120–129, 130–139, 140–159, ≥160 mmHg.
 */
type SbpBand = 0 | 1 | 2 | 3 | 4

/**
 * Age at the start of each column band, indexed by {@link AgeColumn}.
 * Ages of 80 and above reuse the 70–79 column.
 */
const AGE_COLUMN_STARTS = [20, 40, 50, 60, 70] as const

/** Five-year age bands, upper bound inclusive, used for the age points. */
const AGE_BANDS = [
  { max: 34, points: { M: -9, F: -7 } },
  { max: 39, points: { M: -4, F: -3 } },
  { max: 44, points: { M: 0, F: 0 } },
  { max: 49, points: { M: 3, F: 3 } },
  { max: 54, points: { M: 6, F: 6 } },
  { max: 59, points: { M: 8, F: 8 } },
  { max: 64, points: { M: 10, F: 10 } },
  { max: 69, points: { M: 11, F: 12 } },
  { max: 74, points: { M: 12, F: 14 } },
  { max: 79, points: { M: 13, F: 16 } },
] as const

/** Highest age for which the point table was published. */
const PUBLISHED_MAX_AGE = 79

/** Point total at which the published 10-year risk saturates. */
const SATURATION_POINTS = { M: 17, F: 25 } as const

/**
 * Total cholesterol points, indexed by row then age column.
 * Rows: <160, 160–199, 200–239, 240–279, ≥280 mg/dL.
 */
const TOTAL_CHOLESTEROL_POINTS: Record<'M' | 'F', CholesterolTable> = {
  M: [
    [0, 0, 0, 0, 0],
    [4, 3, 2, 1, 0],
    [7, 5, 3, 1, 0],
    [9, 6, 4, 2, 1],
    [11, 8, 5, 3, 1],
  ],
  F: [
    [0, 0, 0, 0, 0],
    [4, 3, 2, 1, 1],
    [8, 6, 4, 2, 1],
    [11, 8, 5, 3, 2],
    [13, 10, 7, 4, 2],
  ],
}

/** Smoking points for current smokers, indexed by age column. */
const SMOKER_POINTS: Record<'M' | 'F', AgeColumnPoints> = {
  M: [8, 5, 3, 1, 1],
  F: [9, 7, 4, 2, 1],
}

/** HDL points, identical for both sexes, by band: <40, 40–49, 50–59, ≥60. */
const HDL_POINTS: readonly [number, number, number, number] = [2, 1, 0, -1]

/**
 * Systolic blood pressure points by treatment status, by band:
 * <120, 120–129, 130–139, 140–159, ≥160 mmHg.
 */
const SBP_POINTS: Record<
  'M' | 'F',
  Record<'treated' | 'untreated', readonly [number, number, number, number, number]>
> = {
  M: {
    untreated: [0, 0, 1, 1, 2],
    treated: [0, 1, 2, 2, 3],
  },
  F: {
    untreated: [0, 1, 2, 3, 4],
    treated: [0, 3, 4, 5, 6],
  },
}

/** Index into the five systolic blood pressure bands. */
function sbpBand(sysBpMmhg: number): SbpBand {
  if (sysBpMmhg < 120) return 0
  if (sysBpMmhg < 130) return 1
  if (sysBpMmhg < 140) return 2
  if (sysBpMmhg < 160) return 3
  return 4
}

/** Index into the four HDL bands. */
function hdlBand(hdlCholesterolMgDl: number): HdlBand {
  if (hdlCholesterolMgDl < 40) return 0
  if (hdlCholesterolMgDl < 50) return 1
  if (hdlCholesterolMgDl < 60) return 2
  return 3
}

/**
 * 10-year hard CHD risk (%) indexed by point total. The male table runs from
 * 0 to 17 points and the female table from 0 to 25; totals beyond the table
 * saturate at the final entry, matching the published `≥ 17` / `≥ 25` rows.
 */
const RISK_BY_POINT: Record<'M' | 'F', readonly number[]> = {
  M: [1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 30],
  F: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 11, 14, 17, 22, 27, 30],
}

/** Lowest point total that the published table still reports as below 1%. */
const BELOW_ONE_AT: Record<'M' | 'F', number> = { M: 0, F: 9 }

export const FRAMINGHAM_REFERENCES: ReferenceRange[] = [
  { label: 'Baixo risco (< 10%)', max: 9.9, severity: 'normal' },
  { label: 'Risco moderado (10–20%)', min: 10, max: 20, severity: 'attention' },
  { label: 'Alto risco (> 20%)', min: 20.1, severity: 'critical' },
]

/** One point-contributing risk factor. */
export interface FraminghamComponent {
  /** Display label, e.g. `Age`. */
  label: string
  /** Points awarded for the supplied value. */
  points: number
  /** The input value the points were derived from, formatted for display. */
  display: string
}

/** Fractional parts of the result, exposed for callers that want the detail. */
export interface FraminghamBreakdown {
  /** Total point score. */
  totalPoints: number
  /** Estimated 10-year CHD risk as a percentage. */
  riskPercent: number
  /** True when the table reports `< 1%`. */
  belowOnePercent: boolean
  /** Per-factor point allocation. */
  components: FraminghamComponent[]
}

function agePoints(age: number, sex: 'M' | 'F'): number {
  const band = AGE_BANDS.find(candidate => age <= candidate.max)

  if (band) return band.points[sex]

  // Beyond the published range (age ≥ 80) the score keeps rising one point per
  // year until the risk table saturates.
  const saturated = SATURATION_POINTS[sex]
  const highestBand = AGE_BANDS[AGE_BANDS.length - 1]
  assertDefined(highestBand, 'the published age bands')
  return Math.min(highestBand.points[sex] + (age - PUBLISHED_MAX_AGE), saturated)
}

function ageColumn(age: number): AgeColumn {
  let column: AgeColumn = 0
  for (const [index, start] of AGE_COLUMN_STARTS.entries()) {
    if (age >= start) column = index as AgeColumn
  }
  return column
}

function cholesterolRow(totalCholesterolMgDl: number): CholesterolRow {
  if (totalCholesterolMgDl < 160) return 0
  if (totalCholesterolMgDl < 200) return 1
  if (totalCholesterolMgDl < 240) return 2
  if (totalCholesterolMgDl < 280) return 3
  return 4
}

/**
 * Computes the Framingham point score and the resulting 10-year CHD risk.
 *
 * @param input - Age, lipids, systolic BP, smoking, diabetes, treatment status
 *   and sex.
 * @returns The point total, the risk percentage and the per-factor breakdown.
 *
 * @reference Wilson PW et al. The Framingham risk score. Circulation. 1998;97(18):1837–1847.
 * @reference Anderson KM, Odell PM, Wilson PW, et al. Cumulative age-adjusted risk for coronary heart disease. Ann Intern Med. 1991;114(10):822–830.
 */
export function framinghamBreakdown(input: FraminghamInput): FraminghamBreakdown {
  const {
    age,
    totalCholesterolMgDl,
    hdlCholesterolMgDl,
    sysBpMmhg,
    smoker,
    diabetic,
    bpTreated,
    sex,
  } = input

  assertOneOf(sex, SEXES, 'sex')
  assertRange(age, 20, 120, 'age', 'anos')
  assertRange(totalCholesterolMgDl, 100, 600, 'totalCholesterolMgDl', 'mg/dL')
  assertRange(hdlCholesterolMgDl, 10, 150, 'hdlCholesterolMgDl', 'mg/dL')
  assertRange(sysBpMmhg, 70, 300, 'sysBpMmhg', 'mmHg')

  const column = ageColumn(age)

  const components: FraminghamComponent[] = [
    { label: 'Idade', points: agePoints(age, sex), display: `${age} anos` },
    {
      label: 'Colesterol total',
      points: TOTAL_CHOLESTEROL_POINTS[sex][cholesterolRow(totalCholesterolMgDl)][column],
      display: `${totalCholesterolMgDl} mg/dL`,
    },
    {
      label: 'Colesterol HDL',
      points: HDL_POINTS[hdlBand(hdlCholesterolMgDl)],
      display: `${hdlCholesterolMgDl} mg/dL`,
    },
    {
      label: `Pressão arterial sistólica (${bpTreated ? 'tratada' : 'não tratada'})`,
      points: SBP_POINTS[sex][bpTreated ? 'treated' : 'untreated'][sbpBand(sysBpMmhg)],
      display: `${sysBpMmhg} mmHg`,
    },
    {
      label: 'Fumante atual',
      points: smoker ? SMOKER_POINTS[sex][column] : 0,
      display: smoker ? 'Sim' : 'Não',
    },
    {
      label: 'Diabetes',
      // Diabetes is not a scored variable in the Wilson 1998 hard-CHD point
      // table; it is reported separately so no point value has to be invented.
      points: 0,
      display: diabetic ? 'Sim — não pontuado nesta tabela' : 'Não',
    },
  ]

  const totalPoints = components.reduce((total, component) => total + component.points, 0)
  const riskTable = RISK_BY_POINT[sex]

  // Totals outside the published range clamp to the saturating end of the table.
  const clampedIndex = Math.min(Math.max(totalPoints, 0), riskTable.length - 1)
  const riskPercent = riskTable[clampedIndex]
  assertDefined(riskPercent, `the risk table for sex '${sex}'`)

  return {
    totalPoints,
    riskPercent,
    belowOnePercent: totalPoints < BELOW_ONE_AT[sex],
    components,
  }
}

/**
 * Calculates the 10-year risk of hard coronary heart disease.
 *
 * @param input - Framingham risk factors.
 * @returns `CalcResult` whose value is the estimated 10-year CHD risk as a
 *   percentage, with the point total and per-factor allocation as sub-results.
 * @throws {CalcValidationError} When age, lipids or systolic BP are out of range,
 *   or the sex is unknown.
 *
 * @reference Wilson PW et al. The Framingham risk score. Circulation. 1998;97(18):1837–1847.
 *
 * @example
 * calculateFramingham({
 *   age: 55, totalCholesterolMgDl: 220, hdlCholesterolMgDl: 45,
 *   sysBpMmhg: 140, smoker: false, diabetic: false, bpTreated: false, sex: 'M',
 * }).value // 11
 */
export function calculateFramingham(input: FraminghamInput): CalcResult {
  const { totalPoints, riskPercent, belowOnePercent, components } = framinghamBreakdown(input)

  const severity: Severity =
    riskPercent < 10 ? 'normal' : riskPercent <= 20 ? 'attention' : 'critical'
  const band =
    riskPercent < 10 ? 'Baixo' : riskPercent <= 20 ? 'Moderado' : 'Alto'

  const riskText = belowOnePercent ? '< 1' : String(riskPercent)

  return {
    label: 'Risco de DAC em 10 anos',
    value: riskPercent,
    unit: '%',
    severity,
    interpretation: `${band} risco — aproximadamente ${riskText}% de risco de doença arterial coronariana grave em 10 anos (${totalPoints} pontos).${
      input.diabetic
        ? ' Diabetes estabelecido confere risco basal elevado de ASCVD por si só: a diretriz ACC/AHA de 2013 considera adultos de 40–75 anos com diabetes como grupo com benefício de estatina, portanto esta porcentagem subestima o risco global.'
        : ''
    } Wilson 1998 é validado para idades de 30–79 anos e foi substituído na prevenção primária pelas equações de coorte agrupada da ACC/AHA de 2013.`,
    references: FRAMINGHAM_REFERENCES,
    subResults: [
      {
        label: 'Total de pontos',
        value: totalPoints,
        unit: pluralize(totalPoints, 'ponto'),
        severity: 'info',
        interpretation: `Soma dos pontos do Framingham (${components.length} fatores de risco).`,
      },
      {
        label: 'Diabetes',
        value: input.diabetic ? 'Sim' : 'Não',
        severity: input.diabetic ? ('attention' as Severity) : ('info' as Severity),
        interpretation: input.diabetic
          ? 'Diabetes não é uma variável pontuada na tabela de pontos de DAC grave de Wilson 1998; considere este resultado como uma subestimativa do risco total de ASCVD.'
          : 'Sem diabetes. Diabetes não é uma variável pontuada na tabela de pontos de DAC grave de Wilson 1998.',
      },
      ...components.map(component => ({
        label: component.label,
        value: component.points,
        unit: pluralize(component.points, 'ponto'),
        severity: 'info' as const,
        interpretation: component.display,
      })),
    ],
  }
}