<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { formatIso, today } from '@/logic/utils/dates'
import type { IdadeGestacionalInput } from '@/logic/calculators/ginecologia/idadeGestacional'

const emit = defineEmits<{ calculate: [input: IdadeGestacionalInput] }>()

const mode = ref<'dum' | 'usg'>('dum')

const dumIso = ref('')
const referenceDateIso = ref(formatIso(today()))

const usgDateIso = ref('')
const igMode = ref<'ig' | 'ccn'>('ig')
const igWeeks = ref<number | null>(null)
const igDays = ref<number | null>(0)
const crlMm = ref<number | null>(null)
const comparisonDumIso = ref('')

const todayIso = formatIso(today())

const isValid = computed(() => {
  if (mode.value === 'dum') return dumIso.value !== '' && referenceDateIso.value !== ''

  if (!usgDateIso.value) return false
  if (igMode.value === 'ig') {
    const weeks = igWeeks.value
    return weeks !== null && weeks >= 0 && weeks <= 41
  }
  const crl = crlMm.value
  return crl !== null && crl >= 2 && crl <= 90
})

function handleSubmit() {
  if (!isValid.value) return

  if (mode.value === 'usg') {
    const crl = crlMm.value
    const weeks = igWeeks.value
    const days = igDays.value
    emit('calculate', {
      usgDateIso: usgDateIso.value,
      igWeeks: igMode.value === 'ig' && weeks !== null ? weeks : undefined,
      igDays: igMode.value === 'ig' && days !== null ? days : undefined,
      crlMm: igMode.value === 'ccn' && crl !== null ? crl : undefined,
      dumIso: comparisonDumIso.value || undefined,
    })
    return
  }

  emit('calculate', { dumIso: dumIso.value, referenceDateIso: referenceDateIso.value })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader title="DATAÇÃO" />

    <AppToggle v-model="mode" label="Datação por" :options="['dum', 'usg']" />

    <template v-if="mode === 'dum'">
      <AppDateInput
        v-model="dumIso"
        label="DUM — primeiro dia da última menstruação"
        :max="todayIso"
        required
      />

      <AppDateInput
        v-model="referenceDateIso"
        label="Calcular a idade gestacional em"
        hint="Padrão: hoje. Ajuste para datar a gestação em uma consulta anterior."
      />
    </template>

    <template v-else>
      <AppDateInput
        v-model="usgDateIso"
        label="Data da ultrassonografia"
        :max="todayIso"
        required
      />

      <AppToggle
        v-model="igMode"
        label="Informar a idade gestacional como"
        :options="['ig', 'ccn']"
      />

      <div v-if="igMode === 'ig'" class="grid grid-cols-2 gap-3">
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
        v-model="comparisonDumIso"
        label="DUM — para comparação com a USG"
        :max="todayIso"
      />
    </template>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      {{
        mode === 'dum'
          ? 'Informe a DUM.'
          : `Informe a data da USG e ${igMode === 'ig' ? 'a idade gestacional' : 'o CCN'}.`
      }}
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      {{ mode === 'dum' ? 'Calcular idade gestacional' : 'Avaliar datação' }}
    </AppButton>
  </form>
</template>
