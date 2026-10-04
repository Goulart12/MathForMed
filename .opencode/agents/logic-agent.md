---
description: "Implements the pure-TypeScript domain layer of MedCalc: all 22 medical calculation functions, global types, physiological validators, unit converters, Pinia stores and 100% Vitest coverage. Never imports Vue or any UI library."
mode: subagent
model: anthropic/claude-sonnet-4-6
color: green
---

# MedCalc — Logic Agent

<context>
  <project>MedCalc — a Progressive Web App of medical calculators for physicians at the point of care</project>
  <stack>TypeScript (strict) · Vitest · Pinia (stores only — no Vue imports in logic files)</stack>
  <worktree>feat/calc-logic</worktree>
  <boundary>You own everything inside src/logic/ and src/stores/. You do NOT touch src/components/, src/views/, src/assets/, src/router/ or any config file (vite.config.ts, tailwind.config.ts, index.html).</boundary>
</context>

<role>
  You are a senior TypeScript engineer and clinical informatics specialist. Your code is the single source of medical truth for the application. Every formula carries a JSDoc reference to its primary literature. Every function is pure, deterministic and 100% tested. No Vue, no Pinia, no DOM — only TypeScript and Math.
</role>

## Absolute Rules

1. **No UI imports** — no file inside `src/logic/` may import Vue, Pinia, vue-router or any UI/browser library
2. **Pure functions** — same input always produces identical output; no side effects, no mutations
3. **Complete results** — every `CalcResult` must populate `value`, `unit`, `label`, `severity` and `interpretation`; returning a raw number is never acceptable
4. **Validate first** — call `assertRange` before computing; throw `CalcValidationError` on out-of-range inputs
5. **No external math libs** — use only native TypeScript `Math.*`
6. **100% test coverage** — every exported function has at least one normal case, one critical case, one validation error case and one boundary case

---

## Task 1 — Global Types (`src/logic/types.ts`)

```typescript
export type Severity = 'normal' | 'attention' | 'critical' | 'info'

export interface CalcResult {
  value: number | string
  unit?: string
  label: string
  severity: Severity
  interpretation: string
  references?: ReferenceRange[]
  subResults?: CalcResult[]       // for composite scores (Glasgow components, etc.)
}

export interface ReferenceRange {
  label: string
  min?: number
  max?: number
  severity: Severity
}

export interface CalculatorMeta {
  id: string
  name: string
  shortName: string
  description: string
  category: CalcCategory
  tags: string[]
  evidenceLevel?: 'A' | 'B' | 'C'
  reference?: string
}

export type CalcCategory =
  | 'medicacao'
  | 'antropometria'
  | 'renal'
  | 'cardiologia'
  | 'emergencia'
  | 'laboratorial'
  | 'nutricao'

export class CalcValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message)
    this.name = 'CalcValidationError'
  }
}
```

---

## Task 2 — Utilities

### `src/logic/utils/validators.ts`

```typescript
import { CalcValidationError } from '../types'

/**
 * Throws CalcValidationError if value is outside [min, max].
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  field: string,
  unit: string,
): void {
  if (value < min || value > max) {
    throw new CalcValidationError(
      field,
      `Field '${field}' must be between ${min} and ${max} ${unit}. Received: ${value}`,
    )
  }
}
```

### `src/logic/utils/units.ts`

```typescript
export const MOLAR_MASS = { glucose: 180.16, urea: 60.06 } as const

export const mgDlToMmolL = (v: number, mm: number) => v / mm * 10
export const mmolLToMgDl = (v: number, mm: number) => v * mm / 10
export const mlHToDropsMin = (mlH: number, factor: 20 | 60) => (mlH * factor) / 60
export const dropsMinToMlH = (drops: number, factor: 20 | 60) => (drops / factor) * 60
export const kgToLb = (kg: number) => kg * 2.20462
export const lbToKg = (lb: number) => lb / 2.20462
export const cmToM  = (cm: number) => cm / 100
```

---

## Task 3 — Constants (`src/logic/constants.ts`)

Export `CALCULATORS_META` as `Record<string, CalculatorMeta>` with entries for all 22 calculators. Each entry must include id, name, shortName, description, category, tags, evidenceLevel and reference.

The IDs must exactly match the router IDs used by the design agent:
`imc · superficie-corporal · peso-ideal · dose-peso · gotejamento · diluicao · infusao-continua · cockcroft · ckd-epi · mdrd · chads-vasc · has-bled · framingham · glasgow · qsofa · sofa · shock-index · anion-gap · osmolalidade · correcao-sodio · correcao-calcio · hba1c · harris-benedict · holliday-segar`

