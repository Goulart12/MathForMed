<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { CorrecaoSodioInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: CorrecaoSodioInput] }>()

const measuredSodiumMeqL = ref<number | null>(null)
const glucoseMgDl = ref<number | null>(null)

const isValid = computed(
  () =>
    measuredSodiumMeqL.value !== null &&
    measuredSodiumMeqL.value >= 100 &&
    measuredSodiumMeqL.value <= 180 &&
    glucoseMgDl.value !== null && glucoseMgDl.value >= 0 && glucoseMgDl.value <= 1500,
)

function handleSubmit() {
  const sodium = measuredSodiumMeqL.value
  const glucose = glucoseMgDl.value
  if (!isValid.value || sodium === null || glucose === null) return
  emit('calculate', { measuredSodiumMeqL: sodium, glucoseMgDl: glucose })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="measuredSodiumMeqL"
      label="Sódio medido"
      unit="mEq/L"
      :min="100"
      :max="180"
      step="0.1"
      placeholder="132"
      required
    />
    <AppInput
      v-model="glucoseMgDl"
      label="Glicose"
      unit="mg/dL"
      :min="0"
      :max="1500"
      placeholder="240"
      required
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha sódio medido e glicose.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Corrigir sódio
    </AppButton>
  </form>
</template>
