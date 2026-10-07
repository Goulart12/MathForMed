import { describe, expect, it } from 'vitest'
import {
  CALCULATOR_IDS,
  CALCULATORS_META,
  countByCategory,
  foldText,
  getByCategory,
  matchesQuery,
  normalizeQuery,
  requireMeta,
  searchCalculators,
} from '@/data/calculator-meta'
import { CATEGORIES } from '@/data/categories'
import { CALCULATOR_REGISTRY } from '@/components/calculators/registry'
import type { CalcCategory } from '@/logic/types'

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.slug))

describe('calculator metadata integrity', () => {
  it('has 28 calculators', () => {
    expect(CALCULATOR_IDS).toHaveLength(28)
  })

  it('lists no duplicate ids', () => {
    expect(new Set(CALCULATOR_IDS).size).toBe(CALCULATOR_IDS.length)
  })

  it('has a metadata entry for every listed id', () => {
    for (const id of CALCULATOR_IDS) {
      expect(CALCULATORS_META[id], `missing metadata for ${id}`).toBeDefined()
    }
  })

  it('has no metadata entry that is not listed', () => {
    const listed = new Set<string>(CALCULATOR_IDS)
    for (const id of Object.keys(CALCULATORS_META)) {
      expect(listed.has(id), `${id} is in CALCULATORS_META but not CALCULATOR_IDS`).toBe(true)
    }
  })

  it('gives every entry a self-consistent id', () => {
    for (const id of CALCULATOR_IDS) {
      expect(requireMeta(id).id).toBe(id)
    }
  })

  it('assigns every entry to a category the UI knows how to render', () => {
    for (const id of CALCULATOR_IDS) {
      expect(VALID_CATEGORIES.has(requireMeta(id).category), `${id} has a stale category`).toBe(
        true,
      )
    }
  })

  it('covers all eight categories', () => {
    const counts = countByCategory()
    expect(Object.keys(counts)).toHaveLength(8)
    expect(CATEGORIES).toHaveLength(8)
    // Every declared category must own at least one calculator.
    for (const category of CATEGORIES) {
      expect(counts[category.slug], `${category.slug} is empty`).toBeGreaterThan(0)
    }
  })

  it('gives every entry copy, tags and an evidence level', () => {
    for (const id of CALCULATOR_IDS) {
      const meta = requireMeta(id)
      expect(meta.name.length).toBeGreaterThan(3)
      expect(meta.shortName.length).toBeGreaterThan(0)
      expect(meta.description.length).toBeGreaterThan(10)
      expect(meta.tags.length).toBeGreaterThan(0)
      expect(meta.evidenceLevel, `${id} has no evidence level`).toMatch(/^[ABC]$/)
    }
  })

  it('returns category lists in the canonical display order', () => {
    const medicacao = getByCategory('medicacao' as CalcCategory).map((m) => m.id)
    const expected = CALCULATOR_IDS.filter((id) => requireMeta(id).category === 'medicacao')
    expect(medicacao).toEqual([...expected])
  })
})

describe('registry completeness', () => {
  it('registers exactly the canonical id list', () => {
    expect(Object.keys(CALCULATOR_REGISTRY).sort()).toEqual([...CALCULATOR_IDS].sort())
  })

  it('gives every registered entry a form and a calculate function', () => {
    for (const id of CALCULATOR_IDS) {
      const entry = CALCULATOR_REGISTRY[id]
      expect(entry.form, `${id} has no form component`).toBeTruthy()
      expect(typeof entry.calculate, `${id} has no calculate function`).toBe('function')
    }
  })

  it('reuses the canonical metadata on each entry', () => {
    for (const id of CALCULATOR_IDS) {
      expect(CALCULATOR_REGISTRY[id].meta).toBe(CALCULATORS_META[id])
    }
  })
})

describe('search', () => {
  it('strips diacritics so unaccented queries match', () => {
    expect(foldText('Superfície Corporal')).toBe('superficie corporal')
    expect(foldText('Coração')).toBe('coracao')
  })

  it('matches on name, description and tags', () => {
    expect(matchesQuery(requireMeta('imc'), 'massa corporal')).toBe(true)
    expect(matchesQuery(requireMeta('gotejamento'), 'gtt')).toBe(true)
    expect(matchesQuery(requireMeta('glasgow'), 'coma')).toBe(true)
    expect(matchesQuery(requireMeta('hba1c'), 'diabetes')).toBe(true)
  })

  it('matches accented and unaccented spellings equally', () => {
    const accented = searchCalculators('superfície').map((m) => m.id)
    const unaccented = searchCalculators('superficie').map((m) => m.id)
    expect(accented).toEqual(unaccented)
    expect(accented).toContain('superficie-corporal')
  })

  it('requires every whitespace-separated term to hit', () => {
    const both = searchCalculators('gota infusao').map((m) => m.id)
    expect(both).toContain('gotejamento')
    expect(searchCalculators('gota zzzz')).toEqual([])
  })

  it('returns everything for an empty query', () => {
    expect(searchCalculators('')).toHaveLength(28)
    expect(searchCalculators('   ')).toHaveLength(28)
  })

  it('returns nothing for a query that matches nothing', () => {
    expect(searchCalculators('zzzzqqq')).toEqual([])
  })

  it('is case insensitive', () => {
    expect(normalizeQuery('  IMC  ')).toBe('imc')
    expect(searchCalculators('IMC').map((m) => m.id)).toEqual(['imc'])
  })
})