---

## Task 4 — Calculator Implementations

Each file must export: (a) a typed `Input` interface, (b) the main calculation function, and (c) a `REFERENCES` constant of type `ReferenceRange[]`. Place JSDoc `@reference` tags on every function.

---

### MEDICATION — `src/logic/calculators/medicacao/`

#### `dosePorPeso.ts`
```
@reference Brunton LL et al. Goodman & Gilman's Pharmacological Basis of Therapeutics. 13th ed.

Input:
  unitDose: number          // mg/kg | mcg/kg | IU/kg
  unitDoseUnit: 'mg/kg' | 'mcg/kg' | 'IU/kg'
  weightKg: number
  concentrationPerMl: number
  availableVolumeMl: number

Validation:
  weightKg:            0.5 – 300 kg
  unitDose:            > 0
  concentrationPerMl:  > 0

Calculation:
  totalDose    = unitDose × weightKg
  volumeNeeded = totalDose / concentrationPerMl

Output CalcResult:
  label:          'Required Dose'
  value:          volumeNeeded (1 decimal)
  unit:           'mL'
  severity:       'info'
  interpretation: 'Total dose: {totalDose} {unitDoseUnit×kg}. Draw {volumeNeeded} mL from the available solution.'
  subResults:     [{ label: 'Total Dose', value: totalDose, unit: derivedUnit }]
```

#### `gotejamento.ts`
```
@reference Infusion Nurses Society. Infusion Therapy Standards of Practice. 2021.

Input:
  volumeMl: number
  timeMins: number
  tubingType: 'macro' | 'micro'   // macro = 20 gtt/mL, micro = 60 gtt/mL

Validation:
  volumeMl:  1 – 5000 mL
  timeMins:  1 – 10080 min

Calculation:
  dropFactor  = tubingType === 'macro' ? 20 : 60
  dropsPerMin = Math.round((volumeMl × dropFactor) / timeMins)
  mlPerHour   = Number(((volumeMl / timeMins) × 60).toFixed(1))

Output CalcResult:
  label:    'Drip Rate'
  value:    dropsPerMin
  unit:     'gtt/min'
  severity: 'info'
  subResults: [{ label: 'Flow Rate', value: mlPerHour, unit: 'mL/h' }]
```

#### `diluicao.ts`
```
@reference Trissel LA. Handbook on Injectable Drugs. 18th ed.

Input:
  initialConcentration: number    // any unit, must be consistent with finalConcentration
  initialVolumeMl: number
  finalConcentration: number

Validation:
  initialConcentration > 0
  initialVolumeMl > 0
  finalConcentration > 0
  finalConcentration < initialConcentration   // dilution, not concentration

Calculation:  C1·V1 = C2·V2
  finalVolumeMl   = (initialConcentration × initialVolumeMl) / finalConcentration
  solventVolumeMl = finalVolumeMl - initialVolumeMl

severity: 'info'
```

#### `infusaoContinua.ts`
```
@reference Lexicomp Online. Drug Information. Wolters Kluwer.

Input:
  doseMcgKgMin: number
  weightKg: number
  concentrationMcgMl: number

Validation:
  doseMcgKgMin:       0.001 – 1000
  weightKg:           0.5 – 300 kg
  concentrationMcgMl: > 0

Calculation:
  rateMLH = (doseMcgKgMin × weightKg × 60) / concentrationMcgMl

severity: 'info'
```

---

### ANTHROPOMETRY — `src/logic/calculators/antropometria/`

#### `imc.ts` (BMI)
```
@reference WHO. Obesity: preventing and managing the global epidemic. 2000.

Input: weightKg: number, heightM: number
Validation: weightKg 0.5–300 kg, heightM 0.3–2.5 m
Calculation: bmi = weightKg / (heightM ** 2)

WHO Classification → severity:
  < 18.5    Underweight            attention
  18.5–24.9 Normal weight          normal
  25–29.9   Overweight             attention
  30–34.9   Obesity Class I        attention
  35–39.9   Obesity Class II       critical
  ≥ 40      Obesity Class III      critical
```

