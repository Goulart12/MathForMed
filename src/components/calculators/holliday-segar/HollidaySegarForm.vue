<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { HollidaySegarInput } from '@/logic/calculators/nutricao/hollidaySegar'
const emit = defineEmits<{ calculate: [input: HollidaySegarInput] }>()

const weightKg = ref<number | null>(null)

const isValid = computed(
  () => weightKg.value !== null && weightKg.value >= 0.5 && weightKg.value <= 100,
)

function handleSubmit() {
  const weight = weightKg.value
  if (!isValid.value || weight === null) return
  emit('calculate', { weightKg: weight })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="weightKg"
      label="Peso"
      unit="kg"
      :min="0.5"
      :max="100"
      step="0.1"
      placeholder="15"
      required
    />

    <p class="text-sm text-ink-secondary">
      Regra 4-2-1: 4 mL/kg/h até 10 kg, 2 mL/kg/h de 10 a 20 kg e 1 mL/kg/h acima de 20 kg.
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">Informe o peso.</p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular manutenção hídrica
    </AppButton>
  </form>
</template>
