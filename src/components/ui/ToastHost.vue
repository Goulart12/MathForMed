<script setup lang="ts">
import { PhCheckCircle, PhInfo, PhWarning } from '@phosphor-icons/vue'
import { useToast, type ToastTone } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS: Record<ToastTone, typeof PhInfo> = {
  info: PhInfo,
  ok: PhCheckCircle,
  alert: PhWarning,
}

const TONES: Record<ToastTone, string> = {
  info: 'bg-info-bg text-info-text',
  ok: 'bg-ok-bg text-ok-text',
  alert: 'bg-alert-bg text-alert-text',
}
</script>

<template>
  <!-- `aria-live` so the confirmation reaches a screen reader, not just the eye. -->
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        class="pointer-events-auto flex min-h-12 max-w-md items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-fab"
        :class="TONES[toast.tone]"
        @click="dismiss(toast.id)"
      >
        <component :is="ICONS[toast.tone]" :size="18" weight="bold" aria-hidden="true" />
        <span>{{ toast.message }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>
