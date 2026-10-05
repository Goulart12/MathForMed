<script setup lang="ts">
import { PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    /** Focuses the field on mount — used by the full-screen search route. */
    autofocus?: boolean
    /**
     * Makes the field inert to pointer and keyboard input so a wrapping link
     * receives the tap. Used on Home, where tapping opens the search route
     * rather than typing in place.
     */
    readonly?: boolean
  }>(),
  { placeholder: 'Buscar calculadora…', autofocus: false, readonly: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  /** Escape means "get me out of here" on the search route. */
  escape: []
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('escape')
}
</script>

<template>
  <div class="relative">
    <label class="sr-only" for="search-bar">{{ placeholder }}</label>
    <PhMagnifyingGlass
      :size="20"
      class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-secondary"
      aria-hidden="true"
    />
    <input
      id="search-bar"
      type="search"
      role="searchbox"
      :value="modelValue"
      :placeholder="placeholder"
      :autofocus="autofocus"
      :readonly="readonly"
      :tabindex="readonly ? -1 : undefined"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      class="min-h-12 w-full rounded-full border border-line bg-surface-alt py-2.5 pr-12 pl-11 text-base text-ink transition-colors duration-150 placeholder:text-ink-faint focus:border-primary-600 focus:bg-white focus:ring-2 focus:ring-primary-600/25 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      :class="readonly ? 'pointer-events-none' : ''"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onKeydown"
    />
    <button
      v-if="modelValue && !readonly"
      type="button"
      class="absolute top-1/2 right-0 flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-line/60 active:scale-95"
      aria-label="Limpar busca"
      @click="emit('update:modelValue', '')"
    >
      <PhX :size="16" weight="bold" aria-hidden="true" />
    </button>
  </div>
</template>
