<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CalculatorListItem from '@/components/ui/CalculatorListItem.vue'
import { getCategory, categoryLabel } from '@/data/categories'
import { getByCategory } from '@/data/calculator-meta'

const props = defineProps<{ slug: string }>()

const category = computed(() => getCategory(props.slug))
const calculators = computed(() => getByCategory(props.slug))

/** `/category/typo` should say so rather than render an empty list. */
const notFound = computed(() => !category.value)

const title = computed(() => category.value?.label ?? categoryLabel(props.slug))
</script>

<template>
  <div>
    <PageHeader :title="title" show-back />

    <div class="mx-auto max-w-3xl space-y-4 p-4">
      <div v-if="notFound" class="rounded-lg border border-line bg-white p-6 text-center shadow-card">
        <h2 class="text-base font-semibold text-ink">Categoria não encontrada</h2>
        <p class="mt-1 text-sm text-ink-secondary">
          Não há uma categoria com o identificador
          <span class="font-mono">{{ slug }}</span
          >.
        </p>
      </div>

      <template v-else>
        <header class="flex items-start gap-3">
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-md"
            :class="category!.tint"
          >
            <component
              :is="category!.icon"
              :size="24"
              :class="category!.accent"
              aria-hidden="true"
            />
          </span>
          <div class="min-w-0">
            <p class="text-sm text-ink-secondary">{{ category!.tagline }}</p>
            <p class="mt-0.5 text-xs text-ink-faint">
              {{ calculators.length }} calculadora(s)
            </p>
          </div>
        </header>

        <ul class="space-y-2">
          <li v-for="calculator in calculators" :key="calculator.id">
            <CalculatorListItem :calculator="calculator" />
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
