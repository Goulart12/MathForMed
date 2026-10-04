# MedCalc — Logic layer

Pure-TypeScript domain layer. **No Vue, no Pinia, no DOM, no browser APIs.**
Everything here is a pure, deterministic function or a frozen constant.

```
src/logic/
├── types.ts                 Severity, CalcResult, ReferenceRange, CalculatorMeta, CalcValidationError
├── constants.ts             CALCULATORS_META (24 entries), CATEGORIES, SEVERITY_LABELS
├── utils/
│   ├── validators.ts        assertRange, assertFinite, assertPositive, assertOneOf, …
│   ├── units.ts             molar masses, mg/dL ↔ mmol/L, gtt/min ↔ mL/h, kg/lb, cm/m
│   └── kdigo.ts             KDIGO G1–G5 staging, shared by the three renal calculators
└── calculators/
    ├── index.ts             CALCULATORS registry: id → { calculate, input, category }
    ├── antropometria/       imc · superficieCorporal · pesoIdeal
    ├── medicacao/           dosePorPeso · gotejamento · diluicao · infusaoContinua
    ├── renal/               creatininaClearance · tfgCkdEpi · tfgMdrd
    ├── cardiologia/         chadsVasc · hasbled · framingham
    ├── emergencia/          glasgow · qsofa · sofa · shockIndex
    ├── laboratorial/        anionGap · osmolalidade · correcaoSodio · correcaoCalcio · hba1c
    └── nutricao/            harrisBenedict · hollidaySegar

src/stores/                  Pinia: favorites · history · storage helpers
tests/                       Vitest, mirrors src/ — 387 tests, 100% coverage
```

## Invariants

1. **Every result is complete.** No function returns a bare number; each returns a
   `CalcResult` with `value`, `label`, `severity` and a non-empty `interpretation`.
2. **Validate before computing.** Out-of-range input *throws* `CalcValidationError`
   with a `field` property, so an invalid result can never reach the UI.
3. **Every formula is cited.** Each `calculate*` function carries a `@reference`
   JSDoc tag pointing at primary literature.
4. **Pure.** No side effects, no mutation of inputs, same input → same output.

## Severity vocabulary

| Severity     | Badge      | Meaning                                              |
| ------------ | ---------- | ---------------------------------------------------- |
| `normal`     | `NORMAL`   | Within the expected reference range                  |
| `attention`  | `WARNING`  | Outside the range; relevant but not emergent         |
| `critical`   | `CRITICAL` | Outside the range and requiring immediate action     |
| `info`       | `INFO`     | Descriptive output (doses, volumes, scores, no band) |

Use `SEVERITY_LABELS` from `@/logic/constants` for the badge text rather than
hard-coding strings.

## Calculator count

The brief refers to "22 calculators" but enumerates **24 ids**. The id list in the
brief is authoritative and all 24 are implemented:

`imc · superficie-corporal · peso-ideal · dose-peso · gotejamento · diluicao ·
infusao-continua · cockcroft · ckd-epi · mdrd · chads-vasc · has-bled ·
framingham · glasgow · qsofa · sofa · shock-index · anion-gap · osmolalidade ·
correcao-sodio · correcao-calcio · hba1c · harris-benedict · holliday-segar`

## Integration contract

Form components import **types and constants only**, never calculation functions:

```ts
import type { BmiInput } from '@/logic/calculators/antropometria/imc'
import { BMI_REFERENCES } from '@/logic/calculators/antropometria/imc'
```

`CalculatorView.vue` resolves an id to its function through the registry:

```ts
import { resolveCalculator } from '@/logic/calculators'
import { CALCULATORS_META } from '@/logic/constants'

const calculate = resolveCalculator(route.params.id as string)
if (!calculate) throw new Error('unknown calculator')   // id must exist in CALCULATORS_META
const result = calculate(input)                          // CalcResult, or throws CalcValidationError
```

`tests/logic/constants.test.ts` asserts that `CALCULATORS_META` and the
`CALCULATORS` registry hold identical ids and agree on every category, so a router
mismatch fails the test suite rather than the app.

## Clinical decisions worth knowing

These deviate from, or resolve ambiguity in, the original brief. Each is deliberate:

- **`dose-peso` escalates to `critical`** when the required draw exceeds
  `availableVolumeMl`. An order that cannot be filled from one presentation is a
  medication-safety event, not an informational note.
- **`framingham` does not score diabetes.** The Wilson 1998 / Anderson 1991
  hard-CHD point table (as published by the Framingham Heart Study) has no diabetes
  term. Rather than invent a point value, diabetes is returned as an explicit
  `attention` sub-result plus an interpretation citing the 2013 ACC/AHA position
  that diabetes in adults aged 40–75 is itself a statin-benefit group.
- **`anion-gap` computes the delta ratio from the albumin-corrected gap** — the same
  number the result displays. Using the uncorrected gap in the numerator while
  displaying the corrected one would be internally inconsistent.
- **SOFA accepts 0–4 organ subscores, not raw labs.** `SOFA_ORGAN_SCALES` ships the
  full published band table so the form layer can map PaO₂/FiO₂, platelets,
  bilirubin, MAP, GCS and creatinine onto a score.
- **Stores persist via guarded `localStorage` wrappers** (`src/stores/storage.ts`)
  rather than `pinia-plugin-persistedstate`, which is not in the dependency list.
  Missing, blocked or corrupt storage degrades to in-memory instead of throwing.
  `{ persist: true }` from the brief would not type-check against core Pinia.
- **`history` inputs must never carry patient-identifying data.** Documented at the
  top of `src/stores/history.ts`.

## Commands

```bash
npx vitest run                        # all tests
npx vitest run --coverage             # target ≥ 95% (currently 100% statements/branches/functions/lines)
npx vue-tsc --noEmit                  # strict type check
```