<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppInput from '@/components/ui/AppInput.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { formatBR, formatIso, parseIsoDate, today } from '@/logic/utils/dates'
import type { DppNaegeleInput } from '@/logic/calculators/ginecologia/dppNaegele'

const emit = defineEmits<{ calculate: [input: DppNaegeleInput] }>()

const dumIso = ref('')
const cycleDays = ref<number | null>(28)

const todayIso = formatIso(today())

/** Preview of the due date, so the clinician sees it before submitting. */
const preview = computed(() => {
  const cycle = cycleDays.value
  if (!dumIso.value || cycle === null || cycle < 21 || cycle > 35) return undefined
  return formatBR(parseIsoDate(dumIso.value))
})

const isValid = computed(
  () =>
    dumIso.value !== '' && cycleDays.value !== null && cycleDays.value >= 21 && cycleDays.value <= 35,
)

function handleSubmit() {
  const cycle = cycleDays.value
  if (!isValid.value || cycle === null) return
  emit('calculate', { dumIso: dumIso.value, cycleDays: cycle })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader title="DADOS MENSTRUAIS" />

    <AppDateInput
      v-model="dumIso"
      label="DUM — primeiro dia da última menstruação"
      :max="todayIso"
      required
      :hint="preview ? `DPP estimada: ${preview}` : 'Informe a data da última menstruação.'"
    />

    <AppInput
      v-model="cycleDays"
      label="Duração média do ciclo"
      unit="dias"
      :min="21"
      :max="35"
      step="1"
      placeholder="28"
    />

    <p class="text-sm text-ink-secondary">
      A DPP é calculada como DUM + 280 dias, ajustada em 1 dia para cada dia de diferença do ciclo em
      relação a 28.
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Informe a DUM e um ciclo entre 21 e 35 dias.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular DPP
    </AppButton>
  </form>
</template>