<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { DripRateInput } from '@/logic/calculators/medicacao/gotejamento'
const emit = defineEmits<{ calculate: [input: DripRateInput] }>()

const volumeMl = ref<number | null>(null)
const duration = ref<number | null>(null)
const durationUnit = ref<'min' | 'h' | 'd'>('h')
const tubingType = ref<'macro' | 'micro'>('macro')

const TIME_OPTIONS = [
  { value: 'min', label: 'minutos' },
  { value: 'h', label: 'horas' },
  { value: 'd', label: 'dias' },
]

/** Present only to reject implausible orders before the logic layer does. */
const isValid = computed(
  () =>
    volumeMl.value !== null && volumeMl.value >= 1 && volumeMl.value <= 5000 &&
    duration.value !== null && duration.value > 0,
)

/** Unit normalisation into the `timeMins` the logic layer expects. */
function toMinutes(value: number, unit: 'min' | 'h' | 'd'): number {
  switch (unit) {
    case 'd':
      return value * 1440
    case 'h':
      return value * 60
    default:
      return value
  }
}

function handleSubmit() {
  const volume = volumeMl.value
  const time = duration.value
  if (!isValid.value || volume === null || time === null) return
  const timeMins = toMinutes(time, durationUnit.value)
  if (timeMins < 1 || timeMins > 10080) return
  emit('calculate', { volumeMl: volume, timeMins, tubingType: tubingType.value })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="volumeMl"
      label="Volume a infundir"
      unit="mL"
      :min="1"
      :max="5000"
      placeholder="500"
      required
    />

    <div>
      <AppInput
        v-model="duration"
        label="Tempo de infusão"
        :min="0"
        placeholder="8"
        required
      />
      <div class="mt-2">
        <AppSelect v-model="durationUnit" label="Unidade de tempo" :options="TIME_OPTIONS" />
      </div>
    </div>

    <AppToggle
      v-model="tubingType"
      label="Cateter"
      :options="['macro', 'micro']"
    />
    <p class="-mt-2 text-xs text-ink-faint">
      Macro = 20 gtt/mL · Micro = 60 gtt/mL
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha volume e tempo de infusão.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular gotejamento
    </AppButton>
  </form>
</template>
