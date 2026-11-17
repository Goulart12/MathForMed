<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { formatBR, formatIso, parseIsoDate, today } from '@/logic/utils/dates'
import type { DppNaegeleInput } from '@/logic/calculators/ginecologia/dppNaegele'

const emit = defineEmits<{ calculate: [input: DppNaegeleInput] }>()

const dumIso = ref('')

const todayIso = formatIso(today())

/** Preview of the due date, so the clinician sees it before submitting. */
const preview = computed(() =>
  dumIso.value ? formatBR(parseIsoDate(dumIso.value)) : undefined,
)

const isValid = computed(() => dumIso.value !== '')

function handleSubmit() {
  if (!isValid.value) return
  emit('calculate', { dumIso: dumIso.value })
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

    <p class="text-sm text-ink-secondary">
      A DPP é calculada como DUM + 280 dias, correspondendo a uma gestação de 40 semanas.
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">Informe a DUM.</p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular DPP
    </AppButton>
  </form>
</template>
