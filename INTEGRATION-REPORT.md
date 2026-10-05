# MedCalc — Integration Agent Report

**Branch:** `feat/integration` · **Base:** `9f756a4`, `1e330b8` (already merged via PR)
**Commits:** `8bca5b7` integration · `06b4889` pt-BR translation
**Scope:** every file needed to make the design and logic layers work together
**Outcome:** 576 tests passing · `vue-tsc` clean · `src/logic` at 100 % coverage · production build and PWA verified

---

## 1. Summary

The two branches arrived already merged, so **Tasks 1–2 produced no conflicts** and I
started at Task 3 as instructed. The real work was not conflict resolution but
**closing the seams the two agents deliberately left open for each other**.

Three things shaped the job:

1. **The spec's own type-check command is a no-op here.** `npx tsc --noEmit` reads the
   root `tsconfig.json`, which is `files: []` plus project references — it reports
   success regardless of the code's state. The command that actually checks anything is
   `npx vue-tsc -b`, and it reported **61 errors**.
2. **The design agent left three `MERGE:` seams, not one.** The brief describes wiring
   `CalculatorView`. In the code there were four distinct duplicated contracts, two of
   them causing live runtime bugs.
3. **The UI was pt-BR but the logic layer was English.** Every string a clinician
   actually reads came out of `src/logic/**` in English. That was a second, separate
   piece of work (§5).

| Task | Scope | Status |
|------|-------|--------|
| 1–2 | Merge / conflict resolution | **No conflicts** — both branches already merged; dep union in `package.json` intact |
| 3 | Dependencies | 604 packages, 0 errors |
| 4 | TypeScript audit | 61 errors → **0** |
| 5 | Wire UI to logic | 4 duplicated contracts closed; 3 live bugs fixed |
| 6 | Test suite | 6 pre-existing failures → **0** |
| 7 | Coverage | `src/logic` **100 %** stmts/branch/funcs/lines (target ≥ 95 %) |
| 8 | Dev smoke test | All 7 routes 200; every module transforms |
| 9 | Production build | Clean; 24 logic chunks code-split |
| 10 | Preview & PWA audit | Manual checks pass — **Lighthouse unavailable** (§6) |
| 11 | Commit | `8bca5b7` |

---

## 2. Task 4 — the 61 type errors

`vue-tsc -b` failed because the merge adopted the **design branch's** `tsconfig.app.json`
whole, which sets `noUncheckedIndexedAccess: true`. The logic branch had no
`tsconfig.app.json` of its own, so this was not a two-way conflict — it was one branch's
tooling config silently becoming the project's, and the logic layer had never compiled
against it.

The brief says "take the stricter set", so I kept the flag and fixed the code rather
than relaxing the config. Errors clustered as `TS2532`/`TS18048` (`possibly undefined`)
on table lookups:

| File | Errors | Fix |
|------|--------|-----|
| `logic/calculators/cardiologia/framingham.ts` | 8 | Lookup tables typed as tuples; band-index helpers return literal unions (`AgeColumn`, `CholesterolRow`, `HdlBand`, `SbpBand`); clamped risk read narrows through `assertDefined` |
| `logic/utils/kdigo.ts` | 6 | Dropped the widening `: readonly KdigoStage[]` annotation so the existing `as const` yields a tuple — positional lookups become statically checked against the published length |
| `logic/calculators/emergencia/sofa.ts` | 3 | Mortality table typed as a 15-entry tuple; clamped read via `assertDefined` |
| `logic/constants.ts` | 2 | `calculatorsByCategory` uses a type-guard predicate instead of a bare `.filter` |
| `stores/storage.ts` | 2 | `bytes[6]`/`bytes[8]` on a freshly allocated `Uint8Array` |
| `logic/calculators/antropometria/imc.ts` | 1 | Extracted `HIGHEST_BAND` as the named fallback instead of `BANDS[BANDS.length - 1]` |
| `logic/calculators/cardiologia/hasbled.ts` | 1 | See §3.4 |
| 8 test files | 38 | Mechanical indexed-access in assertions |

I reused the codebase's own `assertDefined` rather than introducing `!`, matching the
existing style — `grep` confirmed zero non-null assertions in `src/`.

### A real fragility removed

`hasbled.ts` zipped two parallel arrays by index (`CRITERIA` + `INPUT_KEYS`) to pair each
criterion with its input key. Under the new flag that became an error, and the deeper
problem was that nothing stopped the arrays drifting apart. Each criterion now carries
the key it reads; `INPUT_KEYS` is gone. The public `HasBledComponent` shape is unchanged
(`key` is destructured away), and `INPUT_KEYS` was private, so nothing external moved.

