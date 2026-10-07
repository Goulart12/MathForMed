<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { formatIso, today } from '@/logic/utils/dates'
// Type-only: the calculation function is reached through the registry seam, so
// this form cannot import it as a value.
import type { IgUsgInput } from '@/logic/calculators/ginecologia/igUsg'

const emit = defineEmits<{ calculate: [input: IgUsgInput] }>()

const usgDateIso = ref('')
const mode = ref<'ig' | 'crl'>('ig')
const igWeeks = ref<number | null>(null)
const igDays = ref<number | null>(0)
const crlMm = ref<number | null>(null)
const dumIso = ref('')

const todayIso = formatIso(today())

const isValid = computed(() => {
  if (!usgDateIso.value) return false
  if (mode.value === 'ig') {
    const weeks = igWeeks.value
    return weeks !== null && weeks >= 0 && weeks <= 41
  }
  const crl = crlMm.value
  return crl !== null && crl >= 2 && crl <= 90
})

function handleSubmit() {
  if (!isValid.value) return
  const crl = crlMm.value
  const weeks = igWeeks.value
  const days = igDays.value
  emit('calculate', {
    usgDateIso: usgDateIso.value,
    igWeeks: mode.value === 'ig' && weeks !== null ? weeks : undefined,
    igDays: mode.value === 'ig' && days !== null ? days : undefined,
    crlMm: mode.value === 'crl' && crl !== null ? crl : undefined,
    dumIso: dumIso.value || undefined,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader title="DADOS DA ULTRASSONOGRAFIA" />

    <AppDateInput
      v-model="usgDateIso"
      label="Data da ultrassonografia"
      :max="todayIso"
      required
    />

    <AppToggle v-model="mode" label="Informar a idade gestacional como" :options="['ig', 'ccn']" />

    <template v-if="mode === 'ig'">
      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="igWeeks"
          label="Semanas"
          unit="s"
          type="number"
          :min="0"
          :max="41"
          step="1"
          placeholder="12"
        />
        <AppInput
          v-model="igDays"
          label="Dias"
          unit="d"
          type="number"
          :min="0"
          :max="6"
          step="1"
          placeholder="0"
        />
      </div>
    </template>

    <AppInput
      v-else
      v-model="crlMm"
      label="Comprimento crânio-caudal (CCN)"
      unit="mm"
      type="number"
      :min="2"
      :max="90"
      step="0.1"
      placeholder="48"
      hint="Válido de 2 a 90 mm, no 1º trimestre. A idade é calculada pela equação de Hadlock (1982)."
    />

    <SectionHeader
      title="COMPARAÇÃO COM A DUM"
      subtitle="Opcional. Preencha para a ferramenta avaliar se a gestação deve ser reeditada."
    />

    <AppDateInput
      v-model="dumIso"
      label="DUM — para comparação com a USG"
      :max="todayIso"
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Informe a data da USG e {{ mode === 'ig' ? 'a idade gestacional' : 'o CCN' }}.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Avaliar datação
    </AppButton>
  </form>
</template>