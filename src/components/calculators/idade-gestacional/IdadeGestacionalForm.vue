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
const igWeeks = ref<number | null>(null)
const igDays = ref<number | null>(0)
const comparisonDumIso = ref('')

const todayIso = formatIso(today())

const isValid = computed(() => {
  if (mode.value === 'dum') return dumIso.value !== '' && referenceDateIso.value !== ''

  if (!usgDateIso.value) return false
  const weeks = igWeeks.value
  return weeks !== null && weeks >= 0 && weeks <= 41
})

function handleSubmit() {
  if (!isValid.value) return

  if (mode.value === 'usg') {
    emit('calculate', {
      usgDateIso: usgDateIso.value,
      igWeeks: igWeeks.value ?? undefined,
      igDays: igDays.value ?? undefined,
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

    <AppToggle
      v-model="mode"
      label="Datação por"
      :options="[
        { value: 'dum', label: 'DUM' },
        { value: 'usg', label: 'USG' },
      ]"
    />

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
          : 'Informe a data da USG e a idade gestacional.'
      }}
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      {{ mode === 'dum' ? 'Calcular idade gestacional' : 'Avaliar datação' }}
    </AppButton>
  </form>
</template>
