<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { DilutionInput } from '@/logic/calculators/medicacao/diluicao'
const emit = defineEmits<{ calculate: [input: DilutionInput] }>()

const unit = ref('mg/mL')
const initialConcentration = ref<number | null>(null)
const initialVolumeMl = ref<number | null>(null)
const finalConcentration = ref<number | null>(null)

const positives = computed(
  () =>
    initialConcentration.value !== null && initialConcentration.value > 0 &&
    initialVolumeMl.value !== null && initialVolumeMl.value > 0 &&
    finalConcentration.value !== null && finalConcentration.value > 0,
)

/**
 * A dilution must end up *weaker* than it started. The logic layer rejects a
 * final concentration at or above the original, so the CTA stays disabled and
 * the field explains why rather than letting the submit throw.
 */
const isConcentrationOrdered = computed(
  () =>
    initialConcentration.value === null ||
    finalConcentration.value === null ||
    finalConcentration.value < initialConcentration.value,
)

const dilutionError = computed(() =>
  positives.value && !isConcentrationOrdered.value
    ? 'A concentração final deve ser menor que a inicial — isto é uma diluição.'
    : undefined,
)

const isValid = computed(() => positives.value && isConcentrationOrdered.value)

function handleSubmit() {
  const c1 = initialConcentration.value
  const v1 = initialVolumeMl.value
  const c2 = finalConcentration.value
  if (!isValid.value || c1 === null || v1 === null || c2 === null) return
  emit('calculate', {
    initialConcentration: c1,
    initialVolumeMl: v1,
    finalConcentration: c2,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <p class="text-sm text-ink-secondary">
      As concentrações devem usar a mesma unidade. Ex.: <span class="font-mono">mg/mL</span>,
      <span class="font-mono">UI/mL</span>.
    </p>

    <AppInput
      v-model="unit"
      label="Unidade de concentração"
      type="text"
      placeholder="mg/mL"
      required
    />
    <AppInput
      v-model="initialConcentration"
      label="Concentração inicial"
      :unit="unit"
      :min="0"
      placeholder="100"
      required
    />
    <AppInput
      v-model="initialVolumeMl"
      label="Volume inicial retirado"
      unit="mL"
      :min="0"
      placeholder="1"
      required
    />
    <AppInput
      v-model="finalConcentration"
      label="Concentração final desejada"
      :unit="unit"
      :min="0"
      placeholder="10"
      :error="dilutionError"
      required
    />

    <p v-if="!isValid && !dilutionError" class="text-center text-sm text-ink-faint">
      Preencha as duas concentrações e o volume inicial.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular diluição
    </AppButton>
  </form>
</template>
