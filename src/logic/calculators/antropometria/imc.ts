/**
 * Body Mass Index (BMI) with the WHO adult classification.
 *
 * @module logic/calculators/antropometria/imc
 */

import type { CalcResult, ReferenceRange, Severity } from '../../types'
import { assertRange } from '../../utils/validators'
import { round } from '../../utils/units'

/** Inputs for {@link calculateBmi}. */
export interface BmiInput {
  /** Body weight in kilograms. */
  weightKg: number
  /** Height in metres (not centimetres). */
  heightM: number
}

/** WHO adult BMI bands. */
export const BMI_REFERENCES: ReferenceRange[] = [
  { label: 'Baixo peso', max: 18.5, severity: 'attention' },
  { label: 'Peso normal', min: 18.5, max: 25, severity: 'normal' },
  { label: 'Sobrepeso', min: 25, max: 30, severity: 'attention' },
  { label: 'Obesidade grau I', min: 30, max: 35, severity: 'attention' },
  { label: 'Obesidade grau II', min: 35, max: 40, severity: 'critical' },
  { label: 'Obesidade grau III', min: 40, severity: 'critical' },
]

/** One WHO classification band. */
export interface BmiBand {
  /** Exclusive upper bound of the band. */
  max: number
  /** Human-readable band name. */
  label: string
  /** Severity assigned to the band. */
  severity: Severity
}

/** Highest band — unbounded above, and the fallback when nothing else matches. */
const HIGHEST_BAND: BmiBand = { max: Infinity, label: 'Obesidade grau III', severity: 'critical' }

const BANDS: readonly BmiBand[] = [
  { max: 18.5, label: 'Baixo peso', severity: 'attention' },
  { max: 25, label: 'Peso normal', severity: 'normal' },
  { max: 30, label: 'Sobrepeso', severity: 'attention' },
  { max: 35, label: 'Obesidade grau I', severity: 'attention' },
  { max: 40, label: 'Obesidade grau II', severity: 'critical' },
  HIGHEST_BAND,
]

/**
 * Classifies a BMI value against the WHO adult bands.
 *
 * @param bmi - BMI in kg/m².
 * @returns The band whose exclusive upper bound the value falls under.
 */
export function classifyBmi(bmi: number): BmiBand {
  return BANDS.find(b => bmi < b.max) ?? HIGHEST_BAND
}

/**
 * Calculates Body Mass Index and classifies it using the WHO adult cut-offs.
 *
 * BMI = weight (kg) / height² (m²)
 *
 * @param input - Weight and height.
 * @returns `CalcResult` whose value is the BMI rounded to one decimal, plus the
 *   matching WHO band and a prime-age healthy range of 18.5–24.9 kg/m².
 * @throws {CalcValidationError} When weight or height is outside its range.
 *
 * @reference WHO. Obesity: preventing and managing the global epidemic. Geneva: WHO; 2000.
 *
 * @example
 * calculateBmi({ weightKg: 70, heightM: 1.78 }).value // 22.1
 */
export function calculateBmi(input: BmiInput): CalcResult {
  const { weightKg, heightM } = input

  assertRange(weightKg, 0.5, 300, 'weightKg', 'kg')
  assertRange(heightM, 0.3, 2.5, 'heightM', 'm')

  const bmi = weightKg / heightM ** 2
  const band = classifyBmi(bmi)

  return {
    label: 'Índice de Massa Corporal',
    value: round(bmi, 1),
    unit: 'kg/m²',
    severity: band.severity,
    interpretation: `IMC ${round(bmi, 1)} kg/m² — ${band.label}. A faixa de peso normal da OMS é de 18.5 a 24.9 kg/m².`,
    references: BMI_REFERENCES,
  }
}