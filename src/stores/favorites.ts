/**
 * Favourites store.
 *
 * Persists the list of favourited calculator ids to `localStorage` under
 * `medcalc-favorites`. The storage read/write is wrapped so the store is safe to
 * instantiate in a non-browser context (unit tests, SSR).
 *
 * @module stores/favorites
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { readStringList, writeStorage, removeStorage } from './storage'

/** `localStorage` key holding the favourited calculator ids. */
export const FAVORITES_KEY = 'medcalc-favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(readStringList(FAVORITES_KEY))

  /** Number of favourited calculators. */
  const count = computed(() => ids.value.length)

  /**
   * Adds or removes an id.
   *
   * @param id - Calculator id.
   */
  function toggle(id: string): void {
    const index = ids.value.indexOf(id)
    if (index === -1) ids.value.push(id)
    else ids.value.splice(index, 1)
    writeStorage(FAVORITES_KEY, ids.value)
  }

  /**
   * Whether an id is currently favourited.
   *
   * @param id - Calculator id.
   */
  const isFavorite = (id: string): boolean => ids.value.includes(id)

  /**
   * Empties the favourites list.
   */
  function clear(): void {
    ids.value = []
    removeStorage(FAVORITES_KEY)
  }

  return { ids, count, toggle, isFavorite, clear }
})