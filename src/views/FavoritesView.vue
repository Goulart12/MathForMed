<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PhStar } from '@phosphor-icons/vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CalculatorListItem from '@/components/ui/CalculatorListItem.vue'
import { CALCULATORS_META } from '@/data/calculator-meta'
import { useFavoritesStore } from '@/stores/favorites'

const favorites = useFavoritesStore()

/** Resolved through the metadata so a stale id in storage cannot blank a row. */
const favoritesList = computed(() =>
  favorites.ids
    .map((id) => CALCULATORS_META[id])
    .filter((meta): meta is NonNullable<typeof meta> => meta !== undefined),
)
</script>

<template>
  <div>
    <PageHeader title="Favoritos" />

    <div class="mx-auto max-w-3xl space-y-4 p-4">
      <div
        v-if="favoritesList.length === 0"
        class="flex flex-col items-center gap-3 rounded-lg border border-line bg-white p-8 text-center shadow-card"
      >
        <!-- Inline SVG so the empty state ships in the bundle, offline. -->
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          role="img"
          aria-label="Nenhum favorito salvo"
        >
          <circle cx="48" cy="48" r="30" class="fill-surface-alt stroke-line" stroke-width="2" />
          <path
            d="M48 32.5l4.9 9.9 10.9 1.6-7.9 7.7 1.9 10.9-9.8-5.2-9.8 5.2 1.9-10.9-7.9-7.7 10.9-1.6L48 32.5z"
            class="fill-none stroke-ink-muted"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
        <p class="text-base font-semibold text-ink">Nenhum favorito ainda</p>
        <p class="max-w-xs text-sm text-ink-secondary">
          Toque na estrela no topo de uma calculadora para salvá-la aqui e encontrá-la
          rápido no próximo plantão.
        </p>
        <RouterLink
          :to="{ name: 'home' }"
          class="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary-600 px-5 text-base font-semibold text-white transition-colors duration-100 hover:bg-primary-700 active:scale-95"
        >
          <PhStar :size="20" weight="bold" aria-hidden="true" />
          Escolher uma calculadora
        </RouterLink>
      </div>

      <ul v-else class="space-y-2">
        <li v-for="calculator in favoritesList" :key="calculator.id">
          <CalculatorListItem
            :calculator="calculator"
            favorite
            @toggle-favorite="favorites.toggle(calculator.id)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
