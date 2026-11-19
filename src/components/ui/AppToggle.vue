<script setup lang="ts">
import { computed } from 'vue'

/** A segment is either a bare value (shown as-is) or a value with display text. */
type ToggleOption = string | { value: string; label: string }

const props = defineProps<{
  label: string
  modelValue: string
  /** Exactly two options — a segmented control is not a multi-select. */
  options: [ToggleOption, ToggleOption]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** The bound value behind a segment, whether it is a string or an object. */
function optionValue(option: ToggleOption): string {
  return typeof option === 'string' ? option : option.value
}

/** The text painted on the segment. */
function optionLabel(option: ToggleOption): string {
  return typeof option === 'string' ? option : option.label
}

const activeIndex = computed(
  () => (optionValue(props.options[1]) === props.modelValue ? 1 : 0),
)

function pick(option: ToggleOption, index: number) {
  if (props.disabled || activeIndex.value === index) return
  emit('update:modelValue', optionValue(option))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  const next = event.key === 'ArrowRight' ? 1 : 0
  const option = props.options[next]
  if (option) {
    emit('update:modelValue', optionValue(option))
    // Keep focus on the newly active segment for continued arrow-key travel.
    const group = (event.currentTarget as HTMLElement).parentElement
    group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
  }
}
</script>

<template>
  <div class="w-full">
    <span class="mb-1.5 block text-sm font-medium text-ink-secondary">{{ label }}</span>

    <div
      role="radiogroup"
      :aria-label="label"
      :aria-disabled="disabled || undefined"
      class="grid min-h-12 w-full grid-flow-col auto-cols-fr gap-1 rounded-md bg-surface-alt p-0.5"
    >
      <button
        v-for="(option, index) in options"
        :key="optionValue(option)"
        type="button"
        role="radio"
        :aria-checked="activeIndex === index"
        :tabindex="activeIndex === index ? 0 : -1"
        :disabled="disabled"
        class="flex min-h-12 items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors duration-150"
        :class="[
          activeIndex === index
            ? 'bg-primary-600 text-white shadow-card'
            : 'bg-transparent text-ink-secondary',
          disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.98]',
        ]"
        @click="pick(option, index)"
        @keydown="onKeydown"
      >
        {{ optionLabel(option) }}
      </button>
    </div>
  </div>
</template>
