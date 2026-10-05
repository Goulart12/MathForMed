<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import ScoreRow from '@/components/ui/ScoreRow.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { QsofaInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: QsofaInput] }>()

const respiratoryRate = ref<number | null>(null)
const alteredMentation = ref(false)
const sysBp = ref<number | null>(null)

const isValid = computed(
  () =>
    respiratoryRate.value !== null &&
    respiratoryRate.value >= 4 &&
    respiratoryRate.value <= 60 &&
    sysBp.value !== null &&
    sysBp.value >= 40 &&
    sysBp.value <= 300,
)

function handleSubmit() {
  const rr = respiratoryRate.value
  const bp = sysBp.value
  if (!isValid.value || rr === null || bp === null) return
  emit('calculate', { respiratoryRate: rr, alteredMentation: alteredMentation.value, sysBp: bp })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="respiratoryRate"
      label="Frequência respiratória"
      unit="irpm"
      :min="4"
      :max="60"
      placeholder="22"
      required
    />
    <AppInput
      v-model="sysBp"
      label="Pressão sistólica"
      unit="mmHg"
      :min="40"
      :max="300"
      placeholder="100"
      required
    />
    <SectionHeader title="Alteração do estado mental" />
    <ScoreRow
      v-model="alteredMentation"
      label="Consciência alterada"
      description="Glasgow < 15 ou desorientação"
      :points="1"
    />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha frequência respiratória e pressão sistólica.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular qSOFA
    </AppButton>
  </form>
</template>
