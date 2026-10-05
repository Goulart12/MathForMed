<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import ScoreRow from '@/components/ui/ScoreRow.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { FraminghamInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: FraminghamInput] }>()

const age = ref<number | null>(null)
const totalCholesterolMgDl = ref<number | null>(null)
const hdlCholesterolMgDl = ref<number | null>(null)
const sysBpMmhg = ref<number | null>(null)
const smoker = ref(false)
const diabetic = ref(false)
const bpTreated = ref(false)
const sex = ref<'M' | 'F'>('M')

const isValid = computed(
  () =>
    age.value !== null && age.value >= 1 && age.value <= 120 &&
    totalCholesterolMgDl.value !== null && totalCholesterolMgDl.value > 0 &&
    hdlCholesterolMgDl.value !== null && hdlCholesterolMgDl.value > 0 &&
    sysBpMmhg.value !== null && sysBpMmhg.value >= 50 && sysBpMmhg.value <= 300,
)

function handleSubmit() {
  const years = age.value
  const total = totalCholesterolMgDl.value
  const hdl = hdlCholesterolMgDl.value
  const bp = sysBpMmhg.value
  if (!isValid.value || years === null || total === null || hdl === null || bp === null) return
  emit('calculate', {
    age: years,
    totalCholesterolMgDl: total,
    hdlCholesterolMgDl: hdl,
    sysBpMmhg: bp,
    smoker: smoker.value,
    diabetic: diabetic.value,
    bpTreated: bpTreated.value,
    sex: sex.value,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput v-model="age" label="Idade" unit="anos" :min="1" :max="120" placeholder="55" required />
    <AppInput
      v-model="totalCholesterolMgDl"
      label="Colesterol total"
      unit="mg/dL"
      :min="1"
      placeholder="210"
      required
    />
    <AppInput
      v-model="hdlCholesterolMgDl"
      label="HDL"
      unit="mg/dL"
      :min="1"
      placeholder="45"
      required
    />
    <AppInput
      v-model="sysBpMmhg"
      label="Pressão sistólica"
      unit="mmHg"
      :min="50"
      :max="300"
      placeholder="135"
      required
    />

    <SectionHeader title="Fatores adicionais" />
    <div class="space-y-2">
      <ScoreRow
        v-model="smoker"
        label="Tabagista"
        description="Fumaça atual ou parou há menos de 1 ano"
        :points="0"
      />
      <ScoreRow
        v-model="diabetic"
        label="Diabetes"
        description="Diabetes prévio"
        :points="0"
      />
      <ScoreRow
        v-model="bpTreated"
        label="Hipertensão tratada"
        description="Em uso de anti-hipertensivo"
        :points="0"
      />
    </div>
    <p class="-mt-2 text-xs text-ink-faint">
      Estes três itens não têm peso fixo: a tabela de pontos os pondera por faixa.
    </p>

    <AppToggle v-model="sex" label="Sexo" :options="['M', 'F']" />

    <p v-if="!isValid" class="text-center text-sm text-ink-faint">
      Preencha idade, colesterol, HDL e pressão arterial.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular risco
    </AppButton>
  </form>
</template>
