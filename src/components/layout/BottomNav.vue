<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { PhClockCounterClockwise, PhHouse, PhMagnifyingGlass, PhStar } from '@phosphor-icons/vue'

interface NavItem {
  to: string
  label: string
  icon: typeof PhHouse
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: PhHouse },
  { to: '/search', label: 'Buscar', icon: PhMagnifyingGlass },
  { to: '/favorites', label: 'Favoritos', icon: PhStar },
  { to: '/history', label: 'Histórico', icon: PhClockCounterClockwise },
]

const route = useRoute()

/**
 * `/calc/:id` and `/category/:slug` are drill-downs with no nav destination, so
 * nothing lights up there. `/` uses exact matching — otherwise every route
 * would read as "Início" because it is a prefix of them all.
 */
function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const activePath = computed(() => ITEMS.find((item) => isActive(item.to))?.to ?? '')
</script>

<template>
  <nav
    aria-label="Navegação principal"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-1px_3px_rgba(26,37,53,0.06)]"
  >
    <ul class="mx-auto flex h-14 max-w-3xl items-stretch">
      <li v-for="item in ITEMS" :key="item.to" class="flex-1">
        <RouterLink
          :to="item.to"
          class="flex h-14 min-h-12 flex-col items-center justify-center gap-0.5 transition-colors duration-150"
          :class="
            isActive(item.to) ? 'text-primary-600' : 'text-ink-secondary hover:text-ink'
          "
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            :size="24"
            :weight="activePath === item.to ? 'fill' : 'regular'"
            aria-hidden="true"
          />
          <span class="text-[0.6875rem] leading-none font-medium">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
