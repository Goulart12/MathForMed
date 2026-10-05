/**
 * TEMPORARY SHIM — design worktree only.
 *
 * Mirrors `src/logic/constants.ts` (`CALCULATORS_META`) from the `feat/calc-logic`
 * worktree. Home, category, search and favorites views all key off these ids, so
 * the ids here are the contract that must survive the merge byte-for-byte.
 *
 * MERGE: replace the body of this file with
 *   export { CALCULATORS_META } from '@/logic/constants'
 * and delete the local entries. Only `name` / `description` / `shortName` are
 * display copy; the ids and categories are what the rest of the app depends on.
 */
import type { CalculatorMeta } from '@/types/logic'

export const CALCULATORS_META: Record<string, CalculatorMeta> = {
  /* ---------------------------- antropometria ---------------------------- */
  imc: {
    id: 'imc',
    name: 'Índice de Massa Corporal',
    shortName: 'IMC',
    description: 'Classificação de peso pela OMS a partir de peso e altura.',
    category: 'antropometria',
    tags: ['peso', 'altura', 'obesidade', 'bmi'],
    evidenceLevel: 'A',
    reference: 'WHO. Obesity: preventing and managing the global epidemic. 2000.',
  },
  'superficie-corporal': {
    id: 'superficie-corporal',
    name: 'Superfície Corporal',
    shortName: 'SC',
    description: 'Mosteller ou DuBois para dosear Drugs por superfície corporal.',
    category: 'antropometria',
    tags: ['sc', 'dose', 'mosteller', 'dubois', 'oncologia'],
    evidenceLevel: 'B',
    reference: 'Mosteller RD. NEJM. 1987;317:1098.',
  },
  'peso-ideal': {
    id: 'peso-ideal',
    name: 'Peso Ideal',
    shortName: 'Peso ideal',
    description: 'Peso ideal Devine e peso corpóreo ajustado para obesos.',
    category: 'antropometria',
    tags: ['devine', 'peso', 'ajuste', 'doses'],
    evidenceLevel: 'B',
    reference: 'Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655.',
  },

  /* ------------------------------ medicacao ------------------------------ */
  'dose-peso': {
    id: 'dose-peso',
    name: 'Dose por Peso',
    shortName: 'Dose/kg',
    description: 'Converte mg/kg, mcg/kg ou IU/kg em mL a retirar da ampola.',
    category: 'medicacao',
    tags: ['dose', 'peso', 'pediatria', 'ampola'],
    evidenceLevel: 'A',
    reference: 'Brunton LL et al. Goodman & Gilman. 13th ed.',
  },
  gotejamento: {
    id: 'gotejamento',
    name: 'Gotejamento',
    shortName: 'Gotejamento',
    description: 'Gotas por minuto e mL/h a partir de volume, tempo e cateter.',
    category: 'medicacao',
    tags: ['gtt', 'gotas', 'infusão', 'cateter', 'macrodrip', 'microdrip'],
    evidenceLevel: 'A',
    reference: 'Infusion Nurses Society. Infusion Therapy Standards. 2021.',
  },
  diluicao: {
    id: 'diluicao',
    name: 'Diluição',
    shortName: 'Diluição',
    description: 'Volume final e volume de solvente pela relação C1·V1 = C2·V2.',
    category: 'medicacao',
    tags: ['diluição', 'c1v1c2v2', 'solvente', 'farmácia'],
    evidenceLevel: 'B',
    reference: 'Trissel LA. Handbook on Injectable Drugs. 18th ed.',
  },
  'infusao-continua': {
    id: 'infusao-continua',
    name: 'Infusão Contínua',
    shortName: 'Infusão contínua',
    description: 'Taxa em mL/h para Drugs vasoativos em mcg/kg/min.',
    category: 'medicacao',
    tags: ['infusão', 'mcg/kg/min', 'vasoativo', 'bomba', 'uti'],
    evidenceLevel: 'A',
    reference: 'Lexicomp Online. Drug Information. Wolters Kluwer.',
  },

  /* -------------------------------- renal -------------------------------- */
  cockcroft: {
    id: 'cockcroft',
    name: 'Clearance de Creatinina',
    shortName: 'Cockcroft-Gault',
    description: 'ClCr por Cockcroft-Gault com estadiamento KDIGO.',
    category: 'renal',
    tags: ['cockcroft', 'clcr', 'kdigo', 'filtro', 'creatinina'],
    evidenceLevel: 'A',
    reference: 'Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41.',
  },
  'ckd-epi': {
    id: 'ckd-epi',
    name: 'TFG CKD-EPI 2021',
    shortName: 'CKD-EPI',
    description: 'Filtro glomerular pela equação CKD-EPI 2021, sem raça.',
    category: 'renal',
    tags: ['tfg', 'egfr', 'ckd', 'nefrologia'],
    evidenceLevel: 'A',
    reference: 'Inker LA et al. NEJM. 2021;385:1737-1749.',
  },
  mdrd: {
    id: 'mdrd',
    name: 'TFG MDRD',
    shortName: 'MDRD',
    description: 'Filtro glomerular pela equação MDRD de 4 variáveis.',
    category: 'renal',
    tags: ['tfg', 'egfr', 'mdrd', 'nefrologia'],
    evidenceLevel: 'B',
    reference: 'Levey AS et al. Ann Intern Med. 1999;130:461-470.',
  },

  /* ----------------------------- cardiologia ----------------------------- */
  'chads-vasc': {
    id: 'chads-vasc',
    name: 'CHA₂DS₂-VASc',
    shortName: 'CHA₂DS₂-VASc',
    description: 'Escore tromboembólico na fibrilação atrial.',
    category: 'cardiologia',
    tags: ['fa', 'anticoagulação', 'escore', 'tromboembolia'],
    evidenceLevel: 'A',
    reference: 'Lip GYH et al. Chest. 2010;137(2):263-272.',
  },
  'has-bled': {
    id: 'has-bled',
    name: 'HAS-BLED',
    shortName: 'HAS-BLED',
    description: 'Risco de sangramento em pacientes anticoagulados.',
    category: 'cardiologia',
    tags: ['sangramento', 'anticoagulação', 'fa', 'escore'],
    evidenceLevel: 'A',
    reference: 'Pisters R et al. Chest. 2010;138(5):1093-1100.',
  },
  framingham: {
    id: 'framingham',
    name: 'Risco de Framingham',
    shortName: 'Framingham',
    description: 'Risco cardiovascular em 10 anos por tabela de pontos.',
    category: 'cardiologia',
    tags: ['risco', 'cv', 'coronariana', 'prevenção'],
    evidenceLevel: 'B',
    reference: 'Wilson PW et al. Circulation. 1998;97(18):1837-1847.',
  },

  /* ----------------------------- emergencia ------------------------------ */
  glasgow: {
    id: 'glasgow',
    name: 'Escala de Glasgow',
    shortName: 'Glasgow',
    description: 'Glasgow Coma Scale com os três componentes da resposta.',
    category: 'emergencia',
    tags: ['gcs', 'coma', 'neurologia', 'tce', 'consciência'],
    evidenceLevel: 'A',
    reference: 'Teasdale G, Jennett B. Lancet. 1974;2(7872):81-84.',
  },
  qsofa: {
    id: 'qsofa',
    name: 'qSOFA',
    shortName: 'qSOFA',
    description: 'Critério rápido de sepse fora da UTI.',
    category: 'emergencia',
    tags: ['sepse', 'sepsis', 'infecção', 'triagem'],
    evidenceLevel: 'A',
    reference: 'Seymour CW et al. JAMA. 2016;315(8):762-774.',
  },
  sofa: {
    id: 'sofa',
    name: 'SOFA',
    shortName: 'SOFA',
    description: 'Sequential Organ Failure Assessment, 6 sistemas, 0 a 24.',
    category: 'emergencia',
    tags: ['sofa', 'sepse', 'disfunção', 'uti', 'mortalidade'],
    evidenceLevel: 'A',
    reference: 'Singer M et al. JAMA. 2016;315(8):801-810.',
  },
  'shock-index': {
    id: 'shock-index',
    name: 'Índice de Choque',
    shortName: 'Choque',
    description: 'Frequência cardíaca sobre pressão sistólica.',
    category: 'emergencia',
    tags: ['choque', 'hemorragia', 'taquicardia', 'triagem'],
    evidenceLevel: 'B',
    reference: 'Allgöwer M, Burri C. Dtsch Med Wochenschr. 1967;92(43):1947-1950.',
  },

  /* ---------------------------- laboratorial ----------------------------- */
  'anion-gap': {
    id: 'anion-gap',
    name: 'Anion Gap',
    shortName: 'Anion gap',
    description: 'Bre anionico corrigido pela albumina e razão delta.',
    category: 'laboratorial',
    tags: ['anion gap', 'acose', 'gasometria', 'eletrólitos'],
    evidenceLevel: 'B',
    reference: 'Emmett M, Narins RG. Medicine. 1977;56(1):38-54.',
  },
  osmolalidade: {
    id: 'osmolalidade',
    name: 'Osmolalidade',
    shortName: 'Osmolalidade',
    description: 'Osmolalidade calculada e gap osmolar para alcoóis tóxicos.',
    category: 'laboratorial',
    tags: ['osmolaridade', 'sódio', 'glicose', 'ureia'],
    evidenceLevel: 'B',
    reference: 'Bhagat CI et al. Clin Chem. 1984;30(10):1706-1708.',
  },
  'correcao-sodio': {
    id: 'correcao-sodio',
    name: 'Correção de Sódio',
    shortName: 'Na corrigido',
    description: 'Sódio corrigido pela glicemia na hiperglicemia.',
    category: 'laboratorial',
    tags: ['sódio', 'glicemia', 'hiponatremia', 'correção'],
    evidenceLevel: 'B',
    reference: 'Katz MA. NEJM. 1973;289(16):843-844.',
  },
  'correcao-calcio': {
    id: 'correcao-calcio',
    name: 'Correção de Cálcio',
    shortName: 'Ca corrigido',
    description: 'Cálcio iônico corrigido pela albumina sérica.',
    category: 'laboratorial',
    tags: ['cálcio', 'albumina', 'eletrólitos'],
    evidenceLevel: 'B',
    reference: 'Payne RB et al. BMJ. 1973;4(5893):643-646.',
  },
  hba1c: {
    id: 'hba1c',
    name: 'HbA1c e Glicose Estimada',
    shortName: 'HbA1c',
    description: 'Classificação de diabetes e glicemia média estimada.',
    category: 'laboratorial',
    tags: ['hba1c', 'diabetes', 'glicemia', 'adag'],
    evidenceLevel: 'A',
    reference: 'Nathan DM et al. Diabetes Care. 2008;31(8):1473-1478.',
  },

  /* ------------------------------ nutricao ------------------------------- */
  'harris-benedict': {
    id: 'harris-benedict',
    name: 'Harris-Benedict Revisado',
    shortName: 'Harris-Benedict',
    description: 'TMB, gasto energético total e alvo proteico.',
    category: 'nutricao',
    tags: ['tmb', 'gasto energético', 'dieta', 'roza'],
    evidenceLevel: 'B',
    reference: 'Roza AM, Shizgal HM. Am J Clin Nutr. 1984;40(1):168-182.',
  },
  'holliday-segar': {
    id: 'holliday-segar',
    name: 'Holliday-Segar 4-2-1',
    shortName: 'Holliday-Segar',
    description: 'Manutenção hídrica pediátrica pela regra 4-2-1.',
    category: 'nutricao',
    tags: ['hidratação', 'pediatria', '4-2-1', 'soroterapia'],
    evidenceLevel: 'B',
    reference: 'Holliday MA, Segar WE. Pediatrics. 1957;19(5):823-832.',
  },
}