---

## 3. Task 5 — wiring: four duplicated contracts

The brief describes one seam. The code had four, each marked with a `MERGE:` note by the
design agent. Two were causing live runtime bugs that no test caught.

### 3.1 `pending()` stubs — the seam the brief describes

All 24 entries in `src/components/calculators/registry.ts` were `pending(id)` functions
throwing *"ainda não está disponível"*. Replaced with dynamic imports of the logic
modules, making `calculate` async to match.

**The brief's registry has several wrong function names** — it lists
`calculateIdealWeight`, `calculateCockcroft`, `calculateSodiumCorrection` and others
that do not exist. I took the real names from the logic layer's own registry
(`src/logic/calculators/index.ts`), e.g. `calculateIdealBodyWeight`,
`calculateCreatinineClearance`, `calculateCorrectedSodium`.

Dynamic rather than static imports for two reasons: it keeps each calculator's clinical
code in its own chunk (verified — `imc`, `sofa`, `framingham` etc. all appear
separately in `dist/assets`), and a dynamic import is **statically verified**, so a
renamed function or wrong module path fails the build.

### 3.2 Duplicate `CalcValidationError` — a silent runtime bug

`src/types/logic.ts` was a "TEMPORARY SHIM" that re-declared the domain types,
**including its own `CalcValidationError` class**. `CalculatorView` imported the shim's
class; the logic layer threw the one from `src/logic/types.ts`.

Two distinct classes with the same name means `error instanceof CalcValidationError` was
**always false** for every validation error the app could raise. The consequence was
subtle — the catch block fell through to the generic branch, so the user still saw a
message, but never the intended *"Verifique os valores informados"* toast, and the
field-level styling was wrong.

Deleted the shim, repointed 13 files to `@/logic/types`.

### 3.3 Duplicate input types

`src/types/calculator-inputs.ts` re-declared all 24 `Input` interfaces. Six had
different *names* (`ImcInput` vs `BmiInput`, `CockcroftInput` vs
`CreatinineClearanceInput`, …) but identical shapes; all 24 forms emitted exactly the
fields the logic layer expects, including correct unit conversions (`height / 100`).

Deleting it was the documented instruction, and it immediately surfaced a defect the
shim had been hiding: the logic layer's `SofaInput` uses a `SofaScore` union where the
shim had widened to plain `number`. The form's `emit` was casting `number`; it is now
cast to the real union.

This duplication is exactly what caused §3.2, so removing it was preventative rather
than cosmetic.

### 3.4 Duplicate Pinia stores — a live conflict

The most serious find. `src/composables/useHistory.ts` and `useFavorites.ts` were shims
that each defined `defineStore('history')` / `defineStore('favorites')` — the **same ids
as `src/stores/`**. Which implementation was live depended on module evaluation order.

The two were not equivalent:

| | shim | `src/stores/` |
|---|---|---|
| history | `latest`, `isEmpty` | `count`; `add()` returns the entry |
| favorites | `remove()` | `clear()` |
| storage | raw `localStorage` | guarded `readStorage`/`writeStorage` |

Per the brief ("prefer the logic-agent version for `src/stores/`"), the logic layer won.
`HomeView` used `history.latest` and `HistoryView` used `history.isEmpty`; both now read
`history.entries` / `history.count` directly. Shims deleted.

**This immediately exposed a second defect.** Two `persistence.test.ts` cases asserted
the favourites store sanitises corrupt storage. The shim's raw `JSON.parse` did; the
logic store's generic `readStorage<T>` cannot, because it cannot know `T`'s shape. So a
`medcalc-favorites` value of `{"imc": true}` was being loaded straight into a `string[]`
and would break the whole page.

Rather than weaken the tests, I added `readStringList()` to `src/stores/storage.ts` — it
filters non-string entries and returns `[]` for anything that is not a list. That is the
robustness the design agent had and the logic layer lacked.

### 3.5 Metadata: deliberately **not** unified

The shim note said to replace the UI metadata with `CALCULATORS_META` from the logic
layer. **I did not**, and this is the one place I knowingly diverged from the brief.

The two registries carry different copy on purpose:

| | logic layer | UI (`src/data/`) |
|---|---|---|
| `imc.name` | `Body Mass Index (BMI)` | `Índice de Massa Corporal` |
| `cockcroft.name` | `Creatinine Clearance` | `Clearance de Creatinina` |

The logic copy is English domain reference for documentation and API consumers; the UI
copy is pt-BR, which is what a Brazilian clinician reads. Following the note literally
would have silently switched the entire app's language to English.

