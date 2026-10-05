<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { DoseByWeightInput, UnitDoseUnit } from '@/logic/calculators/medicacao/dosePorPeso'
const emit = defineEmits<{ calculate: [input: DoseByWeightInput] }>()

const unitDoseUnit = ref<UnitDoseUnit>('mg/kg')
const unitDose = ref<number | null>(null)
const weightKg = ref<number | null>(null)
const concentrationPerMl = ref<number | null>(null)
const availableVolumeMl = ref<number | null>(null)

const UNIT_OPTIONS = [
  { value: 'mg/kg', label: 'mg/kg' },
  { value: 'mcg/kg', label: 'mcg/kg' },
  { value: 'IU/kg', label: 'IU/kg' },
]

const isValid = computed(
  () =>
    unitDose.value !== null && unitDose.value > 0 &&
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300 &&
    concentrationPerMl.value !== null && concentrationPerMl.value > 0 &&
    availableVolumeMl.value !== null && availableVolumeMl.value > 0,
)

function handleSubmit() {
  const dose = unitDose.value
  const weight = weightKg.value
  const concentration = concentrationPerMl.value
  const available = availableVolumeMl.value
  if (
    !isValid.value || dose === null || weight === null ||
    concentration === null || available === null
  ) {
    return
  }
  emit('calculate', {
    unitDose: dose,
    unitDoseUnit: unitDoseUnit.value,
    weightKg: weight,
    concentrationPerMl: concentration,
    availableVolumeMl: available,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppSelect v-model="unitDoseUnit" label="Unidade da dose" :options="UNIT_OPTIONS" required />
    <AppInput
      v-model="unitDose"
      label="Dose unitária"
      :unit="unitDoseUnit"
      :min="0"
      placeholder="15"
      required
    />
    <AppInput
      v-model="weightKg"
      label="Peso"
      unit="kg"
      :min="0.5"
      :max="300"
      placeholder="20"
      required
    />
    <AppInput
      v-model="concentrationPerMl"
      label="Concentração da apresentação"
      :unit="`${unitDoseUnit.split('/')[0]}/mL`"
      :min="0"
      placeholder="10"
      required
    />
    <AppInput
      v-model="availableVolumeMl"
      label="Volume disponível no frasco"
      unit="mL"
      :min="0"
      placeholder="10"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha todos os campos com valores válidos.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular volume
    </AppButton>
  </form>
</template>
