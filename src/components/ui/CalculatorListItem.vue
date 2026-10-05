<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { PhCaretRight, PhStar } from '@phosphor-icons/vue'
import type { CalculatorMeta } from '@/types/logic'
import { EVIDENCE_TONES } from '@/data/severity'

defineProps<{
  calculator: CalculatorMeta
  /** Shows the trailing filled star, for lists that are already favorites. */
  favorite?: boolean
}>()

const emit = defineEmits<{ toggleFavorite: [] }>()
</script>

<template>
  <div class="flex items-stretch gap-1">
    <RouterLink
      :to="{ name: 'calculator', params: { id: calculator.id } }"
      class="group flex min-h-12 flex-1 items-center gap-3 rounded-md border border-line bg-white px-3 py-2.5 transition-all duration-150 hover:border-primary-200 hover:shadow-card active:scale-[0.99]"
    >
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="truncate text-sm font-semibold text-ink">{{ calculator.name }}</span>
          <span
            v-if="calculator.evidenceLevel"
            class="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[0.625rem] font-bold"
            :class="EVIDENCE_TONES[calculator.evidenceLevel]"
            :title="`Nível de evidência ${calculator.evidenceLevel}`"
          >
            {{ calculator.evidenceLevel }}
          </span>
        </span>
        <span class="mt-0.5 block text-xs leading-snug text-ink-faint">
          {{ calculator.description }}
        </span>
      </span>

      <PhCaretRight
        :size="18"
        weight="bold"
        class="shrink-0 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </RouterLink>

    <button
      v-if="favorite"
      type="button"
      class="flex size-12 shrink-0 items-center justify-center rounded-md text-warn-text transition-colors duration-150 hover:bg-surface-alt active:scale-95"
      :aria-label="`Remover ${calculator.name} dos favoritos`"
      @click="emit('toggleFavorite')"
    >
      <PhStar :size="20" weight="fill" aria-hidden="true" />
    </button>
  </div>
</template>
