<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { AnionGapInput } from '@/logic/calculators/laboratorial/anionGap'
const emit = defineEmits<{ calculate: [input: AnionGapInput] }>()

const sodium = ref<number | null>(null)
const chloride = ref<number | null>(null)
const bicarbonate = ref<number | null>(null)
/** Optional: enables the albumin correction and the delta ratio. */
const albumin = ref<number | null>(null)

const electrolytesFilled = computed(
  () =>
    sodium.value !== null && sodium.value >= 80 && sodium.value <= 180 &&
    chloride.value !== null && chloride.value >= 50 && chloride.value <= 140 &&
    bicarbonate.value !== null && bicarbonate.value >= 2 && bicarbonate.value <= 50,
)

/** A supplied albumin outside the measurable range is worse than no albumin. */
const albuminValid = computed(
  () => albumin.value === null || (albumin.value >= 1 && albumin.value <= 6),
)

const albuminError = computed(() =>
  albumin.value !== null && !albuminValid.value ? 'Informe 1 a 6 g/dL.' : undefined,
)

const isValid = computed(() => electrolytesFilled.value && albuminValid.value)

function handleSubmit() {
  const na = sodium.value
  const cl = chloride.value
  const hco3 = bicarbonate.value
  if (!isValid.value || na === null || cl === null || hco3 === null) return
  emit('calculate', {
    sodium: na,
    chloride: cl,
    bicarbonate: hco3,
    ...(albumin.value === null ? {} : { albumin: albumin.value }),
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="sodium"
      label="Sódio"
      unit="mEq/L"
      :min="80"
      :max="180"
      step="0.1"
      placeholder="140"
      required
    />
    <AppInput
      v-model="chloride"
      label="Cloro"
      unit="mEq/L"
      :min="50"
      :max="140"
      step="0.1"
      placeholder="102"
      required
    />
    <AppInput
      v-model="bicarbonate"
      label="Bicarbonato"
      unit="mEq/L"
      :min="2"
      :max="50"
      step="0.1"
      placeholder="24"
      required
    />
    <AppInput
      v-model="albumin"
      label="Albumina (opcional)"
      unit="g/dL"
      :min="1"
      :max="6"
      step="0.1"
      placeholder="4.0"
      :error="albuminError"
      hint="Permite corrigir o anion gap para a albumina."
    />

    <p v-if="!isValid && !albuminError" class="text-center text-sm text-ink-faint">
      Preencha sódio, cloro e bicarbonato.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular anion gap
    </AppButton>
  </form>
</template>
