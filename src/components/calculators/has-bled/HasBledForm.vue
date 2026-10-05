<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import ScoreRow from '@/components/ui/ScoreRow.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { HasBledInput } from '@/types/calculator-inputs'

const emit = defineEmits<{ calculate: [input: HasBledInput] }>()

const hypertensionUncontrolled = ref(false)
const renalDisease = ref(false)
const liverDisease = ref(false)
const strokeHistory = ref(false)
const bleedingHistory = ref(false)
const labileInr = ref(false)
const elderly = ref(false)
const drugsAntiplatelet = ref(false)
const alcoholUse = ref(false)

/** Every row is optional, so the form is always submittable. */
function handleSubmit() {
  emit('calculate', {
    hypertensionUncontrolled: hypertensionUncontrolled.value,
    renalDisease: renalDisease.value,
    liverDisease: liverDisease.value,
    strokeHistory: strokeHistory.value,
    bleedingHistory: bleedingHistory.value,
    labileInr: labileInr.value,
    elderly: elderly.value,
    drugsAntiplatelet: drugsAntiplatelet.value,
    alcoholUse: alcoholUse.value,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <SectionHeader
      title="Fatores de risco"
      subtitle="Marque apenas o que estiver presente. Escore máximo 9."
    />

    <div class="space-y-2">
      <ScoreRow
        v-model="hypertensionUncontrolled"
        label="Hipertensão não controlada"
        description="PAS > 160 mmHg"
        :points="1"
      />
      <ScoreRow
        v-model="renalDisease"
        label="Doença renal"
        description="Diálise ou creatinina > 2,26 mg/dL"
        :points="1"
      />
      <ScoreRow
        v-model="liverDisease"
        label="Doença hepática"
        description="Cirrose, bilirrubina > 2× ou ALT > 3×"
        :points="1"
      />
      <ScoreRow
        v-model="strokeHistory"
        label="AVC prévio"
        description="Episódio isquêmico ou hemorrágico"
        :points="1"
      />
      <ScoreRow
        v-model="bleedingHistory"
        label="Sangramento prévio"
        description="Sangramento ou predisposição"
        :points="1"
      />
      <ScoreRow
        v-model="labileInr"
        label="INR instável"
        description="Tempo em faixa terapêutica < 60%"
        :points="1"
      />
      <ScoreRow
        v-model="elderly"
        label="Idade > 65 anos"
        description="Marcado pelo avaliador"
        :points="1"
      />
      <ScoreRow
        v-model="drugsAntiplatelet"
        label="Antiagregante ou AINE"
        description="Uso concomitante"
        :points="1"
      />
      <ScoreRow
        v-model="alcoholUse"
        label="Uso de álcool"
        description="8 ou mais Drinks por semana"
        :points="1"
      />
    </div>

    <AppButton type="submit" variant="primary" fullWidth>
      Calcular HAS-BLED
    </AppButton>
  </form>
</template>
