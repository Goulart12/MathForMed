<script setup lang="ts">
import { computed } from 'vue'
import { PhCircleNotch } from '@phosphor-icons/vue'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    loading?: boolean
    disabled?: boolean
    fullWidth?: boolean
    type?: 'button' | 'submit' | 'reset'
    /** Announced while `loading` — keeps the button from reading as inert. */
    loadingLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
    type: 'button',
    loadingLabel: 'Calculando',
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

/** `loading` implies `disabled` so a slow tap cannot double-submit. */
const inert = computed(() => props.disabled || props.loading)

/**
 * Every size clears the 48 px touch-target floor; `size` only moves the
 * horizontal padding and the type size. `sm`/`md` are `min-h-12` (48 px) and
 * `lg` is 52 px.
 */
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'min-h-12 px-4 text-sm'
    case 'lg':
      return 'min-h-13 px-6 text-base font-semibold'
    default:
      return 'min-h-12 px-5 text-base'
  }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return [
        'border border-line-strong bg-white text-ink',
        'hover:bg-surface-alt active:bg-surface-alt',
      ]
    case 'ghost':
      return 'bg-transparent text-primary-600 hover:bg-primary-50'
    default:
      return [
        'bg-primary-600 text-white hover:bg-primary-700',
        // The FAB treatment is reserved for the full-width primary CTA — the
        // one control a physician reaches for under time pressure.
        props.fullWidth ? 'shadow-fab' : '',
      ]
  }
})

function onClick(event: MouseEvent) {
  if (inert.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :disabled="inert"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-100 active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100"
    :class="[
      sizeClass,
      variantClass,
      fullWidth ? 'w-full' : '',
      inert ? 'opacity-55' : '',
    ]"
    @click="onClick"
  >
    <PhCircleNotch v-if="loading" :size="20" weight="bold" class="animate-spin" aria-hidden="true" />
    <slot />
    <span v-if="loading" class="sr-only">{{ loadingLabel }}</span>
  </button>
</template>
