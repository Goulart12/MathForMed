<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

type FieldType = 'text' | 'number'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: number | string | null
    /** Rendered right-aligned inside the field, e.g. `kg`, `mg/dL`, `mEq/L`. */
    unit?: string
    type?: FieldType
    min?: number
    max?: number
    placeholder?: string
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    step?: string
  }>(),
  {
    type: 'number',
    required: false,
    disabled: false,
    step: 'any',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
  blur: []
}>()

const uid = useId()
const inputId = computed(() => `field-${uid}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)

const numeric = computed(() => props.type === 'number')

/**
 * The field is a text input with `inputmode="decimal"` rather than
 * `type="number"`: a pt-BR clinician types `1,75`, which `type="number"`
 * silently discards along with its spinners and scroll-wheel side effects.
 * `raw` keeps whatever they typed while `modelValue` carries the parsed number.
 */
const raw = ref<string>(formatValue(props.modelValue))

watch(
  () => props.modelValue,
  (next) => {
    // Only reformat when the parent genuinely disagrees, so a half-typed
    // `1,` is not rewritten to `1` under the user's cursor.
    if (parseNumeric(raw.value) !== next) raw.value = formatValue(next)
  },
)

function formatValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function parseNumeric(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function onInput(event: Event) {
  const next = (event.target as HTMLInputElement).value
  raw.value = next
  emit('update:modelValue', numeric.value ? parseNumeric(next) : next)
}

const fieldClass = computed(() => [
  'w-full rounded-md border bg-white text-base text-ink transition-colors duration-150',
  'placeholder:text-ink-faint',
  'focus:outline-none focus-visible:outline-none',
  // min-h-12 = 48px target; the unit suffix and validation message ride inside.
  'min-h-12 py-2.5',
  props.unit ? 'pr-16' : 'pr-3',
  'pl-3',
  props.error
    ? 'border-alert animate-shake focus:border-alert focus:ring-2 focus:ring-alert/25'
    : 'border-line-strong focus:border-primary-600 focus:ring-2 focus:ring-primary-600/25',
  props.disabled ? 'cursor-not-allowed bg-surface-alt text-ink-muted' : '',
])
</script>

<template>
  <div class="w-full">
    <label :for="inputId" class="mb-1.5 flex items-baseline gap-1.5">
      <span class="text-sm font-medium text-ink-secondary">{{ label }}</span>
      <span v-if="required" class="text-xs text-ink-muted" aria-hidden="true">obrigatório</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        :value="raw"
        type="text"
        :inputmode="numeric ? 'decimal' : 'text'"
        :step="numeric ? step : undefined"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        :class="fieldClass"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @input="onInput"
        @blur="emit('blur')"
      />
      <span
        v-if="unit"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-sm text-ink-secondary"
      >
        {{ unit }}
      </span>
    </div>

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm font-medium text-alert-text">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-sm text-ink-faint">{{ hint }}</p>
  </div>
</template>
