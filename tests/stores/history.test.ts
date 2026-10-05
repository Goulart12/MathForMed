import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { CalcResult } from '@/logic/types'
import { HISTORY_KEY, MAX_ENTRIES, useHistoryStore } from '@/stores/history'
import { resetLocalStorage } from './helpers'

const result: CalcResult = {
  label: 'Body Mass Index',
  value: 22.1,
  unit: 'kg/m²',
  severity: 'normal',
  interpretation: 'BMI 22.1 kg/m² — Normal weight.',
}

const entry = (calculatorId = 'imc') => ({
  calculatorId,
  calculatorName: 'Body Mass Index (BMI)',
  result,
  inputs: { weightKg: 70, heightM: 1.78 },
})

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetLocalStorage()
  })

  it('starts empty', () => {
    const store = useHistoryStore()
    expect(store.entries).toEqual([])
    expect(store.count).toBe(0)
  })

  it('prepends a new entry with a generated id and timestamp', () => {
    const store = useHistoryStore()
    const stored = store.add(entry())

    expect(store.count).toBe(1)
    expect(stored.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Date(stored.timestamp).toISOString()).toBe(stored.timestamp)
    expect(store.entries[0]?.calculatorId).toBe('imc')
  })

  it('keeps the newest entry first', () => {
    const store = useHistoryStore()
    store.add(entry('imc'))
    store.add(entry('qsofa'))

    expect(store.entries.map(e => e.calculatorId)).toEqual(['qsofa', 'imc'])
  })

  it('gives every entry a unique id', () => {
    const store = useHistoryStore()
    const ids = new Set([
      store.add(entry()).id,
      store.add(entry()).id,
      store.add(entry()).id,
    ])
    expect(ids.size).toBe(3)
  })

  it('caps the history at fifty entries', () => {
    const store = useHistoryStore()
    for (let i = 0; i < MAX_ENTRIES + 10; i += 1) store.add(entry(`calc-${i}`))

    expect(store.count).toBe(MAX_ENTRIES)
    // The ten oldest were dropped.
    expect(store.entries[0]?.calculatorId).toBe(`calc-${MAX_ENTRIES + 9}`)
    expect(store.entries.at(-1)?.calculatorId).toBe('calc-10')
  })

  it('persists entries to localStorage', () => {
    const store = useHistoryStore()
    store.add(entry())
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].calculatorId).toBe('imc')
  })

  it('hydrates from localStorage', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([{ ...entry('sofa'), id: 'x', timestamp: '2024-01-01T00:00:00.000Z' }]),
    )
    setActivePinia(createPinia())

    const store = useHistoryStore()
    expect(store.count).toBe(1)
    expect(store.entries[0]?.id).toBe('x')
  })

  it('falls back to an empty list when the stored value is corrupt', () => {
    localStorage.setItem(HISTORY_KEY, '{{{')
    setActivePinia(createPinia())
    expect(useHistoryStore().entries).toEqual([])
  })

  it('filters by calculator', () => {
    const store = useHistoryStore()
    store.add(entry('imc'))
    store.add(entry('qsofa'))
    store.add(entry('imc'))

    expect(store.getByCalculator('imc')).toHaveLength(2)
    expect(store.getByCalculator('qsofa')).toHaveLength(1)
    expect(store.getByCalculator('sofa')).toHaveLength(0)
  })

  it('removes a single entry and re-persists', () => {
    const store = useHistoryStore()
    const first = store.add(entry('imc'))
    store.add(entry('qsofa'))

    store.remove(first.id)
    expect(store.count).toBe(1)
    expect(store.entries[0]?.calculatorId).toBe('qsofa')
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toHaveLength(1)
  })

  it('ignores removal of an unknown id', () => {
    const store = useHistoryStore()
    store.add(entry())
    store.remove('does-not-exist')
    expect(store.count).toBe(1)
  })

  it('clears the history and the persisted key', () => {
    const store = useHistoryStore()
    store.add(entry())
    store.clear()
    expect(store.entries).toEqual([])
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull()
  })

  it('preserves the full result object', () => {
    const store = useHistoryStore()
    store.add(entry())
    expect(store.entries[0]?.result).toEqual(result)
    expect(store.entries[0]?.inputs).toEqual({ weightKg: 70, heightM: 1.78 })
  })
})