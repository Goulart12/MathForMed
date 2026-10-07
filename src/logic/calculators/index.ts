/**
 * Typed registry binding each router id to its calculation function.
 *
 * The design agent's `CalculatorView` imports {@link CALCULATORS} to resolve a
 * `/calc/:id` route to a logic function, so ids and signatures stay in sync.
 *
 * @module logic/calculators
 */

import type { CalcCategory, CalcResult } from '../types'

import { calculateBmi } from './antropometria/imc'
import type { BmiInput } from './antropometria/imc'
import { calculateBsa } from './antropometria/superficieCorporal'
import type { BsaInput } from './antropometria/superficieCorporal'
import { calculateIdealBodyWeight } from './antropometria/pesoIdeal'
import type { IdealBodyWeightInput } from './antropometria/pesoIdeal'

import { calculateDoseByWeight } from './medicacao/dosePorPeso'
import type { DoseByWeightInput } from './medicacao/dosePorPeso'
import { calculateDripRate } from './medicacao/gotejamento'
import type { DripRateInput } from './medicacao/gotejamento'
import { calculateDilution } from './medicacao/diluicao'
import type { DilutionInput } from './medicacao/diluicao'
import { calculateInfusionRate } from './medicacao/infusaoContinua'
import type { ContinuousInfusionInput } from './medicacao/infusaoContinua'

import { calculateCreatinineClearance } from './renal/creatininaClearance'
import type { CreatinineClearanceInput } from './renal/creatininaClearance'
import { calculateCkdEpi } from './renal/tfgCkdEpi'
import type { CkdEpiInput } from './renal/tfgCkdEpi'
import { calculateMdrd } from './renal/tfgMdrd'
import type { MdrdInput } from './renal/tfgMdrd'

import { calculateChadsVasc } from './cardiologia/chadsVasc'
import type { ChadsVascInput } from './cardiologia/chadsVasc'
import { calculateHasBled } from './cardiologia/hasbled'
import type { HasBledInput } from './cardiologia/hasbled'
import { calculateFramingham } from './cardiologia/framingham'
import type { FraminghamInput } from './cardiologia/framingham'

import { calculateGlasgow } from './emergencia/glasgow'
import type { GlasgowInput } from './emergencia/glasgow'
import { calculateQsofa } from './emergencia/qsofa'
import type { QsofaInput } from './emergencia/qsofa'
import { calculateSofa } from './emergencia/sofa'
import type { SofaInput } from './emergencia/sofa'
import { calculateShockIndex } from './emergencia/shockIndex'
import type { ShockIndexInput } from './emergencia/shockIndex'

import { calculateAnionGap } from './laboratorial/anionGap'
import type { AnionGapInput } from './laboratorial/anionGap'
import { calculateOsmolality } from './laboratorial/osmolalidade'
import type { OsmolalityInput } from './laboratorial/osmolalidade'
import { calculateCorrectedSodium } from './laboratorial/correcaoSodio'
import type { CorrectedSodiumInput } from './laboratorial/correcaoSodio'
import { calculateCorrectedCalcium } from './laboratorial/correcaoCalcio'
import type { CorrectedCalciumInput } from './laboratorial/correcaoCalcio'
import { calculateHba1c } from './laboratorial/hba1c'
import type { Hba1cInput } from './laboratorial/hba1c'

import { calculateHarrisBenedict } from './nutricao/harrisBenedict'
import type { HarrisBenedictInput } from './nutricao/harrisBenedict'
import { calculateHollidaySegar } from './nutricao/hollidaySegar'
import type { HollidaySegarInput } from './nutricao/hollidaySegar'

import { calculateDppNaegele } from './ginecologia/dppNaegele'
import type { DppNaegeleInput } from './ginecologia/dppNaegele'
import { calculateIdadeGestacional } from './ginecologia/idadeGestacional'
import type { IdadeGestacionalInput } from './ginecologia/idadeGestacional'
import { calculateIgUsg } from './ginecologia/igUsg'
import type { IgUsgInput } from './ginecologia/igUsg'
import { calculateAlturaUterina } from './ginecologia/alturaUterina'
import type { AlturaUterinaInput } from './ginecologia/alturaUterina'

/**
 * Maps every calculator id to its calculation function.
 *
 * All 24 ids declared in `CALCULATORS_META` are present, keyed by the same
 * string.
 */
