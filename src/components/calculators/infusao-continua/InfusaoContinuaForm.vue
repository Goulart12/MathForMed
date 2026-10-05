<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { InfusaoContinuaInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: InfusaoContinuaInput] }>()

const doseMcgKgMin = ref<number | null>(null)
const weightKg = ref<number | null>(null)
const concentrationMcgMl = ref<number | null>(null)

const isValid = computed(
  () =>
    doseMcgKgMin.value !== null && doseMcgKgMin.value >= 0.001 && doseMcgKgMin.value <= 1000 &&
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300 &&
    concentrationMcgMl.value !== null && concentrationMcgMl.value > 0,
)

function handleSubmit() {
  const dose = doseMcgKgMin.value
  const weight = weightKg.value
  const concentration = concentrationMcgMl.value
  if (!isValid.value || dose === null || weight === null || concentration === null) return
  emit('calculate', {
    doseMcgKgMin: dose,
    weightKg: weight,
    concentrationMcgMl: concentration,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="doseMcgKgMin"
      label="Dose"
      unit="mcg/kg/min"
      :min="0.001"
      :max="1000"
      step="0.001"
      placeholder="0.1"
      required
    />
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
      v-model="concentrationMcgMl"
      label="Concentração do diluído"
      unit="mcg/mL"
      :min="0"
      placeholder="1000"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha dose, peso e concentração do diluído.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular taxa de infusão
    </AppButton>
  </form>
</template>
