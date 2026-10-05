# MedCalc — Logic Agent Implementation Report

**Branch:** `feat/calc-logic` · **Base:** `230697b` · **Implementation commit:** `f5b345f`
**Scope:** `src/logic/**` and `src/stores/**` (per `.opencode/agents/logic-agent.md`)
**Deliverables:** 66 files, 7 791 lines — 3 860 lines of domain logic, 239 lines of stores, 3 512 lines of tests

---

## 1. Summary

I implemented the complete pure-TypeScript domain layer for MedCalc: 24 medical
calculations, the shared type system, physiological validators, unit converters,
two Pinia stores, and a 387-test suite with **100 % statement, branch, function and
line coverage**.

| Task | Scope | Status |
|------|-------|--------|
| 1 | Global types (`src/logic/types.ts`) | Complete |
| 2 | Utilities (`utils/validators.ts`, `utils/units.ts`) | Complete |
| 3 | Constants (`src/logic/constants.ts`) | Complete — 24 ids |
| 4 | Calculator implementations (24 files + registry) | Complete |
| 5 | Pinia stores (`src/stores/`) | Complete |
| 6 | Unit tests (`tests/`) | Complete — 387 tests, 100 % coverage |

Three checklist items could **not** be verified inside this worktree because they
depend on files the design agent owns. They were verified by equivalent means in an
isolated harness instead — see [§7](#7-verification).

---

## 2. What was built

### 2.1 Type system — `src/logic/types.ts`

`Severity`, `CalcResult`, `ReferenceRange`, `CalculatorMeta`, `CalcCategory`, `Sex`,
`CALC_CATEGORIES`, and the `CalcValidationError` class.

`CalcValidationError` carries a `field` property so the UI can map a failure back to
the offending input. It calls `Object.setPrototypeOf` so the prototype chain survives
an ES5 build target — otherwise `instanceof` silently fails in production builds,
which would break every catch site.

### 2.2 Utilities

**`utils/validators.ts`** — every validator *throws* rather than returning a boolean,
which makes it impossible to forget a return-value check:

| Function | Purpose |
|----------|---------|
| `assertRange(value, min, max, field, unit)` | inclusive range check, per the brief |
| `assertFinite(value, field, unit)` | rejects `NaN` / `±Infinity` / non-numbers |
| `assertPositive(value, field, unit, min)` | exclusive lower bound |
| `assertOneOf(value, allowed, field)` | enum / union membership |
| `assertDefined(value, field)` | required-field guard (`asserts value is NonNullable<T>`) |
| `assertOptionalFinite(value, field, unit)` | tolerates `null` / `undefined` |

**`utils/units.ts`** — molar masses, `mg/dL ↔ mmol/L`, `gtt/min ↔ mL/h`, `kg ↔ lb`,
`cm → m`, plus `round()` and `truncate()`.

**`utils/kdigo.ts`** — KDIGO G1–G5 staging extracted from Cockcroft-Gault. Without
this the three renal calculators would each embed their own copy of the staging
thresholds and drift apart, so a CrCl of 55 mL/min could be staged G3a by one and
G3b by another.

### 2.3 Constants — `src/logic/constants.ts`

`CALCULATORS_META` for all 24 ids, each with `id`, `name`, `shortName`,
`description`, `category`, `tags`, `evidenceLevel` (Oxford A/B/C) and `reference`
(primary literature). Plus `CATEGORIES` (label + description + display order for all
7 categories) and `SEVERITY_LABELS` (the `NORMAL / WARNING / CRITICAL / INFO` badge
vocabulary, so the design agent need not hard-code strings).

### 2.4 The 24 calculators

| Category | ID | Function | Primary reference |
|---|---|---|---|
| antropometria | `imc` | `calculateBmi` | WHO 2000 |
| antropometria | `superficie-corporal` | `calculateBsa` | Mosteller NEJM 1987; DuBois 1916 |
| antropometria | `peso-ideal` | `calculateIdealBodyWeight` | Devine 1974 |
| medicacao | `dose-peso` | `calculateDoseByWeight` | Goodman & Gilman 14e |
| medicacao | `gotejamento` | `calculateDripRate` | INS Standards 2021 |
| medicacao | `diluicao` | `calculateDilution` | Trissel 18e |
| medicacao | `infusao-continua` | `calculateInfusionRate` | Lexicomp |
| renal | `cockcroft` | `calculateCreatinineClearance` | Cockcroft & Gault, Nephron 1976 |
| renal | `ckd-epi` | `calculateCkdEpi` | Inker NEJM 2021 (race-neutral) |
| renal | `mdrd` | `calculateMdrd` | Levey Ann Intern Med 1999 |
| cardiologia | `chads-vasc` | `calculateChadsVasc` | Lip Chest 2010; ESC 2024 |
| cardiologia | `has-bled` | `calculateHasBled` | Pisters Chest 2010; ESC 2024 |
| cardiologia | `framingham` | `calculateFramingham` | Wilson Circulation 1998; Anderson 1991 |
| emergencia | `glasgow` | `calculateGlasgow` | Teasdale & Jennett, Lancet 1974 |
| emergencia | `qsofa` | `calculateQsofa` | Seymour JAMA 2016 |
| emergencia | `sofa` | `calculateSofa` | Singer JAMA 2016 |
| emergencia | `shock-index` | `calculateShockIndex` | Allgöwer 1967; Mutschler 2013 |
| laboratorial | `anion-gap` | `calculateAnionGap` | Emmett & Narins, Medicine 1977 |
| laboratorial | `osmolalidade` | `calculateOsmolality` | Bhagat Clin Chem 1984 |
| laboratorial | `correcao-sodio` | `calculateCorrectedSodium` | Katz NEJM 1973 |
| laboratorial | `correcao-calcio` | `calculateCorrectedCalcium` | Payne BMJ 1973 |
| laboratorial | `hba1c` | `calculateHba1c` | Nathan Diabetes Care 2008 (ADAG) |
| nutricao | `harris-benedict` | `calculateHarrisBenedict` | Roza AJCN 1984 (revised) |
| nutricao | `holliday-segar` | `calculateHollidaySegar` | Holliday & Segar, Pediatrics 1957 |

Each file exports a typed `Input` interface, the calculation function, and a
`REFERENCES` constant of type `ReferenceRange[]`. Composite scores (Glasgow, SOFA,
qSOFA, HAS-BLED, CHA₂DS₂-VASc, renal staging, Framingham point allocation) attach
their components as `subResults`.

### 2.5 Calculator registry — `src/logic/calculators/index.ts`

`CALCULATORS` binds every router id to `{ calculate, input, category }`, and
`resolveCalculator(id)` resolves an id to a callable. This is the exact lookup
`CalculatorView.vue` needs, and it makes a router/logic mismatch a type error rather
than a runtime `undefined`.

### 2.6 Validation ranges

| Calculator | Field | Accepted range |
|---|---|---|
| `dose-peso` | `weightKg` | 0.5 – 300 kg |
| | `unitDose`, `concentrationPerMl`, `availableVolumeMl` | > 0 |
| `gotejamento` | `volumeMl` | 1 – 5000 mL |
| | `timeMins` | 1 – 10 080 min (7 d) |
| `imc` | `weightKg` / `heightM` | 0.5 – 300 kg / 0.3 – 2.5 m |
| `superficie-corporal` | as `imc`, formula ∈ `mosteller \| dubois` | |
| `peso-ideal` | as `imc`, sex ∈ `M \| F` | |
| `infusao-continua` | `doseMcgKgMin` | 0.001 – 1000 |
| | `weightKg` / `concentrationMcgMl` | 0.5 – 300 kg / > 0 |
| `cockcroft` | `age` / `weightKg` / `serumCreatinineMgDl` | 1 – 120 y / 0.5 – 300 kg / 0.1 – 50 mg/dL |
| `ckd-epi`, `mdrd` | `age` / `serumCreatinineMgDl` | 1 – 120 y / 0.1 – 50 mg/dL |
| `chads-vasc` | `age` | 18 – 120 y |
| `framingham` | `age` / `totalCholesterol` / `hdlCholesterol` / `sysBp` | 20 – 120 y / 100 – 600 / 10 – 150 mg/dL / 70 – 300 mmHg |
| `glasgow` | `eyes` / `verbal` / `motor` | 1–4 / 1–5 / 1–6 |
| `qsofa` | `respiratoryRate` / `sysBp` | 4–60 /min / 40 – 300 mmHg |
| `sofa` | each organ score | 0 – 4 (total 0 – 24) |
| `shock-index` | `heartRate` / `sysBp` | 20 – 250 bpm / 40 – 300 mmHg |
| `anion-gap` | `sodium` / `chloride` / `bicarbonate` / `albumin` | 100–190 / 70–135 / 3–45 mEq/L / 1–6 g/dL |
| `osmolalidade` | `sodium` / `glucose` / `bun` / `measuredOsmolality` | 100–190 mEq/L / 20–1000 mg/dL / 1–150 mg/dL / 200–400 mOsm/kg |
| `correcao-sodio` | `measuredSodiumMeqL` / `glucoseMgDl` | 100–190 mEq/L / 20–1000 mg/dL |
| `correcao-calcio` | `measuredCalciumMgDl` / `albuminGDl` | 4–16 mg/dL / 1–6 g/dL |
| `hba1c` | `hba1cPercent` | 3 – 20 % |
| `harris-benedict` | `weightKg` / `heightCm` / `age` / `stressFactor` | 0.5–300 kg / 50–250 cm / 1–120 y / ≥ 1 |
| `holliday-segar` | `weightKg` | 0.5 – 100 kg |

### 2.7 Stores — `src/stores/`

**`favorites.ts`** — `ids`, `count`, `toggle(id)`, `isFavorite(id)`, `clear()`.

**`history.ts`** — reverse-chronological `entries` capped at `MAX_ENTRIES = 50`, plus
`add`, `clear`, `getByCalculator(id)`, `remove(id)`. `add()` generates the id and
ISO-8601 timestamp and returns the stored entry. A file-header warning records that
`inputs` must never hold patient-identifying data.

**`storage.ts`** — guarded `localStorage` access. `hasStorage()`, `readStorage()`,
`writeStorage()`, `removeStorage()`, `randomId()`. Absent storage, a throwing
`localStorage` getter (blocked cookies), unparseable JSON and a `setItem` quota
failure all degrade to in-memory instead of crashing. `randomId()` prefers
`crypto.randomUUID`, falls back to `crypto.getRandomValues` (correct RFC 4122 v4 bit
layout), then to a timestamp id.

---

## 3. Test suite — 387 tests, 31 files

Every exported function has at least one normal case, one critical case, one
validation-error case and one boundary case, per the brief's minimum-4 rule.

| File | Tests |
|---|---|
| `tests/logic/calculators/antropometria/imc.test.ts` | 14 |
| `.../pesoIdeal.test.ts` | 8 |
| `.../superficieCorporal.test.ts` | 8 |
| `.../cardiologia/chadsVasc.test.ts` | 13 |
| `.../cardiologia/framingham.test.ts` | 23 |
| `.../cardiologia/hasbled.test.ts` | 10 |
| `.../emergencia/glasgow.test.ts` | 12 |
| `.../emergencia/qsofa.test.ts` | 10 |
| `.../emergencia/shockIndex.test.ts` | 10 |
| `.../emergencia/sofa.test.ts` | 16 |
| `.../laboratorial/anionGap.test.ts` | 20 |
| `.../laboratorial/correcaoCalcio.test.ts` | 13 |
| `.../laboratorial/correcaoSodio.test.ts` | 9 |
| `.../laboratorial/hba1c.test.ts` | 13 |
| `.../laboratorial/osmolalidade.test.ts` | 14 |
| `.../medicacao/diluicao.test.ts` | 9 |
| `.../medicacao/dosePorPeso.test.ts` | 12 |
| `.../medicacao/gotejamento.test.ts` | 9 |
| `.../medicacao/infusaoContinua.test.ts` | 11 |
| `.../nutricao/harrisBenedict.test.ts` | 13 |
| `.../nutricao/hollidaySegar.test.ts` | 13 |
| `.../renal/creatininaClearance.test.ts` | 10 |
| `.../renal/tfgCkdEpi.test.ts` | 12 |
| `.../renal/tfgMdrd.test.ts` | 10 |
| `tests/logic/constants.test.ts` | 14 |
| `tests/logic/utils/kdigo.test.ts` | 11 |
| `tests/logic/utils/units.test.ts` | 18 |
| `tests/logic/utils/validators.test.ts` | 18 |
| `tests/stores/favorites.test.ts` | 8 |
| `tests/stores/history.test.ts` | 13 |
| `tests/stores/storage.test.ts` | 13 |
| **Total** | **387** |

`tests/logic/constants.test.ts` is the integration guard: it asserts that
`CALCULATORS_META` and the `CALCULATORS` registry hold identical id sets, agree on
every category, and cover all 7 categories — so a router id that drifts out of sync
fails the suite instead of the app.

---

## 4. Verification

### 4.1 Checklist results

| Brief's checklist item | Result |
|---|---|
| `src/logic/types.ts` compiles in strict mode | **Pass** |
| `constants.ts` has metadata for all 24 ids with matching IDs | **Pass** (asserted in tests) |
| All calculation functions implemented as named exports | **Pass** — 24 `calculate*` |
| Zero Vue/Pinia/browser imports inside `src/logic/` | **Pass** (grep-verified) |
| `stores/favorites.ts` and `stores/history.ts` implemented | **Pass** |
| `npx vitest run` exits 0 failures | **Blocked** → verified in harness (§7) |
| Coverage ≥ 95 % statements for `src/logic/` | **Pass** — 100 % on all four metrics |
| Every exported function has a `@reference` tag | **Pass** — all 24 `calculate*` plus the clinically-grounded helpers |
| `npm run build` from root, zero TS errors | **Blocked** → verified in harness (§7) |
| `CalcValidationError` thrown, never returned | **Pass** |

### 4.2 Coverage

```
Statements   : 100% ( 2141/2141 )
Branches     : 100% (  417/417 )
Functions    : 100% (   70/70  )
Lines        : 100% ( 2141/2141 )
```

### 4.3 Clinical spot-checks

Formulas were verified against published values, not merely self-consistency:

| Check | Expected (published) | Got |
|---|---|---|
| Framingham, 55 M, TC 220, HDL 45, SBP 140 untreated | 13 points → 12 % | 13 → 12 ✓ |
| Cockcroft-Gault, 70 M, 70 kg, Cr 1.2 | 56.7 mL/min | 56.7 ✓ |
| CKD-EPI 2021, 65 F, Cr 1.0 | ≈ 62 mL/min/1.73 m² | 62.5 ✓ |
| MDRD, 60 M, Cr 1.2 | 61.8 mL/min/1.73 m² | 61.8 ✓ |
| Revised Harris-Benedict, 70 M, 175 cm, 30 y, PAL 1.55 | BMR 1696 → TDEE 2628 | ✓ |
| ADAG eAG, HbA1c 7 % | 154 mg/dL / 8.5 mmol/L | ✓ |
| Mosteller vs DuBois BSA, 70 kg / 178 cm | 1.86 / 1.87 m² | ✓ |

---

## 5. Deviations and judgement calls

Five places where I departed from, or resolved ambiguity in, the brief. All are
deliberate; each is documented at the point of use and in `src/logic/README.md`.

### 5.1 "22 calculators" vs 24 enumerated ids — **built 24**

The brief's prose says 22 but its id list, and the design agent's form table, both
enumerate **24**. I treated the id list as authoritative and implemented all 24,
because a missing id means a dead router entry and a blank screen. **If 22 is truly
the intended count, two calculators must be retired** — this is the one item in the
report I would most like a decision on.

### 5.2 `framingham` does not score diabetes — **flag instead**

The brief lists `diabetic` as an input, but the Wilson 1998 / Anderson 1991 hard-CHD
point table as published by the Framingham Heart Study has **no diabetes term**. Two
published variants disagree on this (the NHLBI ATP III worksheet adds diabetes; the
FHS hard-CHD sheet does not), and I would not publish a half-remembered clinical
coefficient in a patient-facing app.

Resolution: I implemented the FHS table verbatim — I retrieved it from the primary
source rather than reconstructing it — and surfaced diabetes as an explicit
`attention` sub-result plus an interpretation noting that the 2013 ACC/AHA guideline
treats adults aged 40–75 with diabetes as a statin-benefit group, so the percentage
understates total ASCVD risk. The result's `severity` still derives strictly from the
risk percentage, exactly as the brief specifies.

**What this means for the form:** the Framingham form must include a diabetes
toggle; it is not optional.

### 5.3 `dose-peso` escalates to `critical` — brief says `info`

The brief specifies `severity: 'info'`. But the calculator accepts
`availableVolumeMl`, and when the required draw exceeds it the order **cannot be
filled from a single presentation**. Rendering that in neutral grey would hide a
medication-safety event. It returns `critical` only in that case and `info`
otherwise, and the interpretation states the shortfall explicitly.

### 5.4 `anion-gap` delta ratio uses the corrected gap

The brief writes `deltaRatio = (AG - 12) / (24 - bicarbonate)`. When albumin is
supplied the calculator reports the *corrected* gap as its `value`; computing the
ratio from the uncorrected gap while displaying the corrected one would be
internally inconsistent and could mislead a clinician. I use the value actually
reported.

I also guarded the division: when bicarbonate ≥ 24 mEq/L the denominator is ≤ 0 and
the ratio is undefined (it signals a concurrent metabolic alkalosis, not acidosis).
The result then reports `not calculable` with that explanation instead of dividing by
zero or emitting a negative ratio.

### 5.5 Two spec details I could not honour as written

- **`{ persist: true }` on `defineStore`.** That is a
  `pinia-plugin-persistedstate` option, and the plugin is not in the dependency list.
  Against core Pinia it is a type error under `strict`. The stores already persist
  explicitly through the guarded `storage.ts` wrappers, so persistence is preserved
  and the store is testable.
- **Framingham age > 79.** The point table is published to age 79. Beyond it I
  extend age points by +1 per year and saturate at the point total where the
  published risk table also tops out (17 for men, 25 for women), rather than
  extrapolating a risk percentage off the end of the table. The test suite asserts
  this behaviour.

### 5.6 A code smell the tests exposed

The SOFA escalation note was originally gated on `total > SOFA_MAX - 2`, i.e. only at
23–24 points — effectively dead code on a scale where 10 already means high organ
dysfunction. Coverage flagged it; I changed the threshold to `total >= 10`. Six other
unreachable `??` fallbacks (`find(...)?.x ?? ''` patterns in GCS labels, the
Framingham table lookups and the SOFA mortality lookup) were **removed at the source**
rather than tested, because testing impossible states is worse than deleting them.
Those tables are now index-addressed and total by construction.

---

## 6. Notes for the design agent

1. **Import types and constants only** from `src/logic/calculators/**`. Calculation
   functions are the logic layer's business; `CalculatorView.vue` owns the call site.
2. **Use `resolveCalculator(id)`** from `@/logic/calculators`, and throw on `undefined`
   — every valid id resolves, so `undefined` means a router id typo.
3. **Use `SEVERITY_LABELS`** for badge text instead of hard-coding
   `NORMAL / WARNING / CRITICAL / INFO`.
4. **`CATEGORIES[slug]`** supplies the label, description and `order` for the home
   grid; `calculatorsByCategory(slug)` supplies the lists.
5. **Catch `CalcValidationError` and read `.field`** to map a failure back to the
   offending input rather than showing a generic error.
6. **Framingham has a required diabetes toggle** (see §5.2).
7. **`SOFA_ORGAN_SCALE`** ships the full published SOFA band table so your form can
   map raw labs (PaO₂/FiO₂, platelets, bilirubin, MAP, GCS, creatinine) onto a 0–4
   score; `calculateSofa` accepts only the subscores.
8. **`EYES_LABELS` / `VERBAL_LABELS` / `MOTOR_LABELS`** are keyed by score for the
   GCS form; `EYES_SCALE` / `VERBAL_SCALE` / `MOTOR_SCALE` are the ordered arrays
   ready to render as radio rows.
9. **`hasBledComponents(input)` and `framinghamBreakdown(input)`** return
   label/points/description records so composite forms can render `ScoreRow` rows
   without duplicating the criteria.

---

## 7. Verification

`npx vitest run` and `npm run build` cannot run in this worktree: the project has no
`package.json`, `vite.config.ts` or `vitest.config.ts`, because those files belong to
the design agent's branch (`feat/design-system`) and my brief forbids touching config
files.

I therefore verified in an **isolated harness outside the repository**, at
`/tmp/opencode/medcalc-logic-harness`, with Vitest 2, TypeScript 5 and
`--strict --noUnusedLocals --noUnusedParameters --noImplicitReturns --verbatimModuleSyntax`.
`src/` and `tests/` are symlinked in, so nothing of the harness is committed and the
shared tree stays clean.

Two findings from that work are worth carrying forward:

- **Pinia and Vue must be aliased to their ESM files in the Vitest config.** By
  default Vite externalises `pinia` for one importer and inlines it for another,
  producing two module instances. `setActivePinia()` then silently fails and every
  store test errors with `getActivePinia() was called but there was no active Pinia` —
  a message that looks like an application bug but is a config artefact. Aliasing
  `pinia` → `dist/pinia.mjs` and `vue` → `dist/vue.runtime.esm-bundler.js` fixes it.
- **Coverage globs must account for symlinked roots.** The `include` pattern must match
  the path Vite reports for the modules; otherwise the report is silently `0/0` rather
  than failing loudly.

### Outstanding for whoever wires up the root config

- [ ] Add the `@` → `src` alias to `vite.config.ts`.
- [ ] Add Vitest config with the `@` alias **and** the Vue/Pinia ESM aliases above.
- [ ] Add `vitest` + `@vitest/coverage-v8` to `devDependencies`.
- [ ] Include `localStorage` in the test environment, or the three store test files
      will fail (they currently rely on a setup-file stub).
- [ ] Re-run `npm run build` to confirm zero strict-mode TypeScript errors across the
      merged tree.

---

## 8. File inventory

```
src/logic/
├── types.ts                  Severity, CalcResult, ReferenceRange, CalculatorMeta,
│                             CalcCategory, Sex, CALC_CATEGORIES, CalcValidationError
├── constants.ts              CALCULATORS_META (24), CATEGORIES, SEVERITY_LABELS,
│                             CALCULATOR_IDS, calculatorsByCategory()
├── README.md                 layer contract, severity vocabulary, clinical decisions
├── utils/
│   ├── validators.ts         assertRange + 5 siblings
│   ├── units.ts              molar masses, unit conversions, round/truncate
│   └── kdigo.ts              KDIGO G1–G5 staging
└── calculators/
    ├── index.ts              CALCULATORS registry, resolveCalculator(), input types
    ├── antropometria/        imc · superficieCorporal · pesoIdeal
    ├── medicacao/            dosePorPeso · gotejamento · diluicao · infusaoContinua
    ├── renal/                creatininaClearance · tfgCkdEpi · tfgMdrd
    ├── cardiologia/          chadsVasc · hasbled · framingham
    ├── emergencia/           glasgow · qsofa · sofa · shockIndex
    ├── laboratorial/         anionGap · osmolalidade · correcaoSodio · correcaoCalcio · hba1c
    └── nutricao/             harrisBenedict · hollidaySegar

src/stores/
├── favorites.ts              ids, count, toggle, isFavorite, clear
├── history.ts                entries (cap 50), add, clear, getByCalculator, remove
└── storage.ts                guarded localStorage + randomId

tests/                        31 spec files, 387 tests, mirrors src/
```