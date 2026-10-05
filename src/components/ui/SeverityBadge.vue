<script setup lang="ts">
import { computed } from 'vue'
import { PhWarning, PhCheckCircle, PhInfo } from '@phosphor-icons/vue'
import { severityTone } from '@/data/severity'
import type { Severity } from '@/types/logic'

const props = withDefaults(
  defineProps<{
    severity: Severity
    /** Hides the label and renders the dot alone — for dense list rows. */
    compact?: boolean
  }>(),
  { compact: false },
)

const tone = computed(() => severityTone(props.severity))

const icon = computed(() => {
  switch (props.severity) {
    case 'normal':
      return PhCheckCircle
    case 'critical':
      return PhWarning
    default:
      return PhInfo
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase"
    :class="[tone.bg, tone.text]"
  >
    <component
      :is="compact ? 'span' : icon"
      :size="compact ? 10 : 14"
      weight="bold"
      :class="compact ? tone.dotText : ''"
      aria-hidden="true"
    />
    <template v-if="!compact">{{ tone.label }}</template>
    <span v-else class="sr-only">{{ tone.label }}</span>
  </span>
</template>
