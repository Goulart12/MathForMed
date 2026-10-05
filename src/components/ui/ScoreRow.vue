<script setup lang="ts">
import { computed, useId } from 'vue'
import { PhMinus, PhPlus } from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    label: string
    description: string
    modelValue: boolean | number
    /** Points this row contributes to the composite score. */
    points: number
    /** Bounds for the numeric variant; ignored for the checkbox variant. */
    min?: number
    max?: number
    unit?: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean | number]
}>()

const uid = useId()
const isBoolean = computed(() => typeof props.modelValue === 'boolean')

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}

function stepBy(delta: number) {
  if (props.disabled || isBoolean.value) return
  const current = typeof props.modelValue === 'number' ? props.modelValue : 0
  const min = props.min ?? Number.NEGATIVE_INFINITY
  const max = props.max ?? Number.POSITIVE_INFINITY
  emit('update:modelValue', Math.min(Math.max(current + delta, min), max))
}

function onStepperKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
    event.preventDefault()
    stepBy(1)
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
    event.preventDefault()
    stepBy(-1)
  }
}
</script>

<template>
  <div
    class="flex min-h-12 items-center gap-3 rounded-md border border-line bg-white px-3 py-2 transition-colors duration-150"
    :class="disabled ? 'opacity-60' : ''"
  >
    <!-- Boolean variant: a 48px checkbox row. -->
    <label
      v-if="isBoolean"
      :for="`row-${uid}`"
      class="flex min-h-12 flex-1 cursor-pointer items-center gap-3"
      :class="disabled ? 'cursor-not-allowed' : ''"
    >
      <input
        :id="`row-${uid}`"
        type="checkbox"
        class="size-6 shrink-0 cursor-pointer accent-primary-600"
        :checked="modelValue === true"
        :disabled="disabled"
        @change="toggle"
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-ink">{{ label }}</span>
        <span class="block text-xs leading-snug text-ink-faint">{{ description }}</span>
      </span>
    </label>

    <!-- Numeric variant: a bounded stepper. -->
    <div v-else class="flex min-h-12 flex-1 items-center gap-3">
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-ink">{{ label }}</span>
        <span class="block text-xs leading-snug text-ink-faint">{{ description }}</span>
      </span>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="flex size-12 items-center justify-center rounded-md border border-line-strong text-ink-secondary transition-colors duration-100 hover:bg-surface-alt active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          aria-label="Diminuir"
          @click="stepBy(-1)"
        >
          <PhMinus :size="18" weight="bold" aria-hidden="true" />
        </button>
        <input
          type="text"
          inputmode="numeric"
          class="h-12 w-14 rounded-md border border-line-strong bg-white text-center font-mono text-lg text-ink tabular-nums focus:border-primary-600 focus:ring-2 focus:ring-primary-600/25 focus:outline-none"
          :value="modelValue"
          :disabled="disabled"
          :aria-label="label"
          @keydown="onStepperKeydown"
          @input="
            emit(
              'update:modelValue',
              Math.min(
                Math.max(Number.parseInt(($event.target as HTMLInputElement).value || '0', 10) || 0, min ?? Number.NEGATIVE_INFINITY),
                max ?? Number.POSITIVE_INFINITY,
              ),
            )
          "
        />
        <button
          type="button"
          class="flex size-12 items-center justify-center rounded-md border border-line-strong text-ink-secondary transition-colors duration-100 hover:bg-surface-alt active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          aria-label="Aumentar"
          @click="stepBy(1)"
        >
          <PhPlus :size="18" weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>

    <span
      v-if="points > 0"
      class="shrink-0 rounded-full bg-surface-alt px-2 py-1 font-mono text-xs font-bold text-ink-secondary"
      :title="`${points} ponto(s)`"
    >
      +{{ points }}
    </span>
  </div>
</template>
