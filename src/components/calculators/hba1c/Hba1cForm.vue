<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { Hba1cInput } from '@/logic/calculators/laboratorial/hba1c'
const emit = defineEmits<{ calculate: [input: Hba1cInput] }>()

const hba1cPercent = ref<number | null>(null)

const isValid = computed(
  () => hba1cPercent.value !== null && hba1cPercent.value >= 3 && hba1cPercent.value <= 20,
)

function handleSubmit() {
  const value = hba1cPercent.value
  if (!isValid.value || value === null) return
  emit('calculate', { hba1cPercent: value })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="hba1cPercent"
      label="HbA1c"
      unit="%"
      :min="3"
      :max="20"
      step="0.1"
      placeholder="6.5"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">Informe a HbA1c.</p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular
    </AppButton>
  </form>
</template>
