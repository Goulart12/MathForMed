<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { ShockIndexInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: ShockIndexInput] }>()

const heartRate = ref<number | null>(null)
const sysBp = ref<number | null>(null)

const isValid = computed(
  () =>
    heartRate.value !== null && heartRate.value >= 20 && heartRate.value <= 250 &&
    // The index divides by systolic pressure, so a non-positive value would be
    // meaningless rather than merely out of range.
    sysBp.value !== null && sysBp.value >= 30 && sysBp.value <= 300,
)

function handleSubmit() {
  const hr = heartRate.value
  const bp = sysBp.value
  if (!isValid.value || hr === null || bp === null) return
  emit('calculate', { heartRate: hr, sysBp: bp })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="heartRate"
      label="Frequência cardíaca"
      unit="bpm"
      :min="20"
      :max="250"
      placeholder="110"
      required
    />
    <AppInput
      v-model="sysBp"
      label="Pressão sistólica"
      unit="mmHg"
      :min="30"
      :max="300"
      placeholder="90"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha frequência cardíaca e pressão sistólica.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular índice de choque
    </AppButton>
  </form>
</template>
