<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { PhCaretDown } from '@phosphor-icons/vue'
import SeverityBadge from './SeverityBadge.vue'
import { severityTone } from '@/data/severity'
import type { CalcResult } from '@/logic/types'

const props = defineProps<{
  result: CalcResult
}>()

const referencesOpen = ref(false)
const refsId = useId()

const tone = computed(() => severityTone(props.result.severity))

/** The hero is the only place `value` is shown — units never travel with it. */
const heroValue = computed(() =>
  typeof props.result.value === 'number'
    ? Number.isInteger(props.result.value)
      ? String(props.result.value)
      : props.result.value.toFixed(2).replace(/\.?0+$/, '')
    : props.result.value,
)

const subResults = computed(() => props.result.subResults ?? [])
const references = computed(() => props.result.references ?? [])

function formatRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${min} – ${max}`
  if (min !== undefined) return `≥ ${min}`
  if (max !== undefined) return `≤ ${max}`
  return '—'
}
</script>

<template>
  <section
    class="animate-result-in overflow-hidden rounded-lg border border-line bg-white shadow-card"
    :class="`border-l-4 ${tone.edge}`"
    aria-live="polite"
  >
    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-medium text-ink-secondary">{{ result.label }}</h3>
          <p class="mt-1 flex items-baseline gap-2">
            <span class="font-mono text-4xl leading-none font-bold text-ink tabular-nums">
              {{ heroValue }}
            </span>
            <span v-if="result.unit" class="text-sm text-ink-secondary">{{ result.unit }}</span>
          </p>
        </div>
        <SeverityBadge :severity="result.severity" />
      </div>

      <p class="mt-3 text-sm leading-relaxed text-ink-secondary">{{ result.interpretation }}</p>

      <!-- Sub-results: Glasgow components, SOFA organ systems, secondary doses. -->
      <ul v-if="subResults.length" class="mt-4 space-y-3 border-l-2 border-line pl-3">
        <li v-for="(sub, index) in subResults" :key="index">
          <div class="flex items-baseline gap-2">
            <span class="flex-1 text-sm font-medium text-ink-secondary">{{ sub.label }}</span>
            <span class="flex items-baseline gap-1.5">
              <span class="font-mono text-base font-semibold text-ink tabular-nums">
                {{ sub.value }}
              </span>
              <span v-if="sub.unit" class="text-xs text-ink-secondary">{{ sub.unit }}</span>
              <SeverityBadge :severity="sub.severity" compact />
            </span>
          </div>
          <p v-if="sub.interpretation" class="mt-0.5 text-xs leading-relaxed text-ink-faint">
            {{ sub.interpretation }}
          </p>
        </li>
      </ul>
    </div>

    <!-- Reference ranges -->
    <div v-if="references.length" class="border-t border-line">
      <button
        type="button"
        class="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium text-ink-secondary transition-colors duration-150 hover:bg-surface-alt"
        :aria-expanded="referencesOpen"
        :aria-controls="refsId"
        @click="referencesOpen = !referencesOpen"
      >
        <span>Valores de referência</span>
        <PhCaretDown
          :size="16"
          weight="bold"
          class="transition-transform duration-150"
          :class="referencesOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
      <div v-show="referencesOpen" :id="refsId" class="border-t border-line px-4 py-3">
        <ul class="space-y-2">
          <li
            v-for="(range, index) in references"
            :key="index"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="flex items-center gap-2 text-ink-secondary">
              <span class="size-2 rounded-full" :class="severityTone(range.severity).dot" />
              {{ range.label }}
            </span>
            <span class="font-mono tabular-nums" :class="severityTone(range.severity).text">
              {{ formatRange(range.min, range.max) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
