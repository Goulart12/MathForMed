<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { ActivityFactor, HarrisBenedictInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: HarrisBenedictInput] }>()

const weightKg = ref<number | null>(null)
const heightCm = ref<number | null>(null)
const age = ref<number | null>(null)
const sex = ref<'M' | 'F'>('M')
const activityFactor = ref('1.2')
/** Optional clinical stress multiplier, e.g. 1.3 for sepsis. */
const stressFactor = ref<number | null>(null)

const ACTIVITY_OPTIONS = [
  { value: '1.2', label: '1,2 — Sedentário' },
  { value: '1.375', label: '1,375 — Leve' },
  { value: '1.55', label: '1,55 — Moderado' },
  { value: '1.725', label: '1,725 — Intenso' },
  { value: '1.9', label: '1,9 — Muito intenso' },
]

const requiredFilled = computed(
  () =>
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300 &&
    heightCm.value !== null && heightCm.value >= 50 && heightCm.value <= 250 &&
    age.value !== null && age.value >= 1 && age.value <= 120,
)

const stressValid = computed(
  () => stressFactor.value === null || (stressFactor.value >= 1 && stressFactor.value <= 3),
)

const stressError = computed(() =>
  stressFactor.value !== null && !stressValid.value ? 'Use um fator entre 1 e 3.' : undefined,
)

const isValid = computed(() => requiredFilled.value && stressValid.value)

function handleSubmit() {
  const weight = weightKg.value
  const height = heightCm.value
  const years = age.value
  if (!isValid.value || weight === null || height === null || years === null) return
  emit('calculate', {
    weightKg: weight,
    heightCm: height,
    age: years,
    sex: sex.value,
    activityFactor: Number(activityFactor.value) as ActivityFactor,
    ...(stressFactor.value === null ? {} : { stressFactor: stressFactor.value }),
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="weightKg"
      label="Peso"
      unit="kg"
      :min="0.5"
      :max="300"
      placeholder="70"
      required
    />
    <AppInput
      v-model="heightCm"
      label="Altura"
      unit="cm"
      :min="50"
      :max="250"
      placeholder="175"
      required
    />
    <AppInput v-model="age" label="Idade" unit="anos" :min="1" :max="120" placeholder="45" required />
    <AppToggle v-model="sex" label="Sexo" :options="['M', 'F']" />

    <SectionHeader title="Gasto energético" />
    <AppSelect
      v-model="activityFactor"
      label="Nível de atividade"
      :options="ACTIVITY_OPTIONS"
    />
    <AppInput
      v-model="stressFactor"
      label="Fator de estresse (opcional)"
      :min="1"
      :max="3"
      step="0.01"
      placeholder="1.3"
      :error="stressError"
      hint="Ex.: 1,3 no sepse, 1,2 em pós-operatório."
    />

    <p v-if="!isValid && !stressError" class="text-center text-sm text-ink-faint">
      Preencha peso, altura e idade.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular gasto energético
    </AppButton>
  </form>
</template>
