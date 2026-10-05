<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { IdealBodyWeightInput } from '@/logic/calculators/antropometria/pesoIdeal'
const emit = defineEmits<{ calculate: [input: IdealBodyWeightInput] }>()

const heightCm = ref<number | null>(null)
const weightKg = ref<number | null>(null)
const sex = ref<'M' | 'F'>('M')

const isValid = computed(
  () =>
    heightCm.value !== null && heightCm.value >= 30 && heightCm.value <= 250 &&
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300,
)

function handleSubmit() {
  const height = heightCm.value
  const weight = weightKg.value
  if (!isValid.value || height === null || weight === null) return
  emit('calculate', { heightM: height / 100, weightKg: weight, sex: sex.value })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="heightCm"
      label="Altura"
      unit="cm"
      :min="30"
      :max="250"
      placeholder="175"
      required
    />
    <AppInput
      v-model="weightKg"
      label="Peso atual"
      unit="kg"
      :min="0.5"
      :max="300"
      placeholder="70"
      hint="Necessário apenas para o peso corpóreo ajustado."
      required
    />
    <AppToggle v-model="sex" label="Sexo" :options="['M', 'F']" />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha altura e peso para calcular.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular peso ideal
    </AppButton>
  </form>
</template>
