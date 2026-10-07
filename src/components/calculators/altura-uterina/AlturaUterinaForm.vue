<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { AlturaUterinaInput } from '@/logic/calculators/ginecologia/alturaUterina'

const emit = defineEmits<{ calculate: [input: AlturaUterinaInput] }>()

const alturaUterinaCm = ref<number | null>(null)
const igSemanas = ref<number | null>(null)
const igDias = ref<number | null>(0)

const isValid = computed(() => {
  const au = alturaUterinaCm.value
  const weeks = igSemanas.value
  return (
    au !== null &&
    au >= 10 &&
    au <= 50 &&
    weeks !== null &&
    weeks >= 16 &&
    weeks <= 42
  )
})

function handleSubmit() {
  const au = alturaUterinaCm.value
  const weeks = igSemanas.value
  const days = igDias.value
  if (!isValid.value || au === null || weeks === null) return
  emit('calculate', { alturaUterinaCm: au, igSemanas: weeks, igDias: days ?? 0 })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader
      title="MEDIDA CLÍNICA"
      subtitle="Da sínfise púbica ao fundo uterino, com a bexiga vazia."
    />

    <AppInput
      v-model="alturaUterinaCm"
      label="Altura uterina medida"
      unit="cm"
      type="number"
      :min="10"
      :max="50"
      step="0.5"
      placeholder="28"
      required
    />

    <SectionHeader title="IDADE GESTACIONAL ATUAL" />

    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="igSemanas"
        label="Semanas"
        unit="s"
        type="number"
        :min="16"
        :max="42"
        step="1"
        placeholder="28"
      />
      <AppInput
        v-model="igDias"
        label="Dias"
        unit="d"
        type="number"
        :min="0"
        :max="6"
        step="1"
        placeholder="0"
      />
    </div>

    <p class="text-sm text-ink-secondary">
      Pela regra de McDonald, entre 20 e 36 semanas a altura uterina em centímetros deve ser igual à
      idade gestacional em semanas, com variação de até 2 cm.
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Informe a altura uterina (10–50 cm) e a idade gestacional (16–42 semanas).
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Avaliar altura uterina
    </AppButton>
  </form>
</template>