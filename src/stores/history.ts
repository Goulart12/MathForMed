/**
 * Calculation history store.
 *
 * Keeps the most recent {@link MAX_ENTRIES} calculations in reverse-chronological
 * order, persisted to `localStorage` under `medcalc-history`.
 *
 * ⚠️ Inputs are stored verbatim and therefore travel to the device. Callers must
 * never place patient-identifying data (name, MRN, date of birth) in
 * `HistoryEntry.inputs`; only the measurement values needed to reproduce the
 * calculation belong there.
 *
 * @module stores/history
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CalcResult } from '@/logic/types'
import { readStorage, removeStorage, writeStorage, randomId } from './storage'

/** One recorded calculation. */
export interface HistoryEntry {
  /** Unique identifier, generated with `crypto.randomUUID()`. */
  id: string
  /** Calculator id, matching `CALCULATORS_META`. */
  calculatorId: string
  /** Calculator display name, denormalised so history survives a rename. */
  calculatorName: string
  /** ISO 8601 timestamp of the calculation. */
  timestamp: string
  /** The computed result. */
  result: CalcResult
  /** Input values. Never include patient-identifying data. */
  inputs: Record<string, unknown>
}

/** `localStorage` key holding the history entries. */
export const HISTORY_KEY = 'medcalc-history'

/** Maximum number of retained entries; older entries are dropped. */
export const MAX_ENTRIES = 50

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>(readStorage<HistoryEntry[]>(HISTORY_KEY) ?? [])

  /** Total number of retained entries. */
  const count = computed(() => entries.value.length)

  /**
   * Prepends an entry, trimming the oldest when the cap is reached.
   *
   * @param entry - Everything but the generated `id` and `timestamp`.
   * @returns The stored entry, including its generated fields.
   */
  function add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
    const stored: HistoryEntry = {
      ...entry,
      id: randomId(),
      timestamp: new Date().toISOString(),
    }

    entries.value.unshift(stored)
    if (entries.value.length > MAX_ENTRIES) {
      entries.value.length = MAX_ENTRIES
    }

    writeStorage(HISTORY_KEY, entries.value)
    return stored
  }

  /**
   * Empties the history.
   */
  function clear(): void {
    entries.value = []
    removeStorage(HISTORY_KEY)
  }

  /**
   * Filters the history by calculator.
   *
   * @param id - Calculator id.
   */
  function getByCalculator(id: string): HistoryEntry[] {
    return entries.value.filter(entry => entry.calculatorId === id)
  }

  /**
   * Deletes a single entry.
   *
   * @param id - Entry id.
   */
  function remove(id: string): void {
    const index = entries.value.findIndex(entry => entry.id === id)
    if (index === -1) return
    entries.value.splice(index, 1)
    writeStorage(HISTORY_KEY, entries.value)
  }

  return { entries, count, add, clear, getByCalculator, remove }
})