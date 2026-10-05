<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PhClockCounterClockwise, PhTrash } from '@phosphor-icons/vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SeverityBadge from '@/components/ui/SeverityBadge.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { useHistoryStore } from '@/stores/history'
import { useToast } from '@/composables/useToast'
import type { HistoryEntry } from '@/stores/history'

const history = useHistoryStore()
const toast = useToast()

/** Two-step clear: arm the button, then confirm. Deleting 50 entries is not undoable. */
const confirming = ref(false)

const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  // The year matters: a 50-entry list can easily span a year boundary, and an
  // undated clinical result is worse than useless.
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date)
}

function requestClear() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  history.clear()
  confirming.value = false
  toast.show('Histórico apagado', 'info')
}

function entryValue(entry: HistoryEntry): string {
  return `${entry.result.value}${entry.result.unit ? ` ${entry.result.unit}` : ''}`
}
</script>

<template>
  <div>
    <PageHeader title="Histórico" />

    <div class="mx-auto max-w-3xl space-y-4 p-4">
      <div
        v-if="history.count === 0"
        class="flex flex-col items-center gap-3 rounded-lg border border-line bg-white p-8 text-center shadow-card"
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          role="img"
          aria-label="Nenhum cálculo registrado"
        >
          <circle cx="48" cy="48" r="30" class="fill-surface-alt stroke-line" stroke-width="2" />
          <path
            d="M48 30v19l12 7"
            class="fill-none stroke-ink-muted"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="text-base font-semibold text-ink">Nenhum cálculo ainda</p>
        <p class="max-w-xs text-sm text-ink-secondary">
          Os cálculos ficam salvos apenas neste aparelho, para consulta rápida.
        </p>
        <RouterLink
          :to="{ name: 'home' }"
          class="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary-600 px-5 text-base font-semibold text-white transition-colors duration-100 hover:bg-primary-700 active:scale-95"
        >
          <PhClockCounterClockwise :size="20" weight="bold" aria-hidden="true" />
          Abrir calculadoras
        </RouterLink>
      </div>

      <template v-else>
        <div class="flex items-center justify-between gap-3">
          <SectionHeader title="Últimos 50 cálculos" />
          <button
            type="button"
            class="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors duration-150 active:scale-95"
            :class="confirming ? 'bg-alert-bg text-alert-text' : 'text-alert-text hover:bg-alert-bg'"
            @click="requestClear"
          >
            <PhTrash :size="18" weight="bold" aria-hidden="true" />
            {{ confirming ? 'Confirmar' : 'Limpar' }}
          </button>
        </div>

        <p v-if="confirming" class="text-sm text-alert-text" role="alert">
          Isso apaga todos os {{ history.entries.length }} registros deste aparelho. Não pode ser
          desfeito.
        </p>

        <ul class="space-y-2">
          <li v-for="entry in history.entries" :key="entry.id">
            <RouterLink
              :to="{ name: 'calculator', params: { id: entry.calculatorId } }"
              class="flex min-h-12 items-center gap-3 rounded-md border border-line bg-white p-3 transition-all duration-150 hover:border-primary-200 hover:shadow-card active:scale-[0.99]"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-ink">
                  {{ entry.calculatorName }}
                </span>
                <span class="mt-0.5 block text-xs text-ink-faint">
                  {{ formatTimestamp(entry.timestamp) }}
                </span>
              </span>

              <span class="flex shrink-0 items-center gap-2">
                <span class="font-mono text-base font-bold text-ink tabular-nums">
                  {{ entryValue(entry) }}
                </span>
                <SeverityBadge :severity="entry.result.severity" />
              </span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
