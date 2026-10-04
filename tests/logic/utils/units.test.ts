import { describe, expect, it } from 'vitest'
import {
  cmToM,
  dropsMinToMlH,
  kgToLb,
  lbToKg,
  mlHToDropsMin,
  mmolLToMgDl,
  MOLAR_MASS,
  mgDlToMmolL,
  round,
  truncate,
} from '@/logic/utils/units'

describe('MOLAR_MASS', () => {
  it('holds the published molar masses', () => {
    expect(MOLAR_MASS.glucose).toBe(180.16)
    expect(MOLAR_MASS.urea).toBe(60.06)
  })
})

describe('mgDlToMmolL', () => {
  it('converts glucose 100 mg/dL to 5.55 mmol/L', () => {
    expect(mgDlToMmolL(100, MOLAR_MASS.glucose)).toBeCloseTo(5.55, 2)
  })

  it('converts BUN 20 mg/dL to 3.33 mmol/L urea', () => {
    expect(mgDlToMmolL(20, MOLAR_MASS.urea)).toBeCloseTo(3.33, 2)
  })

  it('is exact at zero', () => {
    expect(mgDlToMmolL(0, MOLAR_MASS.glucose)).toBe(0)
  })
})

describe('mmolLToMgDl', () => {
  it('round-trips with mgDlToMmolL', () => {
    expect(mmolLToMgDl(5.55, MOLAR_MASS.glucose)).toBeCloseTo(100, 0)
    expect(mmolLToMgDl(mgDlToMmolL(180, MOLAR_MASS.glucose), MOLAR_MASS.glucose)).toBeCloseTo(
      180,
      6,
    )
  })

  it('converts 1 mmol/L urea to 6.006 mg/dL', () => {
    expect(mmolLToMgDl(1, MOLAR_MASS.urea)).toBeCloseTo(6.006, 3)
  })
})

describe('drop-rate conversion', () => {
  it('converts 60 mL/h macrodrip to 20 gtt/min', () => {
    expect(mlHToDropsMin(60, 20)).toBe(20)
  })

  it('converts 60 mL/h microdrip to 60 gtt/min', () => {
    expect(mlHToDropsMin(60, 60)).toBe(60)
  })

  it('round-trips drops per minute back to mL/h', () => {
    expect(dropsMinToMlH(20, 20)).toBe(60)
    expect(dropsMinToMlH(mlHToDropsMin(125, 60), 60)).toBeCloseTo(125, 6)
  })

  it('boundary: zero rate converts to zero', () => {
    expect(mlHToDropsMin(0, 20)).toBe(0)
    expect(dropsMinToMlH(0, 60)).toBe(0)
  })
})

describe('mass and length conversion', () => {
  it('round-trips kilograms and pounds', () => {
    expect(kgToLb(70)).toBeCloseTo(154.32, 2)
    expect(lbToKg(kgToLb(70))).toBeCloseTo(70, 6)
  })

  it('converts centimetres to metres', () => {
    expect(cmToM(178)).toBeCloseTo(1.78, 6)
    expect(cmToM(0)).toBe(0)
  })
})

describe('round', () => {
  it('rounds to one decimal by default', () => {
    expect(round(1.26)).toBe(1.3)
    expect(round(1.24)).toBe(1.2)
  })

  it('honours an explicit precision', () => {
    expect(round(1.005, 2)).toBeCloseTo(1.01, 6)
    expect(round(22.097, 1)).toBe(22.1)
    expect(round(56.714, 1)).toBe(56.7)
  })

  it('rounds to whole numbers at zero decimals', () => {
    expect(round(1695.667, 0)).toBe(1696)
  })

  it('handles negative values symmetrically', () => {
    expect(round(-1.26)).toBe(-1.3)
  })
})

describe('truncate', () => {
  it('never rounds up', () => {
    expect(truncate(1.29)).toBe(1.2)
    expect(truncate(1.99)).toBe(1.9)
  })

  it('handles negative values toward zero', () => {
    expect(truncate(-1.29)).toBe(-1.2)
  })
})