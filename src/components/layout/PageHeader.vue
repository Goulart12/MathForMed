<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PhCaretLeft, PhShareNetwork, PhStar } from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    showFavorite?: boolean
    /** Filled state of the favourite star. */
    isFavorite?: boolean
    showShare?: boolean
    /** Nothing worth sharing yet (e.g. no result on screen). */
    shareDisabled?: boolean
    /** Renders the control visible but inert — when the calculator is unknown. */
    actionsDisabled?: boolean
  }>(),
  {
    showBack: false,
    showFavorite: false,
    isFavorite: false,
    showShare: false,
    shareDisabled: false,
    actionsDisabled: false,
  },
)

const emit = defineEmits<{ toggleFavorite: []; share: [] }>()

const router = useRouter()

/**
 * The title is always centred between two equal 56px gutters so it stays
 * optically centred whether or not both actions are present.
 */
const hasActions = computed(() => props.showBack || props.showFavorite || props.showShare)

const iconButtonClass =
  'flex size-12 items-center justify-center rounded-md transition-colors duration-150 active:scale-95'
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-line bg-surface pt-[env(safe-area-inset-top,0px)]"
  >
    <div class="relative mx-auto flex h-14 max-w-3xl items-center px-1">
      <div class="flex w-14 shrink-0 justify-start">
        <button
          v-if="showBack"
          type="button"
          :class="[iconButtonClass, 'text-ink hover:bg-surface-alt']"
          aria-label="Voltar"
          @click="router.back()"
        >
          <PhCaretLeft :size="24" weight="bold" aria-hidden="true" />
        </button>
      </div>

      <h1
        class="min-w-0 flex-1 truncate text-center text-base font-semibold text-ink"
        :class="hasActions ? '' : 'text-left'"
      >
        {{ title }}
      </h1>

      <div
        class="flex shrink-0 items-center"
        :class="showFavorite && showShare ? 'w-28 gap-0.5' : 'w-14 justify-end'"
      >
        <button
          v-if="showFavorite"
          type="button"
          :class="[
            iconButtonClass,
            isFavorite
              ? 'text-warn-text hover:bg-surface-alt'
              : 'text-ink-secondary hover:bg-surface-alt',
            actionsDisabled ? 'cursor-not-allowed opacity-40' : '',
          ]"
          :aria-pressed="isFavorite"
          :aria-label="isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
          :disabled="actionsDisabled"
          @click="emit('toggleFavorite')"
        >
          <PhStar :size="24" :weight="isFavorite ? 'fill' : 'regular'" aria-hidden="true" />
        </button>
        <button
          v-if="showShare"
          type="button"
          :class="[
            iconButtonClass,
            'text-ink-secondary hover:bg-surface-alt',
            actionsDisabled ? 'cursor-not-allowed opacity-40' : '',
          ]"
          aria-label="Compartilhar resultado"
          :disabled="actionsDisabled || shareDisabled"
          @click="emit('share')"
        >
          <PhShareNetwork :size="24" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>
