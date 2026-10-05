<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CategoryDef } from '@/data/categories'

defineProps<{
  category: CategoryDef
  /** Pre-computed so the card does not re-filter 24 items on every render. */
  count: number
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'category', params: { slug: category.slug } }"
    class="group flex min-h-12 flex-col gap-2 rounded-lg border border-line bg-white p-3 shadow-card transition-all duration-150 hover:border-primary-200 hover:shadow-[0_4px_16px_rgba(59,130,196,0.16)] active:scale-[0.98]"
  >
    <span
      class="flex size-11 items-center justify-center rounded-md"
      :class="category.tint"
    >
      <component :is="category.icon" :size="24" :class="category.accent" aria-hidden="true" />
    </span>

    <span class="flex items-start justify-between gap-2">
      <span class="min-w-0">
        <span class="block text-sm leading-tight font-semibold text-ink">
          {{ category.label }}
        </span>
        <span class="mt-0.5 block text-xs leading-snug text-ink-faint">
          {{ category.tagline }}
        </span>
      </span>
      <!-- Count badge: category tint + ink text keeps every pair ≥ 4.5:1;
           white-on-accent would fail AA on 5 of the 7 category hues. -->
      <span
        class="shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-bold text-ink tabular-nums"
        :class="category.tint"
        :title="`${count} calculadora(s)`"
      >
        {{ count }}
      </span>
    </span>
  </RouterLink>
</template>
