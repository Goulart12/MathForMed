/**
 * Static registries: calculator metadata, category labels and severity badge text.
 *
 * `CALCULATORS_META` is the contract between the logic and design agents —
 * every `id` here must match a `/calc/:id` route registered by the router.
 *
 * @module logic/constants
 */

import type { CalcCategory, CalculatorMeta, Severity } from './types'

/** Display label and ordering for each category. */
export const CATEGORIES: Record<
  CalcCategory,
  { label: string; description: string; order: number }
> = {
  medicacao: {
    label: 'Medicação',
    description: 'Doses, diluições and infusion rates',
    order: 1,
  },
  antropometria: {
    label: 'Antropometria',
    description: 'Weight, height and body composition',
    order: 2,
  },
  renal: {
    label: 'Renal',
    description: 'Renal function and drug dosing',
    order: 3,
  },
  cardiologia: {
    label: 'Cardiologia',
    description: 'Cardiovascular risk scores',
    order: 4,
  },
  emergencia: {
    label: 'Emergência',
    description: 'Triage and organ dysfunction scores',
    order: 5,
  },
  laboratorial: {
    label: 'Laboratorial',
    description: 'Blood gas, electrolytes and metabolic derangements',
    order: 6,
  },
  nutricao: {
    label: 'Nutrição',
    description: 'Energy and fluid requirements',
    order: 7,
  },
}

/**
 * Badge text per severity, matching the `NORMAL / WARNING / CRITICAL` pill
 * vocabulary used by `ResultCard.vue`.
 */
export const SEVERITY_LABELS: Record<Severity, string> = {
  normal: 'NORMAL',
  attention: 'WARNING',
  critical: 'CRITICAL',
  info: 'INFO',
}

/**
 * Metadata for every calculator, keyed by its router id.
 *
 * @example
 * CALCULATORS_META['imc'].name // 'Body Mass Index (BMI)'
 */