export const CALCULATORS = {
  imc: { calculate: calculateBmi, input: null as unknown as BmiInput, category: 'antropometria' as CalcCategory },
  'superficie-corporal': { calculate: calculateBsa, input: null as unknown as BsaInput, category: 'antropometria' as CalcCategory },
  'peso-ideal': { calculate: calculateIdealBodyWeight, input: null as unknown as IdealBodyWeightInput, category: 'antropometria' as CalcCategory },
  'dose-peso': { calculate: calculateDoseByWeight, input: null as unknown as DoseByWeightInput, category: 'medicacao' as CalcCategory },
  gotejamento: { calculate: calculateDripRate, input: null as unknown as DripRateInput, category: 'medicacao' as CalcCategory },
  diluicao: { calculate: calculateDilution, input: null as unknown as DilutionInput, category: 'medicacao' as CalcCategory },
  'infusao-continua': { calculate: calculateInfusionRate, input: null as unknown as ContinuousInfusionInput, category: 'medicacao' as CalcCategory },
  cockcroft: { calculate: calculateCreatinineClearance, input: null as unknown as CreatinineClearanceInput, category: 'renal' as CalcCategory },
  'ckd-epi': { calculate: calculateCkdEpi, input: null as unknown as CkdEpiInput, category: 'renal' as CalcCategory },
  mdrd: { calculate: calculateMdrd, input: null as unknown as MdrdInput, category: 'renal' as CalcCategory },
  'chads-vasc': { calculate: calculateChadsVasc, input: null as unknown as ChadsVascInput, category: 'cardiologia' as CalcCategory },
  'has-bled': { calculate: calculateHasBled, input: null as unknown as HasBledInput, category: 'cardiologia' as CalcCategory },
  framingham: { calculate: calculateFramingham, input: null as unknown as FraminghamInput, category: 'cardiologia' as CalcCategory },
  glasgow: { calculate: calculateGlasgow, input: null as unknown as GlasgowInput, category: 'emergencia' as CalcCategory },
  qsofa: { calculate: calculateQsofa, input: null as unknown as QsofaInput, category: 'emergencia' as CalcCategory },
  sofa: { calculate: calculateSofa, input: null as unknown as SofaInput, category: 'emergencia' as CalcCategory },
  'shock-index': { calculate: calculateShockIndex, input: null as unknown as ShockIndexInput, category: 'emergencia' as CalcCategory },
  'anion-gap': { calculate: calculateAnionGap, input: null as unknown as AnionGapInput, category: 'laboratorial' as CalcCategory },
  osmolalidade: { calculate: calculateOsmolality, input: null as unknown as OsmolalityInput, category: 'laboratorial' as CalcCategory },
  'correcao-sodio': { calculate: calculateCorrectedSodium, input: null as unknown as CorrectedSodiumInput, category: 'laboratorial' as CalcCategory },
  'correcao-calcio': { calculate: calculateCorrectedCalcium, input: null as unknown as CorrectedCalciumInput, category: 'laboratorial' as CalcCategory },
  hba1c: { calculate: calculateHba1c, input: null as unknown as Hba1cInput, category: 'laboratorial' as CalcCategory },
  'harris-benedict': { calculate: calculateHarrisBenedict, input: null as unknown as HarrisBenedictInput, category: 'nutricao' as CalcCategory },
  'holliday-segar': { calculate: calculateHollidaySegar, input: null as unknown as HollidaySegarInput, category: 'nutricao' as CalcCategory },
  'dpp-naegele': { calculate: calculateDppNaegele, input: null as unknown as DppNaegeleInput, category: 'ginecologia' as CalcCategory },
  'idade-gestacional': { calculate: calculateIdadeGestacional, input: null as unknown as IdadeGestacionalInput, category: 'ginecologia' as CalcCategory },
  'ig-usg': { calculate: calculateIgUsg, input: null as unknown as IgUsgInput, category: 'ginecologia' as CalcCategory },
  'altura-uterina': { calculate: calculateAlturaUterina, input: null as unknown as AlturaUterinaInput, category: 'ginecologia' as CalcCategory },
} as const satisfies Record<string, unknown>

/** The union of every calculator's input type. */
export type CalculatorInput = (typeof CALCULATORS)[keyof typeof CALCULATORS]['input']

/** Ids present in the registry. */
export type CalculatorId = keyof typeof CALCULATORS

/**
 * A registry entry reduced to a callable calculator.
 *
 * The parameter is the union of every calculator's input type, so callers must
 * pass one of the shapes declared by the calculator they resolved; the runtime
 * enforces the ranges.
 */
export type CalculatorFn = (input: CalculatorInput) => CalcResult

/**
 * Resolves a calculator function by id.
 *
 * @param id - Registry id, matching the `/calc/:id` route param.
 * @returns The calculation function, or `undefined` for an unknown id.
 *
 * @example
 * resolveCalculator('imc')?.({ weightKg: 70, heightM: 1.78 })
 */
export function resolveCalculator(id: string): CalculatorFn | undefined {
  const entry = (CALCULATORS as Record<string, { calculate: unknown } | undefined>)[id]
  return entry?.calculate as CalculatorFn | undefined
}

export type {
  AlturaUterinaInput,
  AnionGapInput,
  BmiInput,
  BsaInput,
  ChadsVascInput,
  CkdEpiInput,
  ContinuousInfusionInput,
  CorrectedCalciumInput,
  CorrectedSodiumInput,
  CreatinineClearanceInput,
  DilutionInput,
  DppNaegeleInput,
  DoseByWeightInput,
  DripRateInput,
  FraminghamInput,
  GlasgowInput,
  Hba1cInput,
  HarrisBenedictInput,
  HasBledInput,
  HollidaySegarInput,
  IdealBodyWeightInput,
  IdadeGestacionalInput,
  IgUsgInput,
  MdrdInput,
  OsmolalityInput,
  QsofaInput,
  ShockIndexInput,
  SofaInput,
}