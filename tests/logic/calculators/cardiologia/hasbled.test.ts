import { describe, expect, it } from 'vitest'
import {
  calculateHasBled,
  hasBledComponents,
  HAS_BLED_MAX,
} from '@/logic/calculators/cardiologia/hasbled'

const allAbsent = {
  hypertensionUncontrolled: false,
  renalDisease: false,
  liverDisease: false,
  strokeHistory: false,
  bleedingHistory: false,
  labileInr: false,
  elderly: false,
  drugsAntiplatelet: false,
  alcoholUse: false,
}

describe('calculateHasBled', () => {
  it('returns 0 and normal severity with no criteria present', () => {
    const result = calculateHasBled(allAbsent)
    expect(result.label).toBe('HAS-BLED Score')
    expect(result.value).toBe(0)
    expect(result.unit).toBe('points')
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('low bleeding risk')
  })

  it('returns critical severity at three or more', () => {
    const result = calculateHasBled({
      ...allAbsent,
      hypertensionUncontrolled: true,
      elderly: true,
      drugsAntiplatelet: true,
    })
    expect(result.value).toBe(3)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('high bleeding risk')
  })

  it('returns attention severity at exactly two', () => {
    const result = calculateHasBled({ ...allAbsent, liverDisease: true, alcoholUse: true })
    expect(result.value).toBe(2)
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('moderate bleeding risk')
  })

  it('reaches the maximum score of nine', () => {
    const result = calculateHasBled({
      hypertensionUncontrolled: true,
      renalDisease: true,
      liverDisease: true,
      strokeHistory: true,
      bleedingHistory: true,
      labileInr: true,
      elderly: true,
      drugsAntiplatelet: true,
      alcoholUse: true,
    })
    expect(result.value).toBe(HAS_BLED_MAX)
    expect(result.severity).toBe('critical')
  })

  it('states that a high score does not contraindicate anticoagulation', () => {
    const result = calculateHasBled({ ...allAbsent, hypertensionUncontrolled: true, elderly: true, labileInr: true })
    expect(result.interpretation).toContain('does not contraindicate anticoagulation')
    expect(result.interpretation).toContain('modifiable')
  })

  it('lists the modifiable risks present as sub-results', () => {
    const result = calculateHasBled({ ...allAbsent, liverDisease: true })
    expect(result.subResults).toHaveLength(1)
    expect(result.subResults?.[0].label).toMatch(/^L — Liver disease/)
    expect(result.subResults?.[0].interpretation).toMatch(/cirrhosis/i)
  })

  it('reports zero modifiable risks when none are present', () => {
    const result = calculateHasBled(allAbsent)
    expect(result.subResults?.[0].label).toBe('Modifiable Risks')
    expect(result.subResults?.[0].value).toBe(0)
  })

  it('does not throw for any boolean combination', () => {
    expect(() => calculateHasBled({ ...allAbsent, labileInr: true })).not.toThrow()
  })
})

describe('hasBledComponents', () => {
  it('returns nine criteria in display order', () => {
    const components = hasBledComponents(allAbsent)
    expect(components).toHaveLength(HAS_BLED_MAX)
    expect(components[0].label).toMatch(/^H — Uncontrolled hypertension/)
    expect(components[8].label).toMatch(/^D — Alcohol/)
  })

  it('maps each criterion to its input key', () => {
    const components = hasBledComponents({ ...allAbsent, alcoholUse: true })
    const alcohol = components.find(component => component.label.startsWith('D — Alcohol'))
    expect(alcohol?.present).toBe(true)
    expect(alcohol?.points).toBe(1)

    const stroke = components.find(component => component.label.startsWith('S —'))
    expect(stroke?.present).toBe(false)
    expect(stroke?.points).toBe(0)
  })
})