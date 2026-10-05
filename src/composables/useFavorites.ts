/**
 * TEMPORARY SHIM — design worktree only.
 *
 * `src/stores/` belongs to the `feat/calc-logic` worktree. This Pinia store is
 * the local stand-in so favorites work end-to-end today. It deliberately
 * mirrors the logic branch's contract — store id `favorites`, storage key
 * `medcalc-favorites` — so the merge is an import-path swap with no data
 * migration.
 *
 * MERGE: delete this file and repoint imports from `@/composables/useFavorites`
 * to `@/stores/favorites`.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'medcalc-favorites'

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(readStored())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value))
  }

  function toggle(id: string) {
    const index = ids.value.indexOf(id)
    if (index === -1) ids.value.push(id)
    else ids.value.splice(index, 1)
    persist()
  }

  function remove(id: string) {
    const index = ids.value.indexOf(id)
    if (index !== -1) {
      ids.value.splice(index, 1)
      persist()
    }
  }

  const isFavorite = (id: string): boolean => ids.value.includes(id)
  const count = computed(() => ids.value.length)

  return { ids, count, toggle, remove, isFavorite }
})
