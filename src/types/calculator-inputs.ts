/**
 * TEMPORARY SHIM — design worktree only.
 *
 * Mirrors the per-calculator `Input` interfaces owned by the `feat/calc-logic`
 * worktree. Forms use these purely as the payload type of their `@calculate`
 * emit; no formula lives in the UI layer.
 *
 * MERGE: delete this file and repoint each form's import from
 * `@/types/calculator-inputs` to its owning logic module, e.g.
 * `@/logic/calculators/antropometria/imc`. Exported names match 1:1.
 */

/* -------------------------------------------------------------------------- */
/* medicacao                                                                    */
/* -------------------------------------------------------------------------- */

export type UnitDoseUnit = 'mg/kg' | 'mcg/kg' | 'IU/kg'

export interface DosePesoInput {
  unitDose: number
  unitDoseUnit: UnitDoseUnit
  weightKg: number
  concentrationPerMl: number
  availableVolumeMl: number
}

export type TubingType = 'macro' | 'micro'

export interface GotejamentoInput {
  volumeMl: number
  timeMins: number
  tubingType: TubingType
}

export interface DiluicaoInput {
  initialConcentration: number
  initialVolumeMl: number
  finalConcentration: number
}

export interface InfusaoContinuaInput {
  doseMcgKgMin: number
  weightKg: number
  concentrationMcgMl: number
}

/* -------------------------------------------------------------------------- */
/* antropometria                                                                */
/* -------------------------------------------------------------------------- */

export interface ImcInput {
  weightKg: number
  heightM: number
}

export type BsaFormula = 'mosteller' | 'dubois'

export interface SuperficieCorporalInput {
  weightKg: number
  heightM: number
  formula: BsaFormula
}

export interface PesoIdealInput {
  heightM: number
  weightKg: number
  sex: Sex
}

/* -------------------------------------------------------------------------- */
/* renal                                                                        */
/* -------------------------------------------------------------------------- */

export interface CockcroftInput {
  age: number
  weightKg: number
  serumCreatinineMgDl: number
  sex: Sex
}

export interface CkdEpiInput {
  age: number
  serumCreatinineMgDl: number
  sex: Sex
}

export interface MdrdInput {
  age: number
  serumCreatinineMgDl: number
  sex: Sex
}

/* -------------------------------------------------------------------------- */
/* cardiologia                                                                  */
/* -------------------------------------------------------------------------- */

export interface ChadsVascInput {
  age: number
  chf: boolean
  hypertension: boolean
  stroke: boolean
  vascularDisease: boolean
  diabetes: boolean
  sex: Sex
}

export interface HasBledInput {
  hypertensionUncontrolled: boolean
  renalDisease: boolean
  liverDisease: boolean
  strokeHistory: boolean
  bleedingHistory: boolean
  labileInr: boolean
  elderly: boolean
  drugsAntiplatelet: boolean
  alcoholUse: boolean
}

export interface FraminghamInput {
  age: number
  totalCholesterolMgDl: number
  hdlCholesterolMgDl: number
  sysBpMmhg: number
  smoker: boolean
  diabetic: boolean
  bpTreated: boolean
  sex: Sex
}

/* -------------------------------------------------------------------------- */
/* emergencia                                                                   */
/* -------------------------------------------------------------------------- */

export type GlasgowEyes = 1 | 2 | 3 | 4
export type GlasgowVerbal = 1 | 2 | 3 | 4 | 5
export type GlasgowMotor = 1 | 2 | 3 | 4 | 5 | 6

export interface GlasgowInput {
  eyes: GlasgowEyes
  verbal: GlasgowVerbal
  motor: GlasgowMotor
}

export interface QsofaInput {
  respiratoryRate: number
  alteredMentation: boolean
  sysBp: number
}

export interface SofaInput {
  respirationScore: number
  coagulationScore: number
  liverScore: number
  cardiovascularScore: number
  cnsScore: number
  renalScore: number
}

export interface ShockIndexInput {
  heartRate: number
  sysBp: number
}

/* -------------------------------------------------------------------------- */
/* laboratorial                                                                 */
/* -------------------------------------------------------------------------- */

export interface AnionGapInput {
  sodium: number
  chloride: number
  bicarbonate: number
  albumin?: number
}

export interface OsmolalidadeInput {
  sodium: number
  glucoseMgDl: number
  bunMgDl: number
  measuredOsmolality?: number
}

export interface CorrecaoSodioInput {
  measuredSodiumMeqL: number
  glucoseMgDl: number
}

export interface CorrecaoCalcioInput {
  measuredCalciumMgDl: number
  albuminGDl: number
}

export interface Hba1cInput {
  hba1cPercent: number
}

/* -------------------------------------------------------------------------- */
/* nutricao                                                                     */
/* -------------------------------------------------------------------------- */

export type Sex = 'M' | 'F'

export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725 | 1.9

export interface HarrisBenedictInput {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  activityFactor: ActivityFactor
  stressFactor?: number
}

export interface HollidaySegarInput {
  weightKg: number
}
