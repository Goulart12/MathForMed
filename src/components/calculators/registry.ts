import { defineAsyncComponent, type Component } from 'vue'
import { requireMeta, type CalculatorId } from '@/data/calculator-meta'
import type { CalcResult } from '@/logic/types'

export type { CalculatorId }

export interface CalculatorEntry {
  meta: ReturnType<typeof requireMeta>
  /** Code-split per calculator, so the first paint stays small. */
  form: Component
  /**
   * Parameterised by `never`: each form emits its own `XxxInput`, so the only
   * legitimate call is one whose payload matches that form. It also means a
   * wrong function wired to an id is still caught at the call site.
   *
   * The logic module is imported dynamically so each calculator's clinical code
   * ships in its own chunk, alongside its form.
   */
  calculate: (input: never) => Promise<CalcResult>
}

export const CALCULATOR_REGISTRY: Record<CalculatorId, CalculatorEntry> = {
  imc: {
    meta: requireMeta('imc'),
    form: defineAsyncComponent(() => import('@/components/calculators/imc/ImcForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/antropometria/imc')).calculateBmi(input),
  },
  'superficie-corporal': {
    meta: requireMeta('superficie-corporal'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/superficie-corporal/SuperficieCorporalForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/antropometria/superficieCorporal')).calculateBsa(input),
  },
  'peso-ideal': {
    meta: requireMeta('peso-ideal'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/peso-ideal/PesoIdealForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/antropometria/pesoIdeal')).calculateIdealBodyWeight(input),
  },
  'dose-peso': {
    meta: requireMeta('dose-peso'),
    form: defineAsyncComponent(() => import('@/components/calculators/dose-peso/DosePesoForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/medicacao/dosePorPeso')).calculateDoseByWeight(input),
  },
  gotejamento: {
    meta: requireMeta('gotejamento'),
    form: defineAsyncComponent(() => import('@/components/calculators/gotejamento/GotejamentoForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/medicacao/gotejamento')).calculateDripRate(input),
  },
  diluicao: {
    meta: requireMeta('diluicao'),
    form: defineAsyncComponent(() => import('@/components/calculators/diluicao/DiluicaoForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/medicacao/diluicao')).calculateDilution(input),
  },
  'infusao-continua': {
    meta: requireMeta('infusao-continua'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/infusao-continua/InfusaoContinuaForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/medicacao/infusaoContinua')).calculateInfusionRate(input),
  },
  cockcroft: {
    meta: requireMeta('cockcroft'),
    form: defineAsyncComponent(() => import('@/components/calculators/cockcroft/CockcroftForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/renal/creatininaClearance')).calculateCreatinineClearance(
        input,
      ),
  },
  'ckd-epi': {
    meta: requireMeta('ckd-epi'),
    form: defineAsyncComponent(() => import('@/components/calculators/ckd-epi/CkdEpiForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/renal/tfgCkdEpi')).calculateCkdEpi(input),
  },
  mdrd: {
    meta: requireMeta('mdrd'),
    form: defineAsyncComponent(() => import('@/components/calculators/mdrd/MdrdForm.vue')),
    calculate: async input => (await import('@/logic/calculators/renal/tfgMdrd')).calculateMdrd(input),
  },
  'chads-vasc': {
    meta: requireMeta('chads-vasc'),
    form: defineAsyncComponent(() => import('@/components/calculators/chads-vasc/ChadsVascForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/cardiologia/chadsVasc')).calculateChadsVasc(input),
  },
  'has-bled': {
    meta: requireMeta('has-bled'),
    form: defineAsyncComponent(() => import('@/components/calculators/has-bled/HasBledForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/cardiologia/hasbled')).calculateHasBled(input),
  },
  framingham: {
    meta: requireMeta('framingham'),
    form: defineAsyncComponent(() => import('@/components/calculators/framingham/FraminghamForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/cardiologia/framingham')).calculateFramingham(input),
  },
  glasgow: {
    meta: requireMeta('glasgow'),
    form: defineAsyncComponent(() => import('@/components/calculators/glasgow/GlasgowForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/emergencia/glasgow')).calculateGlasgow(input),
  },
  qsofa: {
    meta: requireMeta('qsofa'),
    form: defineAsyncComponent(() => import('@/components/calculators/qsofa/QsofaForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/emergencia/qsofa')).calculateQsofa(input),
  },
  sofa: {
    meta: requireMeta('sofa'),
    form: defineAsyncComponent(() => import('@/components/calculators/sofa/SofaForm.vue')),
    calculate: async input => (await import('@/logic/calculators/emergencia/sofa')).calculateSofa(input),
  },
  'shock-index': {
    meta: requireMeta('shock-index'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/shock-index/ShockIndexForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/emergencia/shockIndex')).calculateShockIndex(input),
  },
  'anion-gap': {
    meta: requireMeta('anion-gap'),
    form: defineAsyncComponent(() => import('@/components/calculators/anion-gap/AnionGapForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/laboratorial/anionGap')).calculateAnionGap(input),
  },
  osmolalidade: {
    meta: requireMeta('osmolalidade'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/osmolalidade/OsmolalidadeForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/laboratorial/osmolalidade')).calculateOsmolality(input),
  },
  'correcao-sodio': {
    meta: requireMeta('correcao-sodio'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/correcao-sodio/CorrecaoSodioForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/laboratorial/correcaoSodio')).calculateCorrectedSodium(input),
  },
  'correcao-calcio': {
    meta: requireMeta('correcao-calcio'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/correcao-calcio/CorrecaoCalcioForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/laboratorial/correcaoCalcio')).calculateCorrectedCalcium(
        input,
      ),
  },
  hba1c: {
    meta: requireMeta('hba1c'),
    form: defineAsyncComponent(() => import('@/components/calculators/hba1c/Hba1cForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/laboratorial/hba1c')).calculateHba1c(input),
  },
  'harris-benedict': {
    meta: requireMeta('harris-benedict'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/harris-benedict/HarrisBenedictForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/nutricao/harrisBenedict')).calculateHarrisBenedict(input),
  },
  'holliday-segar': {
    meta: requireMeta('holliday-segar'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/holliday-segar/HollidaySegarForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/nutricao/hollidaySegar')).calculateHollidaySegar(input),
  },
  'dpp-naegele': {
    meta: requireMeta('dpp-naegele'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/dpp-naegele/DppNaegeleForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/ginecologia/dppNaegele')).calculateDppNaegele(input),
  },
  'idade-gestacional': {
    meta: requireMeta('idade-gestacional'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/idade-gestacional/IdadeGestacionalForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/ginecologia/idadeGestacional')).calculateIdadeGestacional(
        input,
      ),
  },
  'ig-usg': {
    meta: requireMeta('ig-usg'),
    form: defineAsyncComponent(() => import('@/components/calculators/ig-usg/IgUsgForm.vue')),
    calculate: async input =>
      (await import('@/logic/calculators/ginecologia/igUsg')).calculateIgUsg(input),
  },
  'altura-uterina': {
    meta: requireMeta('altura-uterina'),
    form: defineAsyncComponent(
      () => import('@/components/calculators/altura-uterina/AlturaUterinaForm.vue'),
    ),
    calculate: async input =>
      (await import('@/logic/calculators/ginecologia/alturaUterina')).calculateAlturaUterina(input),
  },
}

export function getEntry(id: string): CalculatorEntry | undefined {
  return Object.prototype.hasOwnProperty.call(CALCULATOR_REGISTRY, id)
    ? CALCULATOR_REGISTRY[id as CalculatorId]
    : undefined
}