export const CALCULATORS_META: Record<string, CalculatorMeta> = {
  // ── ANTROPOMETRIA ────────────────────────────────────────────────────────
  imc: {
    id: 'imc',
    name: 'Body Mass Index (BMI)',
    shortName: 'IMC',
    description:
      'Weight-for-height index with the WHO adult classification, from underweight to class III obesity.',
    category: 'antropometria',
    tags: ['bmi', 'imc', 'obesidade', 'peso', 'altura', 'nutrição'],
    evidenceLevel: 'A',
    reference: 'WHO. Obesity: preventing and managing the global epidemic. 2000.',
  },
  'superficie-corporal': {
    id: 'superficie-corporal',
    name: 'Body Surface Area (BSA)',
    shortName: 'Sup. Corporal',
    description:
      'Mosteller and Du Bois body surface area, the basis of chemotherapy dosing by BSA.',
    category: 'antropometria',
    tags: ['bsa', 'superfície corporal', 'sc', 'mosteller', 'dubois', 'quimioterapia'],
    evidenceLevel: 'A',
    reference: 'Mosteller RD. N Engl J Med. 1987;317:1098.',
  },
  'peso-ideal': {
    id: 'peso-ideal',
    name: 'Ideal Body Weight',
    shortName: 'Peso Ideal',
    description:
      'Devine ideal body weight, plus the adjusted body weight used above 120% of IBW.',
    category: 'antropometria',
    tags: ['peso ideal', 'devine', 'ajustado', 'dose', 'obesidade'],
    evidenceLevel: 'B',
    reference: 'Devine BJ. Drug Intell Clin Pharm. 1974;8:650–655.',
  },

  // ── MEDICAÇÃO ────────────────────────────────────────────────────────────
  'dose-peso': {
    id: 'dose-peso',
    name: 'Weight-based Dose',
    shortName: 'Dose/Peso',
    description:
      'Converts a mg/kg, mcg/kg or IU/kg order into a total dose and the volume to draw.',
    category: 'medicacao',
    tags: ['dose', 'mg/kg', 'mcg/kg', 'peso', 'volume', 'medicação'],
    evidenceLevel: 'A',
    reference:
      'Brunton LL et al. Goodman & Gilman’s Pharmacological Basis of Therapeutics. 13th ed.',
  },
  gotejamento: {
    id: 'gotejamento',
    name: 'IV Drip Rate',
    shortName: 'Gotejamento',
    description:
      'Drops per minute and mL/h for a given volume, time and tubing drop factor.',
    category: 'medicacao',
    tags: ['gotejamento', 'gtt/min', 'infusão', 'bureta', 'macro', 'micro'],
    evidenceLevel: 'A',
    reference: 'Infusion Nurses Society. Infusion Therapy Standards of Practice. 2021.',
  },
  diluicao: {
    id: 'diluicao',
    name: 'Dilution Calculator',
    shortName: 'Diluição',
    description:
      'C₁·V₁ = C₂·V₂: final and solvent volumes needed to dilute a stock solution.',
    category: 'medicacao',
    tags: ['diluição', 'concentração', 'soro', 'C1V1', 'medicação'],
    evidenceLevel: 'A',
    reference: 'Trissel LA. Handbook on Injectable Drugs. 18th ed.',
  },
  'infusao-continua': {
    id: 'infusao-continua',
    name: 'Continuous Infusion Rate',
    shortName: 'Infusão Contínua',
    description:
      'Pump rate in mL/h for a mcg/kg/min vasoactive or sedative infusion.',
    category: 'medicacao',
    tags: ['infusão contínua', 'mcg/kg/min', 'bomba', 'vasopressor', 'sedação'],
    evidenceLevel: 'A',
    reference: 'Lexicomp Online. Drug Information. Wolters Kluwer.',
  },

  // ── RENAL ────────────────────────────────────────────────────────────────
  cockcroft: {
    id: 'cockcroft',
    name: 'Creatinine Clearance (Cockcroft-Gault)',
    shortName: 'Cockcroft-Gault',
    description:
      'CrCl in mL/min with the female ×0.85 factor and KDIGO G1–G5 staging.',
    category: 'renal',
    tags: ['cockcroft', 'clearance', 'creatinina', 'tf', 'renal', 'dose'],
    evidenceLevel: 'A',
    reference: 'Cockcroft DW, Gault MH. Nephron. 1976;16(1):31–41.',
  },
  'ckd-epi': {
    id: 'ckd-epi',
    name: 'eGFR (CKD-EPI 2021)',
    shortName: 'CKD-EPI 2021',
    description:
      'Race-neutral 2021 CKD-EPI creatinine equation with KDIGO G1–G5 staging.',
    category: 'renal',
    tags: ['ckd-epi', 'tfge', 'drge', 'renal', 'ckd', 'staging'],
    evidenceLevel: 'A',
    reference: 'Inker LA et al. N Engl J Med. 2021;385:1737–1749.',
  },
  mdrd: {
    id: 'mdrd',
    name: 'eGFR (MDRD)',
    shortName: 'MDRD',
    description: 'The four-variable MDRD study equation with KDIGO staging.',
    category: 'renal',
    tags: ['mdrd', 'tfge', 'drge', 'renal', 'ckd'],
    evidenceLevel: 'A',
    reference: 'Levey AS et al. Ann Intern Med. 1999;130:461–470.',
  },

  // ── CARDIOLOGIA ──────────────────────────────────────────────────────────
  'chads-vasc': {
    id: 'chads-vasc',
    name: 'CHA₂DS₂-VASc',
    shortName: 'CHA₂DS₂-VASc',
    description:
      'Stroke risk in atrial fibrillation with sex-aware thresholds for anticoagulation.',
    category: 'cardiologia',
    tags: ['chads-vasc', 'fibrilação atrial', 'AVC', 'anticoagulação', 'risco'],
    evidenceLevel: 'A',
    reference: 'Lip GYH et al. Chest. 2010;137(2):263–272.',
  },
  'has-bled': {
    id: 'has-bled',
    name: 'HAS-BLED',
    shortName: 'HAS-BLED',
    description:
      'Bleeding-risk score in atrial fibrillation; a high score is an indication to correct modifiable factors, not to withhold anticoagulation.',
    category: 'cardiologia',
    tags: ['has-bled', 'sangramento', 'fibrilação atrial', 'risco', 'anticoagulação'],
    evidenceLevel: 'A',
    reference: 'Pisters R et al. Chest. 2010;138(5):1093–1100.',
  },
  framingham: {
    id: 'framingham',
    name: 'Framingham 10-year CHD Risk',
    shortName: 'Framingham',
    description:
      'Wilson 1998 point-score estimate of 10-year hard coronary heart disease risk.',
    category: 'cardiologia',
    tags: ['framingham', 'risco cardiovascular', 'coração', 'colesterol', 'prevenção'],
    evidenceLevel: 'B',
    reference: 'Wilson PW et al. Circulation. 1998;97(18):1837–1847.',
  },

  // ── EMERGÊNCIA ───────────────────────────────────────────────────────────
  glasgow: {
    id: 'glasgow',
    name: 'Glasgow Coma Scale',
    shortName: 'Glasgow',
    description: 'GCS eye, verbal and motor components totalled 3–15 with TBI grading.',
    category: 'emergencia',
    tags: ['glasgow', 'gcs', 'consciência', 'tbi', 'trauma', 'neurologia'],
    evidenceLevel: 'A',
    reference: 'Teasdale G, Jennett B. Lancet. 1974;2(7872):81–84.',
  },
  qsofa: {
    id: 'qsofa',
    name: 'qSOFA',
    shortName: 'qSOFA',
    description:
      'Quick sepsis criteria: respiratory rate, mentation and systolic blood pressure.',
    category: 'emergencia',
    tags: ['qsofa', 'sepsis', 'sépsis', 'infecção', 'triagem'],
    evidenceLevel: 'A',
    reference: 'Seymour CW et al. JAMA. 2016;315(8):762–774.',
  },
  sofa: {
    id: 'sofa',
    name: 'SOFA Score',
    shortName: 'SOFA',
    description:
      'Six-organ Sequential Organ Failure Assessment (0–24) with expected ICU mortality.',
    category: 'emergencia',
    tags: ['sofa', 'sepsis', 'órgãos', 'disfunção', 'icu', 'mortalidade'],
    evidenceLevel: 'A',
    reference: 'Singer M et al. JAMA. 2016;315(8):801–810.',
  },
  'shock-index': {
    id: 'shock-index',
    name: 'Shock Index',
    shortName: 'Shock Index',
    description: 'Heart rate divided by systolic blood pressure as a marker of haemodynamic instability.',
    category: 'emergencia',
    tags: ['shock index', 'choque', 'hemorragia', 'taquicardia', 'hemodinâmica'],
    evidenceLevel: 'B',
    reference: 'Allgöwer M, Burri C. Dtsch Med Wochenschr. 1967;92(43):1947–1950.',
  },

  // ── LABORATORIAL ─────────────────────────────────────────────────────────
  'anion-gap': {
    id: 'anion-gap',
    name: 'Anion Gap',
    shortName: 'Anion Gap',
    description:
      'Anion gap with albumin correction and the delta ratio for mixed acid–base disorders.',
    category: 'laboratorial',
    tags: ['anion gap', 'gasometria', 'acidose', 'alcalose', 'laboratório'],
    evidenceLevel: 'A',
    reference: 'Emmett M, Narins RG. Medicine. 1977;56(1):38–54.',
  },
  osmolalidade: {
    id: 'osmolalidade',
    name: 'Serum Osmolality',
    shortName: 'Osmolalidade',
    description:
      'Calculated plasma osmolality and, when a measured value is supplied, the osmolal gap.',
    category: 'laboratorial',
    tags: ['osmolaridade', 'osmolalidade', 'glicose', 'ureia', 'etanol'],
    evidenceLevel: 'A',
    reference: 'Bhagat CI et al. Clin Chem. 1984;30(10):1706–1708.',
  },
  'correcao-sodio': {
    id: 'correcao-sodio',
    name: 'Corrected Sodium',
    shortName: 'Correção Na⁺',
    description: 'Corrects measured sodium for the dilutional effect of hyperglycaemia.',
    category: 'laboratorial',
    tags: ['sódio', 'correção', 'glicemia', 'hipernatremia', 'hiponatremia'],
    evidenceLevel: 'B',
    reference: 'Katz MA. N Engl J Med. 1973;289(16):843–844.',
  },
  'correcao-calcio': {
    id: 'correcao-calcio',
    name: 'Corrected Calcium',
    shortName: 'Correção Ca²⁺',
    description: 'Albumin-corrected total calcium for hypo- and hypercalcaemia.',
    category: 'laboratorial',
    tags: ['cálcio', 'albumina', 'correção', 'hipocalcemia', 'laboratório'],
    evidenceLevel: 'B',
    reference: 'Payne RB et al. BMJ. 1973;4(5893):643–646.',
  },
  hba1c: {
    id: 'hba1c',
    name: 'HbA1c & Estimated Glucose',
    shortName: 'HbA1c',
    description:
      'Glycated haemoglobin with ADAG-derived average glucose and the ADAG T2DM target.',
    category: 'laboratorial',
    tags: ['hba1c', 'glicemia', 'diabetes', 'eag', 'laboratório'],
    evidenceLevel: 'A',
    reference: 'Nathan DM et al. Diabetes Care. 2008;31(8):1473–1478.',
  },

  // ── NUTRIÇÃO ─────────────────────────────────────────────────────────────
  'harris-benedict': {
    id: 'harris-benedict',
    name: 'Resting Energy Expenditure',
    shortName: 'Harris-Benedict',
    description:
      'Revised Harris-Benedict BMR, total daily energy expenditure and a protein target.',
    category: 'nutricao',
    tags: ['harris-benedict', 'bmr', 'tmb', 'calorias', 'proteína', 'nutrição'],
    evidenceLevel: 'B',
    reference: 'Roza AM, Shizgal HM. Am J Clin Nutr. 1984;40(1):168–182.',
  },
  'holliday-segar': {
    id: 'holliday-segar',
    name: 'Paediatric Fluid Requirement',
    shortName: 'Holliday-Segar',
    description: 'The 4-2-1 rule for hourly and daily maintenance fluid in children.',
    category: 'nutricao',
    tags: ['holliday-segar', 'pediatria', 'hidratação', '4-2-1', 'soro'],
    evidenceLevel: 'A',
    reference: 'Holliday MA, Segar WE. Pediatrics. 1957;19(5):823–832.',
  },
}

/**
 * Every registered calculator id, in registry order.
 *
 * Used by the logic-layer test-suite to guarantee metadata and implementations
 * stay in sync.
 */
export const CALCULATOR_IDS = Object.keys(CALCULATORS_META)

/**
 * Calculator ids belonging to a category, ordered by registry order.
 *
 * @param category - Category to filter by.
 */
export const calculatorsByCategory = (category: CalcCategory): CalculatorMeta[] =>
  CALCULATOR_IDS.map(id => CALCULATORS_META[id]).filter(m => m.category === category)