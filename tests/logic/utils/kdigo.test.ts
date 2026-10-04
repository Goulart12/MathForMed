import { describe, expect, it } from 'vitest'
import { classifyKdigo, KDIGO_REFERENCES, KDIGO_STAGES } from '@/logic/utils/kdigo'

describe('classifyKdigo', () => {
  it('assigns G1 at or above 90 mL/min', () => {
    expect(classifyKdigo(120).stage).toBe('G1')
    expect(classifyKdigo(90).stage).toBe('G1')
  })

  it('assigns G2 between 60 and 89', () => {
    expect(classifyKdigo(89).stage).toBe('G2')
    expect(classifyKdigo(60).stage).toBe('G2')
  })

  it('assigns G3a between 45 and 59', () => {
    expect(classifyKdigo(59).stage).toBe('G3a')
    expect(classifyKdigo(45).stage).toBe('G3a')
  })

  it('assigns G3b between 30 and 44', () => {
    expect(classifyKdigo(44).stage).toBe('G3b')
    expect(classifyKdigo(30).stage).toBe('G3b')
  })

  it('assigns G4 between 15 and 29', () => {
    expect(classifyKdigo(29).stage).toBe('G4')
    expect(classifyKdigo(15).stage).toBe('G4')
  })

  it('assigns G5 below 15, clamping at zero', () => {
    expect(classifyKdigo(14).stage).toBe('G5')
    expect(classifyKdigo(0).stage).toBe('G5')
  })

  it('carries the published severity for each stage', () => {
    expect(classifyKdigo(95).severity).toBe('normal')
    expect(classifyKdigo(70).severity).toBe('normal')
    expect(classifyKdigo(50).severity).toBe('attention')
    expect(classifyKdigo(35).severity).toBe('attention')
    expect(classifyKdigo(20).severity).toBe('critical')
    expect(classifyKdigo(5).severity).toBe('critical')
  })

  it('labels every stage', () => {
    expect(classifyKdigo(100).label).toMatch(/^G1/)
    expect(classifyKdigo(100).label).toMatch(/Normal or high/)
  })
})

describe('KDIGO_STAGES', () => {
  it('declares six ordered stages', () => {
    expect(KDIGO_STAGES.map(stage => stage.stage)).toEqual([
      'G1',
      'G2',
      'G3a',
      'G3b',
      'G4',
      'G5',
    ])
  })
})

describe('KDIGO_REFERENCES', () => {
  it('exposes one reference band per stage, ordered G1 to G5', () => {
    expect(KDIGO_REFERENCES).toHaveLength(6)
    expect(KDIGO_REFERENCES[0].label).toMatch(/^G1/)
    expect(KDIGO_REFERENCES[5].label).toMatch(/^G5/)
  })

  it('carries min and max bounds matching the stages', () => {
    expect(KDIGO_REFERENCES[0].min).toBe(90)
    expect(KDIGO_REFERENCES[0].max).toBeUndefined()
    expect(KDIGO_REFERENCES[5].max).toBe(14)
    expect(KDIGO_REFERENCES[5].min).toBeUndefined()
  })
})