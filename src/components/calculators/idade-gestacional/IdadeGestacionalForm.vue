<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { formatIso, today } from '@/logic/utils/dates'
import type { IdadeGestacionalInput } from '@/logic/calculators/ginecologia/idadeGestacional'

const emit = defineEmits<{ calculate: [input: IdadeGestacionalInput] }>()

const mode = ref<'dum' | 'dpp'>('dum')
const dumIso = ref('')
const dppIso = ref('')
const referenceDateIso = ref(formatIso(today()))

const todayIso = formatIso(today())

const isValid = computed(
  () =>
    (mode.value === 'dum' ? dumIso.value !== '' : dppIso.value !== '') &&
    referenceDateIso.value !== '',
)

function handleSubmit() {
  if (!isValid.value) return
  emit('calculate', {
    dumIso: mode.value === 'dum' ? dumIso.value : undefined,
    dppIso: mode.value === 'dpp' ? dppIso.value : undefined,
    referenceDateIso: referenceDateIso.value,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader title="DATAÇÃO" />

    <AppToggle v-model="mode" label="Data de referência informada" :options="['dum', 'dpp']" />

    <AppDateInput
      v-if="mode === 'dum'"
      v-model="dumIso"
      label="DUM — primeiro dia da última menstruação"
      :max="todayIso"
      required
    />
    <AppDateInput
      v-else
      v-model="dppIso"
      label="DPP — data provável do parto"
      required
    />

    <AppDateInput
      v-model="referenceDateIso"
      label="Calcular a idade gestacional em"
      hint="Padrão: hoje. Ajuste para datar a gestação em uma consulta anterior."
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Informe a {{ mode === 'dum' ? 'DUM' : 'DPP' }}.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular idade gestacional
    </AppButton>
  </form>
</template>