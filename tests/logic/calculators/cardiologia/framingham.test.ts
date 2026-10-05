import { describe, expect, it } from 'vitest'
import {
  calculateFramingham,
  framinghamBreakdown,
} from '@/logic/calculators/cardiologia/framingham'
import { CalcValidationError } from '@/logic/types'

/**
 * Reference values taken from the Framingham Heart Study's published
 * "Hard Coronary Heart Disease (10-year risk)" point tables.
 */
const lowRiskMale = {
  age: 45,
  totalCholesterolMgDl: 180,
  hdlCholesterolMgDl: 55,
  sysBpMmhg: 120,
  smoker: false,
  diabetic: false,
  bpTreated: false,
  sex: 'M' as const,
}

describe('framinghamBreakdown', () => {
  it('allocates points factor by factor', () => {
    const { totalPoints, components } = framinghamBreakdown({
      age: 55,
      totalCholesterolMgDl: 220,
      hdlCholesterolMgDl: 45,
      sysBpMmhg: 140,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'M',
    })

    const points = Object.fromEntries(
      components.map(component => [component.label, component.points]),
    )

    expect(points['Idade']).toBe(8)
    expect(points['Colesterol total']).toBe(3)
    expect(points['Colesterol HDL']).toBe(1)
    expect(points['Pressão arterial sistólica (não tratada)']).toBe(1)
    expect(points['Fumante atual']).toBe(0)
    expect(totalPoints).toBe(13)
  })

  it('scores 13 points as a 12% 10-year risk for a male', () => {
    const { riskPercent, totalPoints } = framinghamBreakdown({
      age: 55,
      totalCholesterolMgDl: 220,
      hdlCholesterolMgDl: 45,
      sysBpMmhg: 140,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'M',
    })
    expect(totalPoints).toBe(13)
    expect(riskPercent).toBe(12)
  })

  it('uses a separate female table', () => {
    const { totalPoints } = framinghamBreakdown({
      age: 45,
      totalCholesterolMgDl: 190,
      hdlCholesterolMgDl: 55,
      sysBpMmhg: 120,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'F',
    })
    // Age 45–49 = 3, TC 190 = 3, HDL 55 = 0, SBP 120 untreated = 1
    expect(totalPoints).toBe(7)
  })

  it('reports a sub-1% risk for a negative or low point total', () => {
    const { belowOnePercent, riskPercent } = framinghamBreakdown({
      age: 30,
      totalCholesterolMgDl: 150,
      hdlCholesterolMgDl: 65,
      sysBpMmhg: 110,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'F',
    })
    expect(belowOnePercent).toBe(true)
    expect(riskPercent).toBe(1)
  })

  it('adds treated systolic BP points on top of untreated', () => {
    const untreated = framinghamBreakdown({ ...lowRiskMale, sysBpMmhg: 150, bpTreated: false })
    const treated = framinghamBreakdown({ ...lowRiskMale, sysBpMmhg: 150, bpTreated: true })
    expect(treated.totalPoints).toBeGreaterThan(untreated.totalPoints)
  })

  it('scales smoking points down with age', () => {
    const young = framinghamBreakdown({ ...lowRiskMale, age: 40, smoker: true })
    const old = framinghamBreakdown({ ...lowRiskMale, age: 75, smoker: true })
    const youngPoints = young.components.find(c => c.label === 'Fumante atual')?.points ?? 0
    const oldPoints = old.components.find(c => c.label === 'Fumante atual')?.points ?? 0
    expect(youngPoints).toBeGreaterThan(oldPoints)
  })

  it('extends age points above the published range of 79, up to the saturation point', () => {
    const at79 = framinghamBreakdown({ ...lowRiskMale, age: 79 })
    const at80 = framinghamBreakdown({ ...lowRiskMale, age: 80 })
    const at85 = framinghamBreakdown({ ...lowRiskMale, age: 85 })
    expect(at80.totalPoints).toBe(at79.totalPoints + 1)
    // Male age points saturate at 17, where the published risk table also tops out.
    expect(at85.totalPoints).toBe(17)
  })

  it('caps the risk at the saturation point', () => {
    const { riskPercent } = framinghamBreakdown({
      age: 90,
      totalCholesterolMgDl: 300,
      hdlCholesterolMgDl: 20,
      sysBpMmhg: 200,
      smoker: true,
      diabetic: false,
      bpTreated: true,
      sex: 'M',
    })
    expect(riskPercent).toBe(30)
  })

  it('steps the systolic BP points at every published band edge', () => {
    const pointsFor = (sysBpMmhg: number) =>
      framinghamBreakdown({ ...lowRiskMale, age: 45, sysBpMmhg })
        .components.find(c => c.label.startsWith('Pressão arterial sistólica'))?.points

    // Age 45–49 is column 1, so only the systolic term moves across this sweep.
    expect(pointsFor(119)).toBe(0)
    expect(pointsFor(120)).toBe(0)
    expect(pointsFor(129)).toBe(0)
    expect(pointsFor(130)).toBe(1)
    expect(pointsFor(139)).toBe(1)
    expect(pointsFor(140)).toBe(1)
    expect(pointsFor(159)).toBe(1)
    expect(pointsFor(160)).toBe(2)
    expect(pointsFor(250)).toBe(2)
  })

  it('steps the HDL points at every published band edge', () => {
    const pointsFor = (hdlCholesterolMgDl: number) =>
      framinghamBreakdown({ ...lowRiskMale, age: 45, hdlCholesterolMgDl })
        .components.find(c => c.label === 'Colesterol HDL')?.points

    expect(pointsFor(39)).toBe(2)
    expect(pointsFor(40)).toBe(1)
    expect(pointsFor(49)).toBe(1)
    expect(pointsFor(50)).toBe(0)
    expect(pointsFor(59)).toBe(0)
    expect(pointsFor(60)).toBe(-1)
    expect(pointsFor(120)).toBe(-1)
  })

  it('steps the total cholesterol points at every published band edge', () => {
    const pointsFor = (totalCholesterolMgDl: number) =>
      framinghamBreakdown({ ...lowRiskMale, age: 45, totalCholesterolMgDl })
        .components.find(c => c.label === 'Colesterol total')?.points

    expect(pointsFor(159)).toBe(0)
    expect(pointsFor(160)).toBe(3)
    expect(pointsFor(199)).toBe(3)
    expect(pointsFor(200)).toBe(5)
    expect(pointsFor(239)).toBe(5)
    expect(pointsFor(240)).toBe(6)
    expect(pointsFor(279)).toBe(6)
    expect(pointsFor(280)).toBe(8)
  })

  it('throws CalcValidationError for out-of-range values', () => {
    expect(() => framinghamBreakdown({ ...lowRiskMale, age: 19 })).toThrow(CalcValidationError)
    expect(() => framinghamBreakdown({ ...lowRiskMale, sysBpMmhg: 50 })).toThrow(
      CalcValidationError,
    )
    expect(() => framinghamBreakdown({ ...lowRiskMale, hdlCholesterolMgDl: 5 })).toThrow(
      CalcValidationError,
    )
  })

  it('throws CalcValidationError for an unknown sex', () => {
    expect(() => framinghamBreakdown({ ...lowRiskMale, sex: 'X' as 'M' })).toThrow(
      CalcValidationError,
    )
  })
})

