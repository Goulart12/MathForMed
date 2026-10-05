<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import ScoreRow from '@/components/ui/ScoreRow.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { ChadsVascInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: ChadsVascInput] }>()

const age = ref<number | null>(null)
const chf = ref(false)
const hypertension = ref(false)
const stroke = ref(false)
const vascularDisease = ref(false)
const diabetes = ref(false)
const sex = ref<'M' | 'F'>('M')

const isValid = computed(() => age.value !== null && age.value >= 1 && age.value <= 120)

function handleSubmit() {
  const years = age.value
  if (!isValid.value || years === null) return
  emit('calculate', {
    age: years,
    chf: chf.value,
    hypertension: hypertension.value,
    stroke: stroke.value,
    vascularDisease: vascularDisease.value,
    diabetes: diabetes.value,
    sex: sex.value,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <p class="text-sm text-ink-secondary">
      Itens marcados com <span class="font-mono font-bold">+2</span> valem o dobro. A faixa
      etária e o sexo são lidos pela pontuação final.
    </p>

    <AppInput v-model="age" label="Idade" unit="anos" :min="1" :max="120" placeholder="72" required />

    <div class="space-y-2">
      <ScoreRow
        v-model="chf"
        label="Insuficiência cardíaca congestiva"
        description="Diagnóstico clínico de ICC"
        :points="1"
      />
      <ScoreRow
        v-model="hypertension"
        label="Hipertensão arterial"
        description="Em tratamento ou com PA elevada"
        :points="1"
      />
      <ScoreRow
        v-model="stroke"
        label="AVC / AIT / tromboembolia"
        description="Episódio prévio"
        :points="2"
      />
      <ScoreRow
        v-model="vascularDisease"
        label="Doença vascular"
        description="Infarto prévio ou doença arterial periférica"
        :points="1"
      />
      <ScoreRow
        v-model="diabetes"
        label="Diabetes mellitus"
        description="Qualquer forma"
        :points="1"
      />
    </div>

    <SectionHeader title="Fatores não pontuáveis por caixa" />
    <AppToggle v-model="sex" label="Sexo" :options="['M', 'F']" />
    <p class="-mt-2 text-xs text-ink-faint">
      Sexo feminino acrescenta 1 ponto. Sozinho, não indica anticoagulação.
    </p>

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">Informe a idade.</p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular CHA₂DS₂-VASc
    </AppButton>
  </form>
</template>
