<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: string
  /** Exactly two options — a segmented control is not a multi-select. */
  options: [string, string]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeIndex = computed(() => (props.modelValue === props.options[1] ? 1 : 0))

function pick(option: string, index: number) {
  if (props.disabled || activeIndex.value === index) return
  emit('update:modelValue', option)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  const next = event.key === 'ArrowRight' ? 1 : 0
  const option = props.options[next]
  if (option) {
    emit('update:modelValue', option)
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
        :key="option"
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
        {{ option }}
      </button>
    </div>
  </div>
</template>
