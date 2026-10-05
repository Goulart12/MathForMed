<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import SearchBar from '@/components/layout/SearchBar.vue'
import CalculatorListItem from '@/components/ui/CalculatorListItem.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { searchCalculators, normalizeQuery } from '@/data/calculator-meta'

const router = useRouter()
const query = ref('')

const results = computed(() => searchCalculators(query.value))
const normalized = computed(() => normalizeQuery(query.value))
const hasQuery = computed(() => normalized.value.length > 0)

/** Every tag in the catalogue, so the empty state can offer real starting points. */
const suggestions = ['gotejamento', 'sódio', 'glicemia', 'choque', 'pediatria', 'risco']
</script>

<template>
  <div class="flex min-h-full flex-col">
    <div class="sticky top-0 z-20 border-b border-line bg-surface pt-[env(safe-area-inset-top,0px)]">
      <div class="mx-auto max-w-3xl px-4 py-3">
        <SearchBar
          v-model="query"
          placeholder="Buscar por nome, descrição ou etiqueta…"
          autofocus
          @escape="router.back()"
        />
      </div>
    </div>

    <div class="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
      <!-- Empty catalogue state: nothing typed, nothing to match. -->
      <div v-if="!hasQuery" class="space-y-4 pt-4">
        <div class="flex flex-col items-center gap-3 text-center">
          <span class="flex size-16 items-center justify-center rounded-full bg-surface-alt">
            <PhMagnifyingGlass :size="30" class="text-ink-muted" aria-hidden="true" />
          </span>
          <p class="text-sm text-ink-secondary">
            Busque entre as 24 calculadoras por nome, descrição ou etiqueta.
          </p>
        </div>
        <SectionHeader title="Sugestões" />
        <ul class="flex flex-wrap gap-2">
          <li v-for="term in suggestions" :key="term">
            <button
              type="button"
              class="min-h-12 rounded-full border border-line bg-white px-4 text-sm text-ink-secondary transition-colors duration-150 hover:border-primary-200 hover:text-primary-600 active:scale-95"
              @click="query = term"
            >
              {{ term }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Query with no match. -->
      <div v-else-if="results.length === 0" class="flex flex-col items-center gap-3 pt-10 text-center">
        <span class="flex size-16 items-center justify-center rounded-full bg-surface-alt">
          <PhMagnifyingGlass :size="30" class="text-ink-muted" aria-hidden="true" />
        </span>
        <p class="text-sm text-ink-secondary">
          Nenhuma calculadora corresponde a
          <span class="font-semibold text-ink">“{{ query }}”</span>.
        </p>
        <button
          type="button"
          class="min-h-12 text-sm font-semibold text-primary-600 underline"
          @click="query = ''"
        >
          Limpar busca
        </button>
      </div>

      <template v-else>
        <SectionHeader
          :title="`${results.length} resultado(s)`"
          :subtitle="hasQuery ? `para “${query.trim()}”` : undefined"
        />
        <ul class="space-y-2">
          <li v-for="calculator in results" :key="calculator.id">
            <CalculatorListItem :calculator="calculator" />
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