Instead I verified the parts that *are* contractual — ids, categories and ordering are
identical across both — and added an architecture test that fails the build if they ever
diverge.

---

## 4. Tasks 6–7 — tests and coverage

### 4.1 Two test files had to be rewritten

**`tests/architecture/boundaries.test.ts`** asserted the *pre-merge* world: that
`src/logic` and `src/stores` must **not exist**, and that `src/components` and
`src/views` must never import from `@/logic/`. Post-merge both are inverted.

Preserved every rule that still applied (no formula arithmetic in UI files, one form per
id, form filename matches id) and replaced the obsolete ones with rules that hold now:

- `src/logic` exists, and imports no Vue, Pinia or browser API
- calculation **functions** are reachable only through `registry.ts` (type-only imports
  of input interfaces are fine — the forms need those)
- the UI and logic metadata registries agree on ids and categories

**`tests/app.integration.test.ts`** had a test asserting the placeholder error
*"ainda não está disponível"* — it encoded the un-integrated state and hung for 5 s once
the logic layer worked. Replaced with real end-to-end coverage: IMC renders a ResultCard
and records history; Glasgow renders its three axes and scores them per component.

### 4.2 A guard for the risk the async change introduced

Making `calculate` async introduced an unhandled-rejection failure mode that would be
silent in CI — a rejected dynamic import inside `handleCalculate` leaves the suite green
while the browser logs an error. Added a global trap in `tests/setup.ts` that fails the
offending test on any `console.error`, `unhandledrejection` or `uncaught`.

`console.warn` is deliberately excluded — the design layer uses it for dev hints. I
verified the guard is not vacuous by injecting a `console.error` into a scratch test and
confirming it failed.

### 4.3 Coverage

`src/logic` reached **100 %** across statements, branches, functions and lines — above
the ≥ 95 % target, with no calculator below 100 %. No new calculator tests were needed.

---

## 5. pt-BR translation — `06b4889`

The design layer shipped in pt-BR, but every string a clinician reads originates in
`src/logic/**`: interpretations, result labels, reference-range band names and
validation messages. **All of it was English.**

Scope, confirmed before starting: user-visible strings only, clinical guidance fully
translated; JSDoc, comments, identifiers and bibliographic citations stay English.

### 5.1 Method

I built a canonical glossary (`/tmp/opencode/GLOSSARIO.md`) pinning ~150 labels and the
style rules, then translated the 24 calculators plus `utils/kdigo.ts` and
`utils/validators.ts` through five parallel agents, one per category group. Pinning the
vocabulary was the point — otherwise five agents produce five synonyms for the same band.

I verified the agents' output rather than trusting their reports, and that mattered:

- **One agent finished without updating its test files at all**, leaving 6 failures. I
  fixed `hollidaySegar.test.ts` (5 assertions) and `harrisBenedict.test.ts` (6) myself.
- **The last agent flagged that calculator cards still read in English** — and it was
  right. `anion-gap` rendered as `Anion Gap`. No agent had `src/data/` in scope.
- Three agents independently flagged the same judgement call: whether
  `assertRange(…, 'years')` unit arguments are in scope. They demonstrably reach the
  screen (`"deve estar entre 0 e 4 points"`), so I translated them.

### 5.2 Defects found and fixed

| Defect | Was | Now |
|---|---|---|
| Calculator card English | `Anion Gap` | `Gap Aniônico` |
| Meaningless description | `Bre anionico corrigido…` | `Gap aniônico corrigido…` |
| Missing accent | `anionico` | `aniônico` |
| Search tag typo | `acose` | `acidose` |
| English word in description | `dosear Drugs` | `dosar medicamentos` |
| Units in error messages | `'years'`, `'points'`, `'breaths/min'` | `'anos'`, `'pontos'`, `'respirações/min'` |
| English validation message | `Field 'stressFactor' must be 1 or greater.` | `O campo 'stressFactor' deve ser 1 ou maior.` |
| Leftover English units | `mg/day`, `mg/dL BUN`, `5 ft` | `mg/dia`, `mg/dL de ureia`, `5 pés` |

The `acose` typo was silently breaking search for "acidose" — a bug that predates this
work.

### 5.3 Pluralisation

Scores rendered `1 pontos`. Pre-existing in English (`1 points` is equally wrong), but
wrong in both languages.

Added `pluralize()` to `utils/units.ts` and applied it to all 14 point-valued units, so
output reads `1 ponto`, `0 pontos`, `3 pontos`. I applied it to top-level scores too, not
just sub-results — a qSOFA or CHA₂DS₂-VASc total of exactly 1 would otherwise still read
`1 pontos`.