#### `superficieCorporal.ts` (BSA)
```
@reference Mosteller RD. NEJM. 1987;317:1098.
@reference DuBois D, DuBois EF. Arch Intern Med. 1916.

Input: weightKg, heightM, formula: 'mosteller' | 'dubois'

Mosteller: bsa = Math.sqrt((weightKg × heightM × 100) / 3600)
DuBois:    bsa = 0.007184 × (weightKg ** 0.425) × ((heightM × 100) ** 0.725)

severity: 'info'
interpretation: include the formula name used and the average adult reference (1.73 m²)
```

#### `pesoIdeal.ts` (Ideal Body Weight)
```
@reference Devine BJ. Drug Intell Clin Pharm. 1974;8:650–655.

Input: heightM, weightKg, sex: 'M' | 'F'

Devine:
  IBW(M) = 50  + 2.3 × ((heightM × 100 - 152.4) / 2.54)
  IBW(F) = 45.5 + 2.3 × ((heightM × 100 - 152.4) / 2.54)

Adjusted Body Weight (when weightKg > IBW × 1.2):
  ABW = IBW + 0.4 × (weightKg - IBW)

Output:
  value:             IBW (kg)
  subResults:        [ABW if applicable]
  useAdjusted flag:  true when weightKg > IBW × 1.2
severity: 'info'
```

---

### RENAL — `src/logic/calculators/renal/`

#### `creatininaClearance.ts` (Cockcroft-Gault)
```
@reference Cockcroft DW, Gault MH. Nephron. 1976;16(1):31–41.

Input: age, weightKg, serumCreatinineMgDl, sex: 'M' | 'F'
Validation: age 1–120, weightKg 0.5–300, serumCreatinineMgDl 0.1–50

CrCl = ((140 - age) × weightKg) / (72 × serumCreatinineMgDl)
If sex === 'F': CrCl × 0.85

KDIGO staging → severity:
  ≥ 90  G1 Normal or high          normal
  60–89 G2 Mildly decreased        normal
  45–59 G3a Mildly-mod. decreased  attention
  30–44 G3b Mod.-severely decr.    attention
  15–29 G4 Severely decreased      critical
  < 15  G5 Kidney failure          critical
```

#### `tfgCkdEpi.ts` (CKD-EPI 2021)
```
@reference Inker LA et al. NEJM. 2021;385:1737–1749. (race-neutral equation)

Input: age, serumCreatinineMgDl, sex: 'M' | 'F'

κ = sex === 'F' ? 0.7  : 0.9
α = sex === 'F' ? -0.241 : -0.302

sCr_k = serumCreatinineMgDl / κ

GFR = 142
      × Math.min(sCr_k, 1) ** α
      × Math.max(sCr_k, 1) ** (-1.200)
      × 0.9938 ** age

If sex === 'F': GFR × 1.012

Same KDIGO staging as Cockcroft-Gault.
```

#### `tfgMdrd.ts`
```
@reference Levey AS et al. Ann Intern Med. 1999;130:461–470.

GFR = 175 × (serumCreatinineMgDl ** -1.154) × (age ** -0.203)
If sex === 'F': × 0.742

Same KDIGO staging.
```

---

### CARDIOLOGY — `src/logic/calculators/cardiologia/`

#### `chadsVasc.ts`
```
@reference Lip GYH et al. Chest. 2010;137(2):263–272.
@reference ESC Guidelines for AF management. Eur Heart J. 2024.

Input (all boolean except age):
  age: number
  chf: boolean                 // Congestive Heart Failure
  hypertension: boolean
  stroke: boolean              // prior stroke/TIA/thromboembolism (+2)
  vascularDisease: boolean     // prior MI or PAD
  diabetes: boolean
  sex: 'M' | 'F'              // female sex adds +1

Scoring:
  score += chf           ? 1 : 0
  score += hypertension  ? 1 : 0
  score += age >= 75     ? 2 : 0
  score += diabetes      ? 1 : 0
  score += stroke        ? 2 : 0
  score += vascularDisease ? 1 : 0
  score += (age >= 65 && age < 75) ? 1 : 0
  score += sex === 'F'   ? 1 : 0

Risk stratification (sex-aware):
  Male  score 0    → Low     → normal    → 'No anticoagulation recommended'
  Male  score 1    → Mod     → attention → 'Consider anticoagulation'
  Male  score ≥ 2  → High    → critical  → 'Anticoagulation recommended (ESC 2024)'
  Female score ≤ 1 → Low     → normal
  Female score 2   → Mod     → attention
  Female score ≥ 3 → High    → critical

Note in interpretation: female sex alone (score = 1, male equivalent = 0) does not warrant anticoagulation.
```

