<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

/**
 * Calendar-date field.
 *
 * A separate component rather than a `type` on `AppInput`, which deliberately
 * models only free numeric and short text entry. A date is a different control:
 * the value has to survive as an ISO string through `v-model`, and the native
 * picker plus its calendar affordance are worth keeping rather than re-implementing.
 */
const props = withDefaults(
  defineProps<{
    label: string
    /** ISO 8601 `YYYY-MM-DD`, or an empty string. */
    modelValue: string
    /** Latest selectable day, as `YYYY-MM-DD`. */
    max?: string
    /** Earliest selectable day, as `YYYY-MM-DD`. */
    min?: string
    hint?: string
    error?: string
    required?: boolean
    disabled?: boolean
  }>(),
  { required: false, disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uid = useId()
const inputId = computed(() => `field-${uid}`)
const hintId = computed(() => `${inputId.value}-hint`)

const fieldClass = computed(() => [
  'w-full rounded-md border bg-white text-base text-ink transition-colors duration-150',
  'focus:outline-none focus-visible:outline-none',
  // min-h-12 = 48px target, matching AppInput.
  'min-h-12 py-2.5 pr-3 pl-3',
  // The native indicator is the primary affordance, so it must not be clipped.
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
  props.error
    ? 'border-alert focus:border-alert focus:ring-2 focus:ring-alert/25'
    : 'border-line-strong focus:border-primary-600 focus:ring-2 focus:ring-primary-600/25',
  props.disabled ? 'cursor-not-allowed bg-surface-alt text-ink-muted' : '',
])

const raw = ref(props.modelValue)

watch(
  () => props.modelValue,
  (next) => {
    if (raw.value !== next) raw.value = next
  },
)

function onInput(event: Event) {
  const next = (event.target as HTMLInputElement).value
  raw.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="w-full">
    <label :for="inputId" class="mb-1.5 flex items-baseline gap-1.5">
      <span class="text-sm font-medium text-ink-secondary">{{ label }}</span>
      <span v-if="required" class="text-xs text-ink-muted" aria-hidden="true">obrigatório</span>
    </label>

    <input
      :id="inputId"
      :value="raw"
      type="date"
      :min="min"
      :max="max"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? undefined : hint ? hintId : undefined"
      :class="fieldClass"
      @input="onInput"
    />

    <p v-if="error" class="mt-1.5 text-sm font-medium text-alert-text">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-sm text-ink-faint">{{ hint }}</p>
  </div>
</template>