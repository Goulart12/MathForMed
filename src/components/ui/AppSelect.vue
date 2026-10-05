<script setup lang="ts">
import { computed, useId } from 'vue'
import { PhCaretDown } from '@phosphor-icons/vue'

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  label: string
  modelValue: string
  options: SelectOption[]
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uid = useId()
const selectId = computed(() => `select-${uid}`)
const errorId = computed(() => `${selectId.value}-error`)
const hintId = computed(() => `${selectId.value}-hint`)

const hasValue = computed(() => props.modelValue !== '')

const selectClass = computed(() => [
  'min-h-12 w-full appearance-none rounded-md border bg-white py-2.5 pr-10 pl-3',
  'text-base transition-colors duration-150 focus:outline-none',
  hasValue.value ? 'text-ink' : 'text-ink-faint',
  props.error
    ? 'border-alert animate-shake focus:border-alert focus:ring-2 focus:ring-alert/25'
    : 'border-line-strong focus:border-primary-600 focus:ring-2 focus:ring-primary-600/25',
  props.disabled ? 'cursor-not-allowed bg-surface-alt' : '',
])
</script>

<template>
  <div class="w-full">
    <label :for="selectId" class="mb-1.5 flex items-baseline gap-1.5">
      <span class="text-sm font-medium text-ink-secondary">{{ label }}</span>
      <span v-if="required" class="text-xs text-ink-muted" aria-hidden="true">obrigatório</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        :class="selectClass"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <PhCaretDown
        :size="16"
        weight="bold"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-secondary"
        aria-hidden="true"
      />
    </div>

    <p v-if="error" :id="errorId" class="mt-1.5 text-sm font-medium text-alert-text">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-sm text-ink-faint">{{ hint }}</p>
  </div>
</template>