describe('calculateFramingham', () => {
  it('returns a moderate-risk result at 12%', () => {
    const result = calculateFramingham({
      age: 55,
      totalCholesterolMgDl: 220,
      hdlCholesterolMgDl: 45,
      sysBpMmhg: 140,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'M',
    })
    expect(result.label).toBe('Risco de DAC em 10 anos')
    expect(result.value).toBe(12)
    expect(result.unit).toBe('%')
    expect(result.severity).toBe('attention')
    expect(result.interpretation).toContain('Moderado risco')
  })

  it('returns normal severity below 10%', () => {
    const result = calculateFramingham(lowRiskMale)
    expect(Number(result.value)).toBeLessThan(10)
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('Baixo risco')
  })

  it('returns critical severity above 20%', () => {
    const result = calculateFramingham({
      age: 70,
      totalCholesterolMgDl: 290,
      hdlCholesterolMgDl: 25,
      sysBpMmhg: 190,
      smoker: true,
      diabetic: false,
      bpTreated: true,
      sex: 'M',
    })
    expect(Number(result.value)).toBeGreaterThan(20)
    expect(result.severity).toBe('critical')
    expect(result.interpretation).toContain('Alto risco')
  })

  it('reports diabetes as a flag rather than inventing a point value', () => {
    const result = calculateFramingham({ ...lowRiskMale, diabetic: true })
    const diabetes = result.subResults?.find(sub => sub.label === 'Diabetes')
    expect(diabetes?.value).toBe('Sim')
    expect(diabetes?.severity).toBe('attention')
    expect(diabetes?.interpretation).toContain('não é uma variável pontuada')
    expect(result.interpretation).toContain('ACC/AHA')
  })

  it('adds zero points for diabetes, keeping the risk unchanged', () => {
    const without = calculateFramingham(lowRiskMale)
    const with_ = calculateFramingham({ ...lowRiskMale, diabetic: true })
    expect(with_.value).toBe(without.value)
  })

  it('includes the point total and each factor as sub-results', () => {
    const result = calculateFramingham(lowRiskMale)
    const labels = result.subResults?.map(sub => sub.label)
    expect(labels).toContain('Total de pontos')
    expect(labels).toContain('Idade')
    expect(labels).toContain('Colesterol total')
    expect(labels).toContain('Colesterol HDL')
    expect(labels).toContain('Fumante atual')
  })

  it('reports a sub-1% risk as such in the interpretation', () => {
    const result = calculateFramingham({
      age: 30,
      totalCholesterolMgDl: 150,
      hdlCholesterolMgDl: 65,
      sysBpMmhg: 110,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'F',
    })
    expect(result.severity).toBe('normal')
    expect(result.interpretation).toContain('< 1%')
  })

  it('throws CalcValidationError for out-of-range inputs', () => {
    expect(() => calculateFramingham({ ...lowRiskMale, totalCholesterolMgDl: 99 })).toThrow(
      CalcValidationError,
    )
    expect(() => calculateFramingham({ ...lowRiskMale, age: 121 })).toThrow(CalcValidationError)
  })

  it('boundary: the risk table steps exactly at the published point totals', () => {
    // Age 60 = 10 points. Cholesterol 240 mg/dL (ages 60–69) = 2 → 12 points = 10%.
    // Cholesterol 280 mg/dL (ages 60–69) = 3 → 13 points = 12%.
    const twelve = { ...lowRiskMale, age: 60, totalCholesterolMgDl: 240 }
    const thirteen = { ...lowRiskMale, age: 60, totalCholesterolMgDl: 280 }

    expect(framinghamBreakdown(twelve).totalPoints).toBe(12)
    expect(framinghamBreakdown(twelve).riskPercent).toBe(10)
    expect(framinghamBreakdown(thirteen).totalPoints).toBe(13)
    expect(framinghamBreakdown(thirteen).riskPercent).toBe(12)
  })

  it('boundary: a risk of exactly 20% stays moderate, above 20% becomes high', () => {
    const at20 = calculateFramingham({
      age: 70,
      totalCholesterolMgDl: 240,
      hdlCholesterolMgDl: 45,
      sysBpMmhg: 150,
      smoker: false,
      diabetic: false,
      bpTreated: false,
      sex: 'M',
    })
    const above20 = calculateFramingham({
      age: 70,
      totalCholesterolMgDl: 290,
      hdlCholesterolMgDl: 30,
      sysBpMmhg: 160,
      smoker: true,
      diabetic: false,
      bpTreated: true,
      sex: 'M',
    })
    expect(at20.value).toBe(20)
    expect(at20.severity).toBe('attention')
    expect(Number(above20.value)).toBeGreaterThan(20)
    expect(above20.severity).toBe('critical')
  })
})