<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="px-1">
    <h2 class="text-xs font-semibold tracking-[0.05em] text-ink-faint uppercase">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="mt-0.5 text-sm text-ink-secondary">{{ subtitle }}</p>
  </div>
</template>
