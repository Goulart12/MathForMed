<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { SuperficieCorporalInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: SuperficieCorporalInput] }>()

const weightKg = ref<number | null>(null)
const heightCm = ref<number | null>(null)
const formula = ref<'mosteller' | 'dubois'>('mosteller')

const isValid = computed(
  () =>
    weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 300 &&
    heightCm.value !== null && heightCm.value >= 30 && heightCm.value <= 250,
)

function handleSubmit() {
  const weight = weightKg.value
  const height = heightCm.value
  if (!isValid.value || weight === null || height === null) return
  emit('calculate', { weightKg: weight, heightM: height / 100, formula: formula.value })
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
    <AppToggle
      v-model="formula"
      label="Fórmula"
      :options="['mosteller', 'dubois']"
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha peso e altura para calcular.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular superfície corporal
    </AppButton>
  </form>
</template>