I introduced a bug here and caught it: a bulk string replacement wrote
`pluralize(eyes, …)` into Glasgow's verbal and motor sub-results. The type checker was
happy — all three are `number`. I only found it by printing every call site against its
adjacent `value:` field.

### 5.4 Left in English, deliberately

- **`src/logic/constants.ts`** — `CALCULATORS_META` and `SEVERITY_LABELS` are still
  English. Confirmed imported **nowhere** in `src/`, so nothing reaches the screen. The
  UI uses `src/data/severity.ts`, already pt-BR (`NORMAL` / `ATENÇÃO` / `CRÍTICO` /
  `CÁLCULO`).
- **Design layer** — verified already fully pt-BR (`index.html` carries `lang="pt-BR"`,
  `src/data/categories.ts`, all 24 forms, all views). No changes needed.

---

## 6. Verification performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **meaningless** — root tsconfig is `files: []` + references |
| `npx vue-tsc -b` | 61 errors → **0** |
| `npx vitest run` | 6 failures → **576 passing**, 40 files |
| `npx vitest run --coverage` | `src/logic` **100 %** stmts / branch / funcs / lines |
| `npm run build` | exit 0, 86 precached entries, `sw.js` generated |
| `npm run dev` | all 7 routes 200; registry, views, forms and logic modules all transform |
| `npm run preview` | `/`, `sw.js`, `manifest.webmanifest`, icons → 200 |
| Numeric literals vs pre-translation tree | **unchanged in every `src/` file** |
| Test integrity | identical `it()`/`expect()` counts, except `units.test.ts` (+3) |
| `src/logic` purity | no Vue / Pinia / browser API — enforced by test |

### Not verified

- **Lighthouse PWA score ≥ 90** — no Chrome or Lighthouse binary in this environment. I
  ran the brief's documented manual fallback instead: `manifest.webmanifest` present and
  valid (`standalone`, `pt-BR`, three icons incl. maskable), `sw.js` present with 86
  precache entries and `registerSW.js` wired at scope `/`, `viewport-fit=cover`,
  `theme-color`, iOS meta, 192/512/maskable/apple-touch icons. The inputs it scores are
  in place; the score itself is unmeasured.
- **Real-device behaviour** of safe-area insets and the PWA install prompt.
- **Clinical correctness of the pt-BR wording.** Numbers, thresholds and severity
  banding are provably unchanged, but a native-speaking clinician should review the
  clinical phrasing — especially §7.4.

---

## 7. Judgement calls and known issues

### 7.1 Kept the stricter `noUncheckedIndexedAccess`

Cost: 61 errors and a fair amount of test churn. Benefit: the flag caught the HAS-BLED
parallel-array coupling (§2), which was a latent bug. Disabling it would have been a
one-line change that made the build green while leaving that in place.

### 7.2 Did not unify the metadata registries

Deviating from the shim's instruction, for the language reason in §3.5. Guarded by test.

### 7.3 Translated validator unit arguments

Slightly beyond a literal reading of "user-visible strings" — they are validator
arguments, not `unit:` fields. But they interpolate into on-screen error text, so
leaving them produced visible mixed-language alerts.

### 7.4 Open items, not addressed

- **Decimal separator** — the display layer renders `8.5`, not pt-BR `8,5`. Affects
  every number app-wide; a pre-existing display concern well beyond translation scope.
- **`'roza'`** in the Harris-Benedict search tags — a typo, but not English and I could
  not infer intent without guessing. Search-only, never displayed.
- **Framingham "hard CHD"** rendered as `doença arterial coronariana grave`. *Grave* can
  read as "severe" rather than "hard endpoints"; `doença arterial coronariana (eventos
  duros)` is the alternative.
- **`'1 pontos'`** was fixed; the broader pluralisation problem is otherwise untested
  outside `units.test.ts`.

---

## 8. File inventory

**Modified:** 24 calculators · `logic/utils/{kdigo,validators,units}.ts` ·
`data/calculator-meta.ts` · `stores/{storage,favorites}.ts` ·
`components/calculators/registry.ts` · `views/{CalculatorView,HistoryView,HomeView}.vue`
· 28 test files

**Deleted (shims):** `src/types/logic.ts` · `src/types/calculator-inputs.ts` ·
`src/composables/{useHistory,useFavorites}.ts`

**Added:** `pluralize()` in `logic/utils/units.ts` · the console-error guard in
`tests/setup.ts` · post-merge rules in `tests/architecture/boundaries.test.ts`