/**
 * The canonical id list, in display order (grouped by category, matching
 * `CATEGORIES`). Declared as a literal tuple so the registry can be typed
 * against the union, and so a unit test can assert the two never drift.
 */
export const CALCULATOR_IDS = [
  // antropometria
  'imc',
  'superficie-corporal',
  'peso-ideal',
  // medicacao
  'dose-peso',
  'gotejamento',
  'diluicao',
  'infusao-continua',
  // renal
  'cockcroft',
  'ckd-epi',
  'mdrd',
  // cardiologia
  'chads-vasc',
  'has-bled',
  'framingham',
  // emergencia
  'glasgow',
  'qsofa',
  'sofa',
  'shock-index',
  // laboratorial
  'anion-gap',
  'osmolalidade',
  'correcao-sodio',
  'correcao-calcio',
  'hba1c',
  // nutricao
  'harris-benedict',
  'holliday-segar',
] as const

export type CalculatorId = (typeof CALCULATOR_IDS)[number]

export function getCalculatorMeta(id: string): CalculatorMeta | undefined {
  return CALCULATORS_META[id]
}

/**
 * Narrowing accessor for the paths where the id is known to exist — the
 * registry wiring, and display lists built from `CALCULATOR_IDS`. Throwing is
 * deliberate: reaching here means `CALCULATOR_IDS` and `CALCULATORS_META` have
 * drifted, which is a bug we want loud, not one blank row in a list.
 */
