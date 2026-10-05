import { defineAsyncComponent, type Component } from 'vue'
import { requireMeta, type CalculatorId } from '@/data/calculator-meta'
import type { CalcResult } from '@/types/logic'

export type { CalculatorId }

export interface CalculatorEntry {
  meta: ReturnType<typeof requireMeta>
  /** Code-split per calculator, so the first paint stays small. */
  form: Component
  /**
   * Parameterised by `never`: each form emits its own `XxxInput`, so the only
   * legitimate call is one whose payload matches that form. It also means a
   * wrong function wired to an id is still caught at the `as never` call site.
   */
  calculate: (input: never) => CalcResult
}

/**
 * TEMPORARY — `calculate` is not implemented yet.
 *
 * The formulas are owned by the `feat/calc-logic` worktree (`src/logic/`), which
 * has not landed. Rather than duplicate clinical maths here, every entry throws
 * a named error until the branch merges. The wiring around it — validation-error
 * handling, history persistence, result rendering, sharing — is real and final.
 *
 * MERGE: replace each `calculate` body with the dynamic import from the logic
 * layer, e.g.
 *   calculate: async (i) => (await import('@/logic/calculators/antropometria/imc')).calculateBmi(i)
 * and re-point `CalculatorId` at the merged `CALCULATORS_META`.
 */
function pending(id: CalculatorId): (input: never) => CalcResult {
  return () => {
    throw new Error(
      `A calculadora "${id}" ainda não está disponível: a camada de lógica clínica ` +
        `(feat/calc-logic) ainda não foi integrada.`,
    )
  }
}

export const CALCULATOR_REGISTRY: Record<CalculatorId, CalculatorEntry> = {
  imc: {
    meta: requireMeta('imc'),
    form: defineAsyncComponent(() => import('@/components/calculators/imc/ImcForm.vue')),
    calculate: pending('imc'),
  },
  'superficie-corporal': {
    meta: requireMeta('superficie-corporal'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/superficie-corporal/SuperficieCorporalForm.vue'),
    ),
    calculate: pending('superficie-corporal'),
  },
  'peso-ideal': {
    meta: requireMeta('peso-ideal'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/peso-ideal/PesoIdealForm.vue'),
    ),
    calculate: pending('peso-ideal'),
  },
  'dose-peso': {
    meta: requireMeta('dose-peso'),
    form: defineAsyncComponent(() => import('@/components/calculators/dose-peso/DosePesoForm.vue')),
    calculate: pending('dose-peso'),
  },
  gotejamento: {
    meta: requireMeta('gotejamento'),
    form: defineAsyncComponent(() => import('@/components/calculators/gotejamento/GotejamentoForm.vue')),
    calculate: pending('gotejamento'),
  },
  diluicao: {
    meta: requireMeta('diluicao'),
    form: defineAsyncComponent(() => import('@/components/calculators/diluicao/DiluicaoForm.vue')),
    calculate: pending('diluicao'),
  },
  'infusao-continua': {
    meta: requireMeta('infusao-continua'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/infusao-continua/InfusaoContinuaForm.vue'),
    ),
    calculate: pending('infusao-continua'),
  },
  cockcroft: {
    meta: requireMeta('cockcroft'),
    form: defineAsyncComponent(() => import('@/components/calculators/cockcroft/CockcroftForm.vue')),
    calculate: pending('cockcroft'),
  },
  'ckd-epi': {
    meta: requireMeta('ckd-epi'),
    form: defineAsyncComponent(() => import('@/components/calculators/ckd-epi/CkdEpiForm.vue')),
    calculate: pending('ckd-epi'),
  },
  mdrd: {
    meta: requireMeta('mdrd'),
    form: defineAsyncComponent(() => import('@/components/calculators/mdrd/MdrdForm.vue')),
    calculate: pending('mdrd'),
  },
  'chads-vasc': {
    meta: requireMeta('chads-vasc'),
    form: defineAsyncComponent(() => import('@/components/calculators/chads-vasc/ChadsVascForm.vue')),
    calculate: pending('chads-vasc'),
  },
  'has-bled': {
    meta: requireMeta('has-bled'),
    form: defineAsyncComponent(() => import('@/components/calculators/has-bled/HasBledForm.vue')),
    calculate: pending('has-bled'),
  },
  framingham: {
    meta: requireMeta('framingham'),
    form: defineAsyncComponent(() => import('@/components/calculators/framingham/FraminghamForm.vue')),
    calculate: pending('framingham'),
  },
  glasgow: {
    meta: requireMeta('glasgow'),
    form: defineAsyncComponent(() => import('@/components/calculators/glasgow/GlasgowForm.vue')),
    calculate: pending('glasgow'),
  },
  qsofa: {
    meta: requireMeta('qsofa'),
    form: defineAsyncComponent(() => import('@/components/calculators/qsofa/QsofaForm.vue')),
    calculate: pending('qsofa'),
  },
  sofa: {
    meta: requireMeta('sofa'),
    form: defineAsyncComponent(() => import('@/components/calculators/sofa/SofaForm.vue')),
    calculate: pending('sofa'),
  },
  'shock-index': {
    meta: requireMeta('shock-index'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/shock-index/ShockIndexForm.vue'),
    ),
    calculate: pending('shock-index'),
  },
  'anion-gap': {
    meta: requireMeta('anion-gap'),
    form: defineAsyncComponent(() => import('@/components/calculators/anion-gap/AnionGapForm.vue')),
    calculate: pending('anion-gap'),
  },
  osmolalidade: {
    meta: requireMeta('osmolalidade'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/osmolalidade/OsmolalidadeForm.vue'),
    ),
    calculate: pending('osmolalidade'),
  },
  'correcao-sodio': {
    meta: requireMeta('correcao-sodio'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/correcao-sodio/CorrecaoSodioForm.vue'),
    ),
    calculate: pending('correcao-sodio'),
  },
  'correcao-calcio': {
    meta: requireMeta('correcao-calcio'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/correcao-calcio/CorrecaoCalcioForm.vue'),
    ),
    calculate: pending('correcao-calcio'),
  },
  hba1c: {
    meta: requireMeta('hba1c'),
    form: defineAsyncComponent(() => import('@/components/calculators/hba1c/Hba1cForm.vue')),
    calculate: pending('hba1c'),
  },
  'harris-benedict': {
    meta: requireMeta('harris-benedict'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/harris-benedict/HarrisBenedictForm.vue'),
    ),
    calculate: pending('harris-benedict'),
  },
  'holliday-segar': {
    meta: requireMeta('holliday-segar'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/holliday-segar/HollidaySegarForm.vue'),
    ),
    calculate: pending('holliday-segar'),
  },
}

export function getEntry(id: string): CalculatorEntry | undefined {
  return Object.prototype.hasOwnProperty.call(CALCULATOR_REGISTRY, id)
    ? CALCULATOR_REGISTRY[id as CalculatorId]
    : undefined
}
