<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { CorrecaoCalcioInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: CorrecaoCalcioInput] }>()

const measuredCalciumMgDl = ref<number | null>(null)
const albuminGDl = ref<number | null>(null)

const isValid = computed(
  () =>
    measuredCalciumMgDl.value !== null &&
    measuredCalciumMgDl.value >= 4 &&
    measuredCalciumMgDl.value <= 16 &&
    albuminGDl.value !== null && albuminGDl.value >= 1 && albuminGDl.value <= 6,
)

function handleSubmit() {
  const calcium = measuredCalciumMgDl.value
  const albumin = albuminGDl.value
  if (!isValid.value || calcium === null || albumin === null) return
  emit('calculate', { measuredCalciumMgDl: calcium, albuminGDl: albumin })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="measuredCalciumMgDl"
      label="Cálcio total medido"
      unit="mg/dL"
      :min="4"
      :max="16"
      step="0.1"
      placeholder="8.2"
      required
    />
    <AppInput
      v-model="albuminGDl"
      label="Albumina"
      unit="g/dL"
      :min="1"
      :max="6"
      step="0.1"
      placeholder="3.5"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha cálcio total e albumina.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Corrigir cálcio
    </AppButton>
  </form>
</template>