export function requireMeta(id: CalculatorId): CalculatorMeta {
  const meta = CALCULATORS_META[id]
  if (!meta) throw new Error(`Calculadora ausente em CALCULATORS_META: "${id}"`)
  return meta
}

/** Metadata for every calculator in one category, in display order. */
export function getByCategory(category: string): CalculatorMeta[] {
  return CALCULATOR_IDS.map(requireMeta).filter((m) => m.category === category)
}

export function countByCategory(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const id of CALCULATOR_IDS) {
    const category = requireMeta(id).category
    counts[category] = (counts[category] ?? 0) + 1
  }
  return counts
}

/** Strips diacritics so `superficie` and `superfície` both match a query. */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Normalised haystack for `SearchView` — a physician types on a phone keyboard
 * that rarely offers the accented key.
 */
function haystack(meta: CalculatorMeta): string {
  return foldText([meta.name, meta.shortName, meta.description, meta.category, ...meta.tags].join(' '))
}

export function normalizeQuery(query: string): string {
  return foldText(query).trim()
}

export function matchesQuery(meta: CalculatorMeta, query: string): boolean {
  const needle = normalizeQuery(query)
  if (!needle) return true
  // Every whitespace-separated term must hit, so "gota infusion" narrows.
  return needle.split(/\s+/).every((term) => haystack(meta).includes(term))
}

export function searchCalculators(query: string): CalculatorMeta[] {
  return CALCULATOR_IDS.map(requireMeta).filter((m) => matchesQuery(m, query))
}