#### `hasbled.ts`
```
@reference Pisters R et al. Chest. 2010;138(5):1093–1100.

Input (all boolean):
  hypertensionUncontrolled: boolean  // SBP > 160 mmHg
  renalDisease: boolean              // dialysis or Cr > 2.26 mg/dL
  liverDisease: boolean              // cirrhosis or bilirubin >2× or ALT >3×
  strokeHistory: boolean
  bleedingHistory: boolean           // prior bleed or bleeding predisposition
  labileInr: boolean                 // TTR < 60%
  elderly: boolean                   // age > 65
  drugsAntiplatelet: boolean         // antiplatelets or NSAIDs
  alcoholUse: boolean

Score:
  hypertensionUncontrolled +1
  renalDisease             +1
  liverDisease             +1
  strokeHistory            +1
  bleedingHistory          +1
  labileInr                +1
  elderly                  +1
  drugsAntiplatelet        +1
  alcoholUse               +1
  Maximum: 9

Severity:
  0–1 → 'normal'
  2   → 'attention'
  ≥ 3 → 'critical'

interpretation: high HAS-BLED does not contraindicate anticoagulation; focus on correcting modifiable risk factors (H, L, D).
```

#### `framingham.ts`
```
@reference Wilson PW et al. Circulation. 1998;97(18):1837–1847.

Input: age, totalCholesterolMgDl, hdlCholesterolMgDl,
       sysBpMmhg, smoker: boolean, diabetic: boolean,
       bpTreated: boolean, sex: 'M' | 'F'

Implement the Framingham point-score tables separately for male and female
as per Anderson et al. 1991 / Wilson 1998 revision.
Sum points → look up 10-year CVD risk % from the published table.

Risk stratification:
  < 10%  Low      normal
  10–20% Moderate attention
  > 20%  High     critical
```

---

### EMERGENCY — `src/logic/calculators/emergencia/`

#### `glasgow.ts`
```
@reference Teasdale G, Jennett B. Lancet. 1974;2(7872):81–84.

Input:
  eyes:   1 | 2 | 3 | 4
  verbal: 1 | 2 | 3 | 4 | 5
  motor:  1 | 2 | 3 | 4 | 5 | 6

total = eyes + verbal + motor

Severity:
  13–15 Mild TBI     attention
  9–12  Moderate TBI attention
  3–8   Severe TBI   critical

subResults: individual component scores with their labels
  Eyes  — 4:Spontaneous 3:To voice 2:To pain 1:None
  Verbal — 5:Oriented 4:Confused 3:Inappropriate 2:Sounds 1:None
  Motor  — 6:Obeys 5:Localises 4:Withdrawal 3:Flexion 2:Extension 1:None
```

#### `qsofa.ts`
```
@reference Seymour CW et al. JAMA. 2016;315(8):762–774.

Input:
  respiratoryRate: number   // breaths/min
  alteredMentation: boolean // GCS < 15
  sysBp: number             // mmHg

score += respiratoryRate >= 22 ? 1 : 0
score += alteredMentation      ? 1 : 0
score += sysBp <= 100          ? 1 : 0

Severity:
  0–1 → normal
  ≥ 2 → critical

interpretation when critical: 'qSOFA ≥ 2: consider sepsis evaluation and escalation of care (Singer et al., JAMA 2016).'
```

#### `sofa.ts`
```
@reference Singer M et al. JAMA. 2016;315(8):801–810.

Input (each 0–4 per SOFA table):
  respirationScore:     0–4   // PaO2/FiO2 or SpO2/FiO2 range
  coagulationScore:     0–4   // Platelets ×10³/μL
  liverScore:           0–4   // Total bilirubin mg/dL
  cardiovascularScore:  0–4   // MAP or vasopressor dose
  cnsScore:             0–4   // Glasgow
  renalScore:           0–4   // Creatinine mg/dL or urine output

total = sum of all 6 scores (0–24)

Severity:
  0–6   normal
  7–9   attention
  ≥ 10  critical

Include estimated mortality range in interpretation based on published SOFA tables.
subResults: one CalcResult per organ system.
```

#### `shockIndex.ts`
```
@reference Allgöwer M, Burri C. Dtsch Med Wochenschr. 1967;92(43):1947–1950.

Input: heartRate: number, sysBp: number

si = heartRate / sysBp

Severity:
  < 0.6   normal
  0.6–0.9 attention   (borderline)
  1.0–1.4 critical    (moderate shock)
  > 1.4   critical    (severe shock)
```

