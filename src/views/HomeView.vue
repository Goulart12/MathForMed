<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PhCalculator } from '@phosphor-icons/vue'
import SearchBar from '@/components/layout/SearchBar.vue'
import CategoryCard from '@/components/ui/CategoryCard.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SeverityBadge from '@/components/ui/SeverityBadge.vue'
import { CATEGORIES } from '@/data/categories'
import { CALCULATORS_META, countByCategory } from '@/data/calculator-meta'
import { useHistoryStore } from '@/stores/history'

const history = useHistoryStore()

const counts = countByCategory()
// Newest-first already: `add` prepends, so the head of the list is the latest.
const recent = computed(() => history.entries.slice(0, 8))

/** `grid-cols-2` on every phone width; no breakpoint can reintroduce overflow. */
</script>

<template>
  <div>
    <header class="sticky top-0 z-20 border-b border-line bg-surface pt-[env(safe-area-inset-top,0px)]">
      <div class="mx-auto max-w-3xl px-4 py-3">
        <div class="mb-2 flex items-center gap-2">
          <PhCalculator :size="22" weight="bold" class="text-primary-600" aria-hidden="true" />
          <h1 class="text-lg font-bold text-ink">MedCalc</h1>
        </div>
        <!-- Read-only: the whole field is one tap target into the search route,
             which is where the keyboard and the result list belong. -->
        <RouterLink
          :to="{ name: 'search' }"
          class="block min-h-12 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          aria-label="Buscar calculadora"
        >
          <SearchBar model-value="" placeholder="Buscar calculadora…" readonly />
        </RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-3xl space-y-6 p-4">
      <section v-if="recent.length" class="space-y-2">
        <SectionHeader title="Recentes" subtitle="Seus últimos cálculos, neste aparelho." />
        <div class="-mx-4 overflow-x-auto px-4">
          <ul class="flex gap-2 pb-1">
            <li v-for="item in recent" :key="item.id" class="w-40 shrink-0">
              <RouterLink
                :to="{ name: 'calculator', params: { id: item.calculatorId } }"
                class="flex min-h-12 flex-col gap-1.5 rounded-md border border-line bg-white p-3 transition-all duration-150 hover:border-primary-200 active:scale-[0.98]"
              >
                <span class="truncate text-xs font-semibold text-ink">
                  {{ CALCULATORS_META[item.calculatorId]?.shortName ?? item.calculatorName }}
                </span>
                <span class="font-mono text-xl font-bold text-ink tabular-nums">
                  {{ item.result.value }}
                  <span
                    v-if="item.result.unit"
                    class="text-xs font-normal text-ink-secondary"
                  >
                    {{ item.result.unit }}
                  </span>
                </span>
                <SeverityBadge :severity="item.result.severity" />
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>

      <section class="space-y-3">
        <SectionHeader title="Categorias" subtitle="24 calculadoras em 7 áreas." />
        <div class="grid grid-cols-2 gap-3">
          <CategoryCard
            v-for="category in CATEGORIES"
            :key="category.slug"
            :category="category"
            :count="counts[category.slug] ?? 0"
          />
        </div>
      </section>
    </div>
  </div>
</template>
