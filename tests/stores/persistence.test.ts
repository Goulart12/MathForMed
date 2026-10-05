import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from '@/composables/useFavorites'
import { useHistoryStore } from '@/composables/useHistory'
import type { CalcResult } from '@/types/logic'

const RESULT: CalcResult = {
  value: 22.09,
  unit: 'kg/m²',
  label: 'IMC',
  severity: 'normal',
  interpretation: 'Peso normal.',
}

describe('favorites store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const favorites = useFavoritesStore()
    expect(favorites.ids).toEqual([])
    expect(favorites.count).toBe(0)
  })

  it('adds and removes an id', () => {
    const favorites = useFavoritesStore()
    favorites.toggle('imc')
    expect(favorites.isFavorite('imc')).toBe(true)
    favorites.toggle('imc')
    expect(favorites.isFavorite('imc')).toBe(false)
    expect(favorites.ids).toEqual([])
  })

  it('is idempotent under repeated adds', () => {
    const favorites = useFavoritesStore()
    favorites.toggle('imc')
    favorites.toggle('hba1c')
    favorites.toggle('imc')
    favorites.remove('imc')
    expect(favorites.ids).toEqual(['hba1c'])
  })

  it('persists to localStorage under the logic layer key', () => {
    // Same key as feat/calc-logic's store, so the merge needs no data migration.
    const favorites = useFavoritesStore()
    favorites.toggle('imc')
    expect(JSON.parse(localStorage.getItem('medcalc-favorites')!)).toEqual(['imc'])
  })

  it('rehydrates from localStorage on a fresh pinia', () => {
    useFavoritesStore().toggle('imc')
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual(['imc'])
  })

  it('survives corrupt storage instead of throwing', () => {
    localStorage.setItem('medcalc-favorites', '{not json')
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual([])
  })

  it('ignores non-string entries in storage', () => {
    localStorage.setItem('medcalc-favorites', JSON.stringify(['imc', 42, null, { a: 1 }]))
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual(['imc'])
  })

  it('ignores non-array storage', () => {
    localStorage.setItem('medcalc-favorites', JSON.stringify({ imc: true }))
    setActivePinia(createPinia())
    expect(useFavoritesStore().ids).toEqual([])
  })
})

describe('history store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function addEntry(store = useHistoryStore(), id = 'imc') {
    store.add({
      calculatorId: id,
      calculatorName: 'Índice de Massa Corporal',
      inputs: { weightKg: 70 },
      result: RESULT,
    })
  }

  it('starts empty', () => {
    const history = useHistoryStore()
    expect(history.entries).toEqual([])
    expect(history.isEmpty).toBe(true)
  })

  it('records a result with an id and an ISO timestamp', () => {
    const history = useHistoryStore()
    addEntry(history)
    expect(history.entries).toHaveLength(1)
    const entry = history.entries[0]!
    expect(entry.id).toBeTruthy()
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp)
    expect(entry.result).toEqual(RESULT)
  })

  it('puts the newest entry first', () => {
    const history = useHistoryStore()
    addEntry(history, 'imc')
    history.add({
      calculatorId: 'hba1c',
      calculatorName: 'HbA1c',
      inputs: { hba1cPercent: 6.5 },
      result: { ...RESULT, value: 6.5 },
    })
    expect(history.entries.map((e) => e.calculatorId)).toEqual(['hba1c', 'imc'])
  })

  it('caps the list at 50 entries, dropping the oldest', () => {
    const history = useHistoryStore()
    for (let i = 0; i < 60; i += 1) {
      history.add({
        calculatorId: 'imc',
        calculatorName: 'IMC',
        inputs: { n: i },
        result: { ...RESULT, value: i },
      })
    }
    expect(history.entries).toHaveLength(50)
    // Newest survived, oldest of the 60 was discarded.
    expect(history.entries[0]!.result.value).toBe(59)
    expect(history.entries.at(-1)!.result.value).toBe(10)
  })

  it('filters by calculator id', () => {
    const history = useHistoryStore()
    addEntry(history, 'imc')
    history.add({
      calculatorId: 'hba1c',
      calculatorName: 'HbA1c',
      inputs: {},
      result: RESULT,
    })
    expect(history.getByCalculator('hba1c')).toHaveLength(1)
    expect(history.getByCalculator('nao-existe')).toHaveLength(0)
  })

  it('clears entries and storage', () => {
    const history = useHistoryStore()
    addEntry(history)
    history.clear()
    expect(history.entries).toEqual([])
    expect(localStorage.getItem('medcalc-history')).toBeNull()
  })

  it('removes a single entry', () => {
    const history = useHistoryStore()
    addEntry(history)
    const id = history.entries[0]!.id
    history.remove(id)
    expect(history.entries).toEqual([])
  })

  it('persists under the logic layer key and rehydrates', () => {
    const history = useHistoryStore()
    addEntry(history)
    expect(JSON.parse(localStorage.getItem('medcalc-history')!)).toHaveLength(1)
    setActivePinia(createPinia())
    expect(useHistoryStore().entries).toHaveLength(1)
  })

  it('survives corrupt storage instead of throwing', () => {
    localStorage.setItem('medcalc-history', 'not json at all')
    setActivePinia(createPinia())
    expect(useHistoryStore().entries).toEqual([])
  })

  it('exposes a capped recent list for the home strip', () => {
    const history = useHistoryStore()
    for (let i = 0; i < 10; i += 1) addEntry(history)
    expect(history.latest).toHaveLength(6)
  })
})