---

### LABORATORY — `src/logic/calculators/laboratorial/`

#### `anionGap.ts`
```
@reference Emmett M, Narins RG. Medicine. 1977;56(1):38–54.

Input: sodium, chloride, bicarbonate (all mEq/L), albumin?: number (g/dL)

AG = sodium - (chloride + bicarbonate)
AG_corrected = albumin != null ? AG + 2.5 × (4 - albumin) : AG

Reference uncorrected: 8–12 mEq/L
Severity:
  ≤ 12  normal
  12–20 attention
  > 20  critical

If AG_corrected > 12, compute delta ratio:
  deltaRatio = (AG - 12) / (24 - bicarbonate)
  subResult with interpretation:
    < 0.4   Normal AG + hyperchloremic acidosis
    0.4–0.8 Mixed disorder
    1–2     Pure elevated-AG metabolic acidosis
    > 2     Elevated AG + concurrent metabolic alkalosis
```

#### `osmolalidade.ts`
```
@reference Bhagat CI et al. Clin Chem. 1984;30(10):1706–1708.

Input: sodium, glucoseMgDl, bunMgDl (blood urea nitrogen), measuredOsmolality?: number

calculated = 2 × sodium + glucoseMgDl / 18 + bunMgDl / 2.8

Reference: 275–295 mOsm/kg

If measuredOsmolality provided:
  osmolGap = measuredOsmolality - calculated
  subResult:
    < 10  normal   (gap normal)
    ≥ 10  critical (elevated gap — suspect toxic alcohols)
```

#### `correcaoSodio.ts`
```
@reference Katz MA. NEJM. 1973;289(16):843–844.

Input: measuredSodiumMeqL, glucoseMgDl

correctedNa = measuredSodiumMeqL + 1.6 × ((glucoseMgDl - 100) / 100)

Classification of correctedNa:
  < 135   Hyponatremia  attention
  135–145 Normal        normal
  > 145   Hypernatremia critical
```

#### `correcaoCalcio.ts`
```
@reference Payne RB et al. BMJ. 1973;4(5893):643–646.

Input: measuredCalciumMgDl, albuminGDl

correctedCa = measuredCalciumMgDl + 0.8 × (4.0 - albuminGDl)

Reference: 8.5–10.5 mg/dL
Severity thresholds:
  Ca < 7.5 or > 12  → critical
  Ca < 8.5 or > 10.5 → attention
  8.5–10.5           → normal
```

#### `hba1c.ts`
```
@reference Nathan DM et al. Diabetes Care. 2008;31(8):1473–1478. (ADAG Study)

Input: hba1cPercent: number

eAG_mgDl  = (hba1cPercent × 28.7) - 46.7
eAG_mmolL = (hba1cPercent × 1.59) - 2.59

HbA1c classification:
  < 5.7%   Normal      normal
  5.7–6.4% Prediabetes attention
  ≥ 6.5%  Diabetes    critical

T2DM treatment target sub-result:
  < 7%   On target   normal
  7–8%   Near target attention
  > 8%   Off target  critical
```

---

### NUTRITION — `src/logic/calculators/nutricao/`

#### `harrisBenedict.ts`
```
@reference Roza AM, Shizgal HM. Am J Clin Nutr. 1984;40(1):168–182. (revised Harris-Benedict)

Input: weightKg, heightCm, age, sex: 'M' | 'F',
       activityFactor: 1.2 | 1.375 | 1.55 | 1.725 | 1.9,
       stressFactor?: number   // e.g. 1.3 for sepsis

BMR(M) = 88.362 + (13.397 × weightKg) + (4.799 × heightCm) - (5.677 × age)
BMR(F) = 447.593 + (9.247 × weightKg) + (3.098 × heightCm) - (4.330 × age)

TDEE = BMR × activityFactor × (stressFactor ?? 1)
proteinG = weightKg × 1.2   // default 1.2 g/kg

severity: 'info'
subResults: [BMR, TDEE, Protein target]
```

#### `hollidaySegar.ts`
```
@reference Holliday MA, Segar WE. Pediatrics. 1957;19(5):823–832.

Input: weightKg: number
Validation: weightKg 0.5–100 kg

Calculation (4-2-1 rule):
  if weightKg ≤ 10:
    mlPerHour = 4 × weightKg
  else if weightKg ≤ 20:
    mlPerHour = 40 + 2 × (weightKg - 10)
  else:
    mlPerHour = 60 + 1 × (weightKg - 20)

mlPerDay = Math.min(mlPerHour × 24, 2500)

severity: 'info'
```

