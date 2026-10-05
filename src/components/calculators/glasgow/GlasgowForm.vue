<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { GlasgowInput } from '@/logic/calculators/emergencia/glasgow'
const emit = defineEmits<{ calculate: [input: GlasgowInput] }>()

const eyes = ref<string>('4')
const verbal = ref<string>('5')
const motor = ref<string>('6')

const EYES_OPTIONS = [
  { value: '4', label: '4 — Espontâneo' },
  { value: '3', label: '3 — À voz' },
  { value: '2', label: '2 — À dor' },
  { value: '1', label: '1 — Nenhuma resposta' },
]

const VERBAL_OPTIONS = [
  { value: '5', label: '5 — Orientado' },
  { value: '4', label: '4 — Confuso' },
  { value: '3', label: '3 — Palavras inapropriadas' },
  { value: '2', label: '2 — Sons incompreensíveis' },
  { value: '1', label: '1 — Nenhuma resposta' },
]

const MOTOR_OPTIONS = [
  { value: '6', label: '6 — Obedece comandos' },
  { value: '5', label: '5 — Localiza a dor' },
  { value: '4', label: '4 — Retirada da dor' },
  { value: '3', label: '3 — Flexão anormal' },
  { value: '2', label: '2 — Extensão anormal' },
  { value: '1', label: '1 — Nenhuma resposta' },
]

/** Coerce the select's string value back to the union the logic layer wants. */
const isValid = computed(
  () =>
    [eyes.value, verbal.value, motor.value].every((v) => v !== '') && isFinite(Number(eyes.value)),
)

function handleSubmit() {
  if (!isValid.value) return
  emit('calculate', {
    eyes: Number(eyes.value) as GlasgowInput['eyes'],
    verbal: Number(verbal.value) as GlasgowInput['verbal'],
    motor: Number(motor.value) as GlasgowInput['motor'],
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <p class="text-sm text-ink-secondary">
      Avalie a melhor resposta obtida em cada eixo. A pontuação isolada de um
      componente pode ser tão informativa quanto o total.
    </p>

    <AppSelect v-model="eyes" label="Abertura ocular" :options="EYES_OPTIONS" />
    <AppSelect v-model="verbal" label="Resposta verbal" :options="VERBAL_OPTIONS" />
    <AppSelect v-model="motor" label="Resposta motora" :options="MOTOR_OPTIONS" />

    <SectionHeader title="Total" subtitle="Soma dos três componentes, 3 a 15." />

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular Glasgow
    </AppButton>
  </form>
</template>
