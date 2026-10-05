/**
 * TEMPORARY SHIM — design worktree only.
 *
 * `src/stores/` belongs to the `feat/calc-logic` worktree. This Pinia store is
 * the local stand-in so the history view works end-to-end today, and mirrors
 * the logic branch's contract — store id `history`, storage key
 * `medcalc-history`, 50-entry cap, same `HistoryEntry` shape.
 *
 * MERGE: delete this file and repoint imports from `@/composables/useHistory`
 * to `@/stores/history`.
 *
 * PHI NOTE: `inputs` is caller-supplied calculator parameters only. Nothing in
 * this app prompts for patient identifiers, and no view ever writes a name,
 * MRN or bed number into a history entry.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CalcResult } from '@/types/logic'

const STORAGE_KEY = 'medcalc-history'
const MAX_ENTRIES = 50

export interface HistoryEntry {
  id: string
  calculatorId: string
  calculatorName: string
  /** ISO 8601 */
  timestamp: string
  result: CalcResult
  inputs: Record<string, unknown>
}

function readStored(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>(readStored())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
  }

  function add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    entries.value.unshift({
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    })
    if (entries.value.length > MAX_ENTRIES) entries.value.length = MAX_ENTRIES
    persist()
  }

  function remove(id: string) {
    const index = entries.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      entries.value.splice(index, 1)
      persist()
    }
  }

  function clear() {
    entries.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  const getByCalculator = (calculatorId: string): HistoryEntry[] =>
    entries.value.filter((e) => e.calculatorId === calculatorId)

  const latest = computed(() => entries.value.slice(0, 6))
  const isEmpty = computed(() => entries.value.length === 0)

  return { entries, latest, isEmpty, add, remove, clear, getByCalculator }
})
