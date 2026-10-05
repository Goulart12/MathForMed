<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import { getEntry } from '@/components/calculators/registry'
import { getCategory } from '@/data/categories'
import { useFavoritesStore } from '@/stores/favorites'
import { useHistoryStore } from '@/stores/history'
import { useToast } from '@/composables/useToast'
import { CalcValidationError, type CalcResult } from '@/logic/types'

const props = defineProps<{ id: string }>()

const favorites = useFavoritesStore()
const history = useHistoryStore()
const toast = useToast()

const result = ref<CalcResult | null>(null)
const validationMessage = ref<string | null>(null)
/** Bumped on reset so the async form remounts with every field cleared. */
const formEpoch = ref(0)
/** Bumped per result so `ResultCard`'s entrance animation replays each time. */
const resultEpoch = ref(0)

const entry = computed(() => getEntry(props.id))
const meta = computed(() => entry.value?.meta)
const category = computed(() => (meta.value ? getCategory(meta.value.category) : undefined))

const isFavorite = computed(() => (props.id ? favorites.isFavorite(props.id) : false))

/** Deep-linking `/calc/xyz` for an id that is not in the registry. */
const notFound = computed(() => !entry.value)

/** Changing calculators must never leave the previous result on screen. */
watch(
  () => props.id,
  () => {
    result.value = null
    validationMessage.value = null
    formEpoch.value++
  },
)

/**
 * The route's static title is just "Calculadora", which is useless when a
 * clinician has several calculators open in separate tabs. Name it instead.
 */
watch(
  meta,
  (current) => {
    document.title = current ? `MedCalc · ${current.shortName}` : 'MedCalc'
  },
  { immediate: true },
)

async function handleCalculate(payload: never) {
  const current = entry.value
  if (!current) return

  try {
    const computed_ = await current.calculate(payload)
    validationMessage.value = null
    result.value = computed_
    resultEpoch.value++
    history.add({
      calculatorId: current.meta.id,
      calculatorName: current.meta.name,
      // Calculator parameters only — the app never asks for patient identifiers.
      inputs: payload as unknown as Record<string, unknown>,
      result: computed_,
    })
    toast.show('Salvo no histórico', 'ok')
  } catch (error) {
    if (error instanceof CalcValidationError) {
      validationMessage.value = error.message
      toast.show('Verifique os valores informados', 'alert')
      return
    }
    // A missing logic module must read as "unavailable", not "your fault".
    validationMessage.value =
      error instanceof Error ? error.message : 'Não foi possível calcular.'
  }
}

function handleToggleFavorite() {
  if (!meta.value) return
  favorites.toggle(meta.value.id)
  toast.show(
    favorites.isFavorite(meta.value.id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
    'info',
    1500,
  )
}

function handleReset() {
  result.value = null
  validationMessage.value = null
  formEpoch.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Shares the numeric result only — never the inputs, which may be clinical. */
async function handleShare() {
  const current = result.value
  if (!current) return
  const value = `${current.value}${current.unit ? ` ${current.unit}` : ''}`
  const text = `${meta.value?.name ?? 'MedCalc'}: ${value} — ${current.label}`
  try {
    if (navigator.share) {
      await navigator.share({ title: meta.value?.name, text })
    } else {
      await navigator.clipboard.writeText(text)
      toast.show('Resultado copiado', 'ok')
    }
  } catch {
    toast.show('Não foi possível compartilhar', 'alert')
  }
}
</script>

<template>
  <div>
    <PageHeader
      :title="meta?.shortName ?? 'Calculadora'"
      show-back
      show-favorite
      show-share
      :is-favorite="isFavorite"
      :actions-disabled="notFound"
      :share-disabled="!result"
      @toggle-favorite="handleToggleFavorite"
      @share="handleShare"
    />

    <div v-if="notFound" class="mx-auto max-w-3xl p-4">
      <div class="rounded-lg border border-line bg-white p-6 text-center shadow-card">
        <h2 class="text-base font-semibold text-ink">Calculadora não encontrada</h2>
        <p class="mt-1 text-sm text-ink-secondary">
          Não há uma calculadora registrada com o identificador
          <span class="font-mono">{{ id }}</span
          >.
        </p>
        <div class="mt-4 flex justify-center">
          <AppButton variant="secondary" @click="$router.push({ name: 'home' })">
            Voltar ao início
          </AppButton>
        </div>
      </div>
    </div>

    <div v-else class="mx-auto max-w-3xl space-y-4 p-4">
      <header class="space-y-1">
        <p v-if="category" class="flex items-center gap-1.5 text-xs font-medium text-ink-faint">
          <component :is="category.icon" :size="14" :class="category.accent" aria-hidden="true" />
          {{ category.label }}
        </p>
        <p class="text-sm text-ink-secondary">{{ meta?.description }}</p>
        <p v-if="meta?.reference" class="text-xs text-ink-faint">{{ meta.reference }}</p>
      </header>

      <component :is="entry!.form" :key="`${id}-${formEpoch}`" @calculate="handleCalculate" />

      <p
        v-if="validationMessage"
        class="rounded-md border border-alert/30 bg-alert-bg px-3 py-2 text-sm font-medium text-alert-text"
        role="alert"
      >
        {{ validationMessage }}
      </p>

      <ResultCard v-if="result" :key="resultEpoch" :result="result" />

      <AppButton v-if="result" variant="ghost" fullWidth @click="handleReset">
        Novo cálculo
      </AppButton>
    </div>
  </div>
</template>
