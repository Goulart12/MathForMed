<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { OsmolalityInput } from '@/logic/calculators/laboratorial/osmolalidade'
const emit = defineEmits<{ calculate: [input: OsmolalityInput] }>()

const sodium = ref<number | null>(null)
const glucoseMgDl = ref<number | null>(null)
const bunMgDl = ref<number | null>(null)
/** Optional: enables the osmolal gap, which flags toxic alcohols. */
const measuredOsmolality = ref<number | null>(null)

const requiredFilled = computed(
  () =>
    sodium.value !== null && sodium.value >= 100 && sodium.value <= 180 &&
    glucoseMgDl.value !== null && glucoseMgDl.value >= 0 && glucoseMgDl.value <= 1000 &&
    bunMgDl.value !== null && bunMgDl.value >= 0 && bunMgDl.value <= 200,
)

const measuredValid = computed(
  () =>
    measuredOsmolality.value === null ||
    (measuredOsmolality.value >= 200 && measuredOsmolality.value <= 500),
)

const measuredError = computed(() =>
  measuredOsmolality.value !== null && !measuredValid.value
    ? 'Informe 200 a 500 mOsm/kg.'
    : undefined,
)

const isValid = computed(() => requiredFilled.value && measuredValid.value)

function handleSubmit() {
  const na = sodium.value
  const glucose = glucoseMgDl.value
  const bun = bunMgDl.value
  if (!isValid.value || na === null || glucose === null || bun === null) return
  emit('calculate', {
    sodium: na,
    glucoseMgDl: glucose,
    bunMgDl: bun,
    ...(measuredOsmolality.value === null ? {} : { measuredOsmolality: measuredOsmolality.value }),
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="sodium"
      label="Sódio"
      unit="mEq/L"
      :min="100"
      :max="180"
      step="0.1"
      placeholder="140"
      required
    />
    <AppInput
      v-model="glucoseMgDl"
      label="Glicose"
      unit="mg/dL"
      :min="0"
      :max="1000"
      placeholder="100"
      required
    />
    <AppInput
      v-model="bunMgDl"
      label="Ureia (BUN)"
      unit="mg/dL"
      :min="0"
      :max="200"
      placeholder="20"
      required
    />
    <AppInput
      v-model="measuredOsmolality"
      label="Osmolalidade medida (opcional)"
      unit="mOsm/kg"
      :min="200"
      :max="500"
      placeholder="285"
      :error="measuredError"
      hint="Permite calcular o gap osmolar."
    />

    <p v-if="!isValid && !measuredError" class="text-center text-sm text-ink-faint">
      Preencha sódio, glicose e ureia.
    </p>

    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calcular osmolalidade
    </AppButton>
  </form>
</template>
