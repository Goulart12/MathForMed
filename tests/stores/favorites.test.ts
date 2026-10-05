import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { FAVORITES_KEY, useFavoritesStore } from '@/stores/favorites'
import { resetLocalStorage } from './helpers'

describe('useFavoritesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetLocalStorage()
  })

  it('starts empty', () => {
    const store = useFavoritesStore()
    expect(store.ids).toEqual([])
    expect(store.count).toBe(0)
  })

  it('toggles an id on and off', () => {
    const store = useFavoritesStore()
    store.toggle('imc')
    expect(store.isFavorite('imc')).toBe(true)
    expect(store.count).toBe(1)

    store.toggle('imc')
    expect(store.isFavorite('imc')).toBe(false)
    expect(store.count).toBe(0)
  })

  it('tracks several ids independently', () => {
    const store = useFavoritesStore()
    store.toggle('imc')
    store.toggle('gotejamento')
    store.toggle('glassmow')

    expect(store.ids).toEqual(['imc', 'gotejamento', 'glassmow'])
    expect(store.isFavorite('gotejamento')).toBe(true)
    expect(store.isFavorite('framingham')).toBe(false)
  })

  it('persists to localStorage on toggle', () => {
    const store = useFavoritesStore()
    store.toggle('imc')
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')).toEqual(['imc'])
  })

  it('hydrates from localStorage', () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(['qsofa', 'sofa']))
    setActivePinia(createPinia())
    const store = useFavoritesStore()
    expect(store.ids).toEqual(['qsofa', 'sofa'])
    expect(store.isFavorite('sofa')).toBe(true)
  })

  it('clears the list and the persisted key', () => {
    const store = useFavoritesStore()
    store.toggle('imc')
    store.clear()
    expect(store.ids).toEqual([])
    expect(localStorage.getItem(FAVORITES_KEY)).toBeNull()
  })

  it('falls back to an empty list when the stored value is corrupt', () => {
    localStorage.setItem(FAVORITES_KEY, 'not json')
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual([])
  })

  it('falls back to an empty list when no value is stored', () => {
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual([])
  })
})