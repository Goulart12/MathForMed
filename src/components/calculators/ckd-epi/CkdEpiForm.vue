<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { CkdEpiInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: CkdEpiInput] }>()

const age = ref<number | null>(null)
const serumCreatinineMgDl = ref<number | null>(null)
const sex = ref<'M' | 'F'>('M')

const isValid = computed(
  () =>
    age.value !== null && age.value >= 1 && age.value <= 120 &&
    serumCreatinineMgDl.value !== null &&
    serumCreatinineMgDl.value >= 0.1 &&
    serumCreatinineMgDl.value <= 50,
)

function handleSubmit() {
  const years = age.value
  const creatinine = serumCreatinineMgDl.value
  if (!isValid.value || years === null || creatinine === null) return
  emit('calculate', { age: years, serumCreatinineMgDl: creatinine, sex: sex.value })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput v-model="age" label="Idade" unit="anos" :min="1" :max="120" placeholder="65" required />
    <AppInput
      v-model="serumCreatinineMgDl"
      label="Creatinina sérica"
      unit="mg/dL"
      :min="0.1"
      :max="50"
      step="0.01"
      placeholder="1.1"
      required
    />
    <AppToggle v-model="sex" label="Sexo" :options="['M', 'F']" />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha idade e creatinina.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular TFG
    </AppButton>
  </form>
</template>
