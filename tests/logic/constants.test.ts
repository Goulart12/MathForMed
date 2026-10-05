import { describe, expect, it } from 'vitest'
import {
  CALCULATORS_META,
  CALCULATOR_IDS,
  calculatorsByCategory,
  CATEGORIES,
  SEVERITY_LABELS,
} from '@/logic/constants'
import { CALCULATORS, resolveCalculator } from '@/logic/calculators'
import { CALC_CATEGORIES, CalcValidationError } from '@/logic/types'

/** The 24 ids the design agent's router registers. */
const EXPECTED_IDS = [
  'imc',
  'superficie-corporal',
  'peso-ideal',
  'dose-peso',
  'gotejamento',
  'diluicao',
  'infusao-continua',
  'cockcroft',
  'ckd-epi',
  'mdrd',
  'chads-vasc',
  'has-bled',
  'framingham',
  'glasgow',
  'qsofa',
  'sofa',
  'shock-index',
  'anion-gap',
  'osmolalidade',
  'correcao-sodio',
  'correcao-calcio',
  'hba1c',
  'harris-benedict',
  'holliday-segar',
]

describe('CALCULATORS_META', () => {
  it('registers all 24 calculator ids with no extras', () => {
    expect([...CALCULATOR_IDS].sort()).toEqual([...EXPECTED_IDS].sort())
    expect(CALCULATOR_IDS).toHaveLength(24)
  })

  it('gives every entry a fully populated metadata object', () => {
    for (const id of CALCULATOR_IDS) {
      const meta = CALCULATORS_META[id]
      expect(meta?.id, `${id}.id`).toBe(id)
      expect(meta?.name.length, `${id}.name`).toBeGreaterThan(3)
      expect(meta?.shortName.length, `${id}.shortName`).toBeGreaterThan(0)
      expect(meta?.description.length, `${id}.description`).toBeGreaterThan(10)
      expect(CALC_CATEGORIES, `${id}.category`).toContain(meta?.category)
      expect(meta?.tags.length, `${id}.tags`).toBeGreaterThan(0)
      expect(['A', 'B', 'C'], `${id}.evidenceLevel`).toContain(meta?.evidenceLevel)
      expect(meta?.reference, `${id}.reference`).toBeTruthy()
    }
  })

  it('assigns every calculator a known category', () => {
    for (const id of CALCULATOR_IDS) {
      expect(CALC_CATEGORIES).toContain(CALCULATORS_META[id]?.category)
    }
  })
})

describe('CATEGORIES', () => {
  it('labels all seven categories in registry order', () => {
    expect(Object.keys(CATEGORIES).sort()).toEqual([...CALC_CATEGORIES].sort())
    expect(CATEGORIES.medicacao.order).toBe(1)
    expect(CATEGORIES.nutricao.order).toBe(7)
  })

  it('gives every category a label and description', () => {
    for (const category of CALC_CATEGORIES) {
      expect(CATEGORIES[category].label.length).toBeGreaterThan(0)
      expect(CATEGORIES[category].description.length).toBeGreaterThan(0)
    }
  })
})

describe('SEVERITY_LABELS', () => {
  it('matches the badge vocabulary the design agent renders', () => {
    expect(SEVERITY_LABELS.normal).toBe('NORMAL')
    expect(SEVERITY_LABELS.attention).toBe('WARNING')
    expect(SEVERITY_LABELS.critical).toBe('CRITICAL')
    expect(SEVERITY_LABELS.info).toBe('INFO')
  })
})

describe('calculatorsByCategory', () => {
  it('groups calculators under their category', () => {
    expect(calculatorsByCategory('medicacao').map(meta => meta.id)).toEqual([
      'dose-peso',
      'gotejamento',
      'diluicao',
      'infusao-continua',
    ])
    expect(calculatorsByCategory('laboratorial')).toHaveLength(5)
    expect(calculatorsByCategory('emergencia')).toHaveLength(4)
  })

  it('returns an empty list for an unused category', () => {
    expect(calculatorsByCategory('cardio' as never)).toEqual([])
  })
})

describe('CALCULATORS registry', () => {
  it('exposes exactly the same ids as the metadata registry', () => {
    expect(Object.keys(CALCULATORS).sort()).toEqual([...CALCULATOR_IDS].sort())
  })

  it('agrees with the metadata on every category', () => {
    for (const id of CALCULATOR_IDS) {
      expect(CALCULATORS[id as keyof typeof CALCULATORS].category, id).toBe(
        CALCULATORS_META[id]?.category,
      )
    }
  })

  it('covers all seven categories', () => {
    const categories = new Set(
      Object.values(CALCULATORS).map(entry => entry.category),
    )
    expect([...categories].sort()).toEqual([...CALC_CATEGORIES].sort())
  })
})

describe('resolveCalculator', () => {
  it('returns the calculation function for a known id', () => {
    const calculate = resolveCalculator('imc')
    expect(calculate).toBeTypeOf('function')
    expect(calculate?.({ weightKg: 70, heightM: 1.78 })).toMatchObject({
      value: 22.1,
      severity: 'normal',
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(resolveCalculator('not-a-calculator')).toBeUndefined()
  })
})

describe('CalcValidationError', () => {
  it('carries the offending field and extends Error', () => {
    const error = new CalcValidationError('weightKg', 'out of range')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(CalcValidationError)
    expect(error.field).toBe('weightKg')
    expect(error.message).toBe('out of range')
    expect(error.name).toBe('CalcValidationError')
  })
})