<script setup lang="ts">
import BottomNav from './BottomNav.vue'

/**
 * Page frame for every route. Owns the bottom-nav offset so no view has to
 * remember it: the scroll region reserves exactly BottomNav's height plus the
 * iOS home-indicator inset, which is why `--bottom-nav-h` is defined here and
 * nowhere else.
 */
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-surface">
    <main
      class="flex-1 overflow-x-hidden pb-[calc(var(--bottom-nav-h)+0.5rem)]"
    >
      <slot />
    </main>
    <BottomNav />
  </div>
</template>
