<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { BmiInput } from '@/logic/calculators/antropometria/imc'
const emit = defineEmits<{ calculate: [input: BmiInput] }>()

const weightKg = ref<number | null>(null)
/** Clinicians measure height in cm; the logic layer works in metres. */
const heightCm = ref<number | null>(null)

/**
 * Mirrors the ranges the logic layer accepts so the CTA can never enable a
 * submission that would throw. Presence + range only — no formula here.
 */
const isValid = computed(
  () =>
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300 &&
    heightCm.value !== null && heightCm.value >= 30 && heightCm.value <= 250,
)

function handleSubmit() {
  const weight = weightKg.value
  const height = heightCm.value
  if (!isValid.value || weight === null || height === null) return
  // cm → m: unit normalisation, not a clinical formula.
  emit('calculate', { weightKg: weight, heightM: height / 100 })
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
      :min="30"
      :max="250"
      placeholder="175"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha peso e altura para calcular.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular IMC
    </AppButton>
  </form>
</template>