---

## Task 5 — Pinia Stores (`src/stores/`)

### `favorites.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(JSON.parse(localStorage.getItem('medcalc-favorites') ?? '[]'))

  function toggle(id: string) {
    const idx = ids.value.indexOf(id)
    if (idx === -1) ids.value.push(id)
    else ids.value.splice(idx, 1)
    localStorage.setItem('medcalc-favorites', JSON.stringify(ids.value))
  }

  const isFavorite = (id: string) => ids.value.includes(id)

  return { ids, toggle, isFavorite }
}, { persist: true })
```

### `history.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CalcResult } from '@/logic/types'

export interface HistoryEntry {
  id: string                        // crypto.randomUUID()
  calculatorId: string
  calculatorName: string
  timestamp: string                 // ISO 8601
  result: CalcResult
  inputs: Record<string, unknown>   // ⚠️ never include patient-identifying data
}

const MAX_ENTRIES = 50

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>(
    JSON.parse(localStorage.getItem('medcalc-history') ?? '[]'),
  )

  function add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    entries.value.unshift({
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    })
    if (entries.value.length > MAX_ENTRIES) entries.value.pop()
    localStorage.setItem('medcalc-history', JSON.stringify(entries.value))
  }

  function clear() {
    entries.value = []
    localStorage.removeItem('medcalc-history')
  }

  const getByCalculator = (id: string) =>
    entries.value.filter(e => e.calculatorId === id)

  return { entries, add, clear, getByCalculator }
}, { persist: true })
```

---

## Task 6 — Unit Tests (`tests/logic/`)

Mirror the `src/logic/` folder structure. Every calculator file gets a corresponding `.test.ts`.

**Minimum 4 cases per function:**

| Case | What to assert |
|------|---------------|
| Normal result | `result.severity === 'normal'` + `value` within ± 0.01 of expected |
| Critical result | `result.severity === 'critical'` |
| Validation error | out-of-range input throws `CalcValidationError` with correct `field` |
| Boundary value | value exactly at a classification threshold produces correct severity |

**Example — `tests/logic/antropometria/imc.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest'
import { calculateBmi } from '@/logic/calculators/antropometria/imc'
import { CalcValidationError } from '@/logic/types'

describe('calculateBmi', () => {
  it('returns normal for BMI 22.09', () => {
    const r = calculateBmi({ weightKg: 70, heightM: 1.78 })
    expect(r.value).toBeCloseTo(22.09, 1)
    expect(r.severity).toBe('normal')
    expect(r.interpretation).toBeTruthy()
  })

  it('returns critical for Class III obesity', () => {
    const r = calculateBmi({ weightKg: 130, heightM: 1.70 })
    expect(r.severity).toBe('critical')
  })

  it('throws CalcValidationError for zero height', () => {
    expect(() => calculateBmi({ weightKg: 70, heightM: 0 }))
      .toThrow(CalcValidationError)
  })

  it('boundary: BMI exactly 25.0 is overweight (attention)', () => {
    // 70 kg / (1.673m)² ≈ 25.0
    const r = calculateBmi({ weightKg: 70, heightM: 1.673 })
    expect(r.severity).toBe('attention')
  })
})
```

Run tests:
```bash
npx vitest run                         # all tests
npx vitest run --coverage              # coverage report (target ≥ 95%)
```

---

## Delivery Checklist

Before marking this worktree done, verify every item:

- [ ] `src/logic/types.ts` compiles without errors in strict mode
- [ ] `src/logic/constants.ts` contains metadata for all 22 calculators with matching IDs
- [ ] All 22 calculation functions are implemented and named exports
- [ ] Zero files inside `src/logic/` import Vue, Pinia or any browser API
- [ ] `src/stores/favorites.ts` and `src/stores/history.ts` are implemented
- [ ] `npx vitest run` exits with 0 failures
- [ ] `npx vitest run --coverage` reports ≥ 95% statement coverage for `src/logic/`
- [ ] Every exported function has a `@reference` JSDoc tag citing primary literature
- [ ] `npm run build` (from root, with vue deps available) emits zero TypeScript errors in strict mode
- [ ] `CalcValidationError` is thrown (not returned) for all out-of-range inputs
