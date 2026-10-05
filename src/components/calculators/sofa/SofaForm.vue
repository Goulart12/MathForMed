<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { SofaInput } from '@/logic/calculators/emergencia/sofa'
const emit = defineEmits<{ calculate: [input: SofaInput] }>()

/** Each organ is collected as its published 0–4 band, already resolved. */
function options(labels: [string, string, string, string, string]) {
  return labels.map((label, score) => ({ value: String(score), label: `${score} — ${label}` }))
}

const respirationScore = ref('0')
const coagulationScore = ref('0')
const liverScore = ref('0')
const cardiovascularScore = ref('0')
const cnsScore = ref('0')
const renalScore = ref('0')

const RESPIRATION = options([
  'PaO₂/FiO₂ ≥ 400',
  '< 400',
  '< 300 com suporte',
  '< 200 com suporte',
  '< 100 com suporte',
])
const COAGULATION = options([
  'Plaquetas ≥ 150',
  '< 150',
  '< 100',
  '< 50',
  '< 20',
])
const LIVER = options([
  'Bilirrubina < 1,2',
  '1,2 – 1,9',
  '2,0 – 5,9',
  '6,0 – 11,9',
  '≥ 12,0',
])
const CARDIOVASCULAR = options([
  'PAM ≥ 70 mmHg',
  'PAM < 70 mmHg',
  'Dopamina ≤ 5 ou dobutamina',
  'Dopamina > 5 ou noradrenalina ≤ 0,1',
  'Noradrenalina > 0,1',
])
const CNS = options(['Glasgow 15', 'Glasgow 13–14', 'Glasgow 10–12', 'Glasgow 6–9', 'Glasgow ≤ 5'])
const RENAL = options([
  'Creatinina < 1,2',
  '1,2 – 1,9',
  '2,0 – 3,4 ou diurese < 500 mL',
  '3,5 – 4,9 ou diurese < 200 mL',
  '≥ 5,0 ou diurese < 100 mL',
])

const all = [
  respirationScore,
  coagulationScore,
  liverScore,
  cardiovascularScore,
  cnsScore,
  renalScore,
]

/** All six bands default to 0, so the form is submittable from the start. */
const isValid = computed(() => all.every((ref) => ref.value !== '' && Number(ref.value) >= 0))

function handleSubmit() {
  if (!isValid.value) return
  // The <select> only offers 0–4, which is exactly the `SofaScore` union.
  const score = (value: string | number) => Number(value) as SofaInput['respirationScore']
  emit('calculate', {
    respirationScore: score(respirationScore.value),
    coagulationScore: score(coagulationScore.value),
    liverScore: score(liverScore.value),
    cardiovascularScore: score(cardiovascularScore.value),
    cnsScore: score(cnsScore.value),
    renalScore: score(renalScore.value),
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <p class="text-sm text-ink-secondary">
      Para cada sistema, escolha a faixa 0–4 correspondente. Total de 0 a 24.
    </p>

    <AppSelect v-model="respirationScore" label="Respiração" :options="RESPIRATION" />
    <AppSelect v-model="coagulationScore" label="Coagulação" :options="COAGULATION" />
    <AppSelect v-model="liverScore" label="Fígado" :options="LIVER" />
    <AppSelect v-model="cardiovascularScore" label="Cardiovascular" :options="CARDIOVASCULAR" />
    <AppSelect v-model="cnsScore" label="Sistema nervoso central" :options="CNS" />
    <AppSelect v-model="renalScore" label="Renal" :options="RENAL" />

    <SectionHeader title="Total" subtitle="Soma dos seis sistemas." />

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular SOFA
    </AppButton>
  </form>
</template>
