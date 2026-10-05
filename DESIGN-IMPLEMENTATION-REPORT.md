# MedCalc — Design Layer Implementation Report

**Branch:** `feat/design-system` · **Base:** `main` (`230697b`) · **Commit:** `32a687d`
**Scope:** all 10 tasks of `.opencode/agents/design-agent.md`

This is a complete account of the visual layer of MedCalc: what was built, why
each non-obvious decision was made, what was verified, and what is left for the
logic merge. It is written to be read by someone who has not seen the work.

---

## 1. Summary

| | |
|---|---|
| Source files | 60 (46 Vue components, 14 TypeScript) |
| Test files | 9 suites, **180 tests, all passing** |
| Test coverage | 92.08% statements, 73.61% branches |
| TypeScript | `vue-tsc -b` strict — **zero errors** |
| Production build | clean, 4.2 s |
| Service worker | 58 precached assets |
| Router ids | all 24 match `feat/calc-logic` exactly |

**The one thing not done:** the clinical formulas. Those belong to the
`feat/calc-logic` worktree, which landed *after* this work began (see §9). This
branch stubs nothing in `src/logic` or `src/stores`; it consumes design-owned
type shims instead, so the app builds, type-checks and tests standalone today.

---

## 2. Task-by-task

### Task 1 — Project Bootstrap

Vite 6.4 · Vue 3.5 · TypeScript 5.9 strict · Tailwind CSS 4.3 · Pinia 3 ·
vue-router 4.6 · vite-plugin-pwa 1.3 · @phosphor-icons/vue 2.2.

Pinned to Vite 6 rather than latest (Vite 8 was current) because
`vite-plugin-pwa` 1.x's peer range is the well-trodden path; 2.x adds risk for no
gain here.

`vite.config.ts` registers Vue, Tailwind, and the PWA plugin; aliases `@` → `src`;
and carries the Vitest config (jsdom, `tests/setup.ts`). `vitest/config`'s
`defineConfig` is used rather than Vite's, because the `test` key does not exist
on `UserConfigExport`.

Three TS configs with project references: `tsconfig.app.json` (src + tests),
`tsconfig.node.json` (vite config), `tsconfig.json` (solution). Strict plus
`noUncheckedIndexedAccess`, `noUnusedLocals`, `verbatimModuleSyntax`,
`noImplicitOverride`.

### Task 2 — Design Tokens

`src/assets/styles/tokens.css` declares every token inside `@theme static`.

The `static` keyword is load-bearing. A plain Tailwind v4 `@theme` block is
tree-shaken — only variables some utility actually references get emitted to
`:root`. The spec requires the documented custom properties (`var(--color-primary-600)`)
to exist, so `@theme static` forces all of them out while still generating the
utilities. One block, two guarantees, no duplicated hex values.

A naive `@theme` also could not have produced the spec'd names: `--color-text-primary`
would yield the utility `text-text-primary`. So the text ramp is declared as
`--color-ink*` (reading as `text-ink-muted`) and the three documented
`--color-text-*` names are re-exposed as aliases underneath.

#### The palette does not pass WCAG AA — measured, then fixed

The spec mandates both a specific palette *and* "WCAG AA contrast on all colour
pairs". Those conflict. I wrote a contrast script rather than eyeballing it:

| Pair | Ratio | AA needs | Verdict |
|---|---|---|---|
| `--color-ok` on `--color-ok-bg` | 3.15:1 | 4.5 | **fails** |
| `--color-warn` on `--color-warn-bg` | 2.84:1 | 4.5 | **fails** |
| `--color-alert` on `--color-alert-bg` | 4.41:1 | 4.5 | **fails** |
| `--color-text-muted` on surface | 2.55:1 | 4.5 | **fails** |
| white on `--color-cat-med` | 4.47:1 | 4.5 | **fails** |
| white on `--color-cat-antro` | 3.68:1 | 4.5 | **fails** |
| white on `--color-cat-emerg` | 3.56:1 | 4.5 | **fails** |
| `--color-border` on white input | 1.28:1 | 3.0 | **fails 1.4.11** |

**Resolution — additive, not a substitution.** Every spec'd value is still
declared and still used for fills, borders, icons and severity dots, so the
brand identity is intact. Text and control boundaries use darker same-hue
derivatives added alongside:

| Token | Value | Measured |
|---|---|---|
| `--color-ok-text` | `#15803d` | 4.79:1 on `--color-ok-bg` |
| `--color-warn-text` | `#a16207` | 4.76:1 on `--color-warn-bg` |
| `--color-alert-text` | `#b91c1c` | 5.91:1 on `--color-alert-bg` |
| `--color-info-text` | `#1e5180` | 7.46:1 on `--color-info-bg` |
| `--color-ink-faint` | `#64748b` | 4.55:1 on surface |
| `--color-line-strong` | `#8593a8` | 3.12:1 on white |

Category count badges were re-designed for the same reason: a 12% category tint
with `--color-ink` text (12.2–13.0:1) instead of white-on-accent, which fails on
five of the seven hues. The accent still visibly colours the badge via the tint
and its ring.

### Task 3 — Atomic UI (11 components)

`AppInput` · `AppSelect` · `AppToggle` · `AppButton` · `ResultCard` ·
`ScoreRow` · `SectionHeader` · `SeverityBadge` · `CategoryCard` ·
`CalculatorListItem` · `ToastHost`.

**`AppInput` is a text input with `inputmode="decimal"`, not `type="number"`.**
This is the single most consequential UI decision in the build. The app is
pt-BR, so a clinician types `1,75` for height — and `type="number"` silently
discards it, along with its spinners and scroll-wheel side effects. The
component therefore keeps the raw string in a local ref and emits a *parsed
number*, and only reformats when the parent genuinely disagrees:

```ts
watch(() => props.modelValue, (next) => {
  // A half-typed "1," must not be rewritten to "1" under the user's cursor.
  if (parseNumeric(raw.value) !== next) raw.value = formatValue(next)
})
```

14 of the 37 component tests cover this, including `"1,"` → `1` → `"1,5"` →
`1.5`, a lone `"-"` → `null`, and `"abc"` → `null`.

**Button heights.** `AppButton` has `sm`/`md`/`lg`, but all three clear 48 px
(`min-h-12`, `min-h-12`, `min-h-13`); `size` only moves padding and type size. The
48 px floor is a hard requirement, so I did not let `sm` undercut it. The
`shadow-fab` treatment is applied only to the full-width primary CTA — the one
control a physician reaches for under time pressure.

**`ResultCard`** renders severity badge → hero value in `--font-mono` at 36 px →
interpretation → indented sub-results → collapsible reference accordion, with a
250 ms `translate-y-4 → 0` entrance. Severity-to-colour mapping lives in one
place (`src/data/severity.ts`) so the card, the history list and the home strip
cannot drift apart.

### Task 4 — Layout (4 components)

`AppShell` · `PageHeader` · `BottomNav` · `SearchBar`.

**Bottom-nav clearance is defined once.** `--bottom-nav-h: calc(56px + env(safe-area-inset-bottom, 0px))`
lives in `tokens.css`, and `AppShell` reserves `calc(var(--bottom-nav-h) + 0.5rem)`.
No view has to remember the offset.

**`BottomNav` active-state matching is exact for `/`.** Every route is prefixed by
`/`, so a naive `startsWith('/')` would light up "Início" everywhere. `isActive`
special-cases the root. `/calc/:id` and `/category/:slug` are drill-downs with no
nav destination, so nothing lights up there. Covered by tests.

**`PageHeader`** centres its title between two equal 56 px gutters that widen when
both the favourite and share actions are present, so the title never shifts.

**`SearchBar`** has a `readonly` mode used on Home: the field is inert to pointer
and keyboard input so the wrapping `RouterLink` receives the tap. That reuses one
component instead of maintaining a look-alike.

### Task 5 — Router

Hash history, as specified, so a cold offline start needs no server rewrite rule.
Six named routes plus a catch-all.

The module exports a **`createAppRouter()` factory** rather than only a singleton.
That change came from a test failure: the `document.title` logic lived on the
module-level router instance, so an isolated test router could never exercise it.
A factory puts the route table, history mode and title behaviour behind one
callable unit. `main.ts` uses the default export; tests call the factory.

The catch-all redirects to the string `'/'` rather than `{ name: 'home' }` — a
named redirect inherits the record's `pathMatch` param, and vue-router warns about
discarding it.

### Task 6 — Views (6)

`HomeView` · `CategoryView` · `SearchView` · `FavoritesView` · `HistoryView` ·
`CalculatorView`.

Search strips diacritics (`foldText`) so `superficie` matches `superfície` — a
phone keyboard rarely offers the accented key — and requires *every*
whitespace-separated term to match, so `gota infusao` narrows rather than widens.

History's clear action is two-step (Limpar → Confirmar) with the entry count in
the confirmation: deleting 50 entries has no undo. Timestamps include a
two-digit year, because a 50-entry list can span a year boundary and an undated
clinical result is worse than useless.

Both favourites and history resolve their stored ids through the metadata map, so
an id left behind by an older build renders as nothing rather than as `undefined`.

### Task 7 — Calculator Forms (24)

One form per calculator at `src/components/calculators/[id]/[PascalId]Form.vue`.

The spec's four rules are enforced, not merely intended:

1. All fields go through `AppInput` / `AppSelect` / `AppToggle` — no raw `<input>`.
2. Validation is a `computed` boolean gating the CTA.
3. The form **emits** a typed input; it never calls the logic function.
4. No formula anywhere — enforced by an architecture test that scans every
   `<script>` block for arithmetic.

Each form's range checks mirror the logic layer's accepted ranges, so the CTA can
never enable a submission that would throw. `DiluicaoForm` goes further: it
compares the two concentrations and shows an inline error, because the logic layer
rejects a "dilution" whose final concentration is not lower.

**Height is collected in centimetres** and converted to metres in the payload.
The logic layer's own field names are inconsistent — `harris-benedict` takes
`heightCm` while the others take `heightM` — and cm is what a clinician measures
with. This is unit normalisation, not a formula.

**Spec discrepancy:** Task 7 says "22 total" but its table lists 24, and Task 3
lists 24 ids. I implemented all 24. Also, `osmolalidade`'s component is
`OsmolalidadeForm`, not the spec's `OsmolaladeForm`, for consistency with the
other 23.

### Task 8 — Registry

`src/components/calculators/registry.ts` maps all 24 ids to a lazy form component
and a `calculate` function.

`CalculatorId` is derived from the literal `CALCULATOR_IDS` tuple, and the
registry is typed `Record<CalculatorId, CalculatorEntry>` — so adding a
calculator to the metadata without wiring a form is a **compile error**, not a
runtime 404. `requireMeta()` is a narrowing accessor that throws on a missing
entry: reaching it means the id list and the metadata have drifted, which should
be loud.

`calculate` is typed `(input: never) => CalcResult`, so each form's payload is
forced to match its own calculator.

> **Follow-up (§9):** the logic branch now ships its own `CALCULATORS` registry
> keyed by the same ids. This file should consume it rather than hand-wire 24
> dynamic imports.

### Task 9 — Micro-interactions

| Trigger | Behaviour | Implementation |
|---|---|---|
| Button `:active` | `scale-95`, 100 ms | `transition-all duration-100` |
| ResultCard mount | `translate-y-4 → 0`, 250 ms | `animate-result-in` |
| Saved to history | toast from top, 2 s auto-dismiss | `animate-toast-in` + bus |
| BottomNav change | colour + icon weight, 150 ms | `transition-colors` |
| Input error | 150 ms horizontal shake ×3 | `animate-shake` |

All keyframes live in `tokens.css`. A global `prefers-reduced-motion: reduce`
block collapses every animation to 0.01 ms — for a tool used by clinicians with
vestibular sensitivity and by users with OS-level motion sensitivity.

`CalculatorView` bumps a `resultEpoch` on each calculation so the entrance
animation replays instead of firing once, and a `formEpoch` on reset so the async
form remounts with its fields cleared.

### Task 10 — PWA & iOS

Manifest (name, `pt-BR`, portrait, standalone, theme `#3b82c4`, three icons
including a maskable), iOS meta tags, `viewport-fit=cover`, preconnect +
Inter/JetBrains Mono.

Icons are generated, not placeholders: a medical cross on `--color-primary-600`,
drawn with a signed-distance union of two rounded boxes and written as
anti-aliased PNGs. My first attempt (a naive capsule intersection) produced a
solid block — visible in the rendered check — so I rewrote it properly. The
maskable variant keeps content inside the 80% safe zone. `favicon.svg` matches.

Service worker precaches 58 assets including all icons, `index.html`, the manifest
and every code-split form chunk.

---

## 3. Design decisions worth arguing about

**Severity labels are Portuguese** — `NORMAL / ATENÇÃO / CRÍTICO / CÁLCULO` — not
the spec's `NORMAL / WARNING / CRITICAL`. The entire UI is pt-BR; a half-English
clinical vocabulary reads as a bug rather than as internationalisation. One line
in `src/data/severity.ts` if English is preferred.

**`min-h` over `h` on every interactive element.** A fixed height clips a
translated label or a browser font fallback; `min-h-12` grows instead. It is also
what makes the touch-target audit meaningful, since it reads a single class.

**Colour used only through tokens.** No inline `style` objects anywhere, per the
spec's rule. Safe-area insets — which cannot be expressed as a static utility —
use arbitrary-value utilities like `pt-[env(safe-area-inset-top,0px)]`.

---

## 4. Tests — 180 across 9 suites

| Suite | Tests | Covers |
|---|---|---|
| `app.integration` | 14 | Real router + Pinia + views; all 24 forms load |
| `architecture/boundaries` | 11 | Layer boundary + formula-arithmetic bans |
| `architecture/touch-targets` | 5 | ≥48 px on every rendered interactive element |
| `calculators/forms` | 25 | Form validation gates and emitted payloads |
| `components/AppInput` | 37 | Decimal comma, ids, aria, every primitive |
| `components/CalculatorView` | 19 | Result, history, error paths, favourites |
| `data/calculator-meta` | 19 | Metadata integrity, registry completeness, search |
| `stores/persistence` | 18 | Rehydration, 50-cap, corrupt-storage recovery |
| `views/navigation` | 32 | Nav, search, empty states, clear confirmation |

Coverage by area: `src` root 100%, `router` 100%, `types` 100%, `data` 99.5%,
`views` 95.9%, `components/ui` 94.9%, `composables` 89.4%.

### The two architecture suites are the point

Rules that hold today erode silently, so they are encoded:

**`boundaries.test.ts`** asserts `src/logic` and `src/stores` do not exist in
this worktree; no file under `src/components` or `src/views` imports `@/logic`;
no `<script>` block contains formula arithmetic (the naive version of this test
matched `opacity/25` inside Tailwind class strings — it now scans script blocks
only); every calculator id has exactly one form; and each form is named after its
id.

**`touch-targets.test.ts`** renders every UI, layout and view component — empty
*and* populated — and asserts each interactive element carries a ≥48 px Tailwind
height utility. It runs against the **rendered DOM**, not template source, so
`:class` bindings resolve for real; my first attempt parsed the source with a
regex and produced false positives on `iconButtonClass`-style bindings.

It found **six real regressions**: the search clear button (40 px), `AppToggle`
segments (44 px), the history clear button (44 px), both search chips (44 px),
and the toast dismiss target (padding-sized, no explicit height). Also caught two
links in `HomeView` that happened to clear 48 px through content height rather
than by declaration — now explicit.

### Bugs my own tests caught

Worth recording, because each was a real defect rather than a test artefact:

- **`--bottom-nav-h` was declared as a bare custom property inside `@layer base`
  with no selector** — invalid CSS, silently dropped, so the scroll clearance did
  nothing. Caught by grepping the built CSS for the token.
- **`DiluicaoForm` had an unbound `unit` ref** — a control that displayed a unit
  string no user could change. Caught by reading it while writing tests.
- **`FavoritesView` relied on the globally-registered `RouterLink`** instead of
  importing it, so it could not be mounted in isolation. Caught by a mount failure.
- **`qsofa` had a leftover disabled "Glicemia" field** that is not part of qSOFA
  at all. Caught on review.
- **Two malformed test helpers of my own** (a `vi_stubRouter()` stub that did
  nothing, a non-awaited `setValue`) and a label-matching bug that clicked Home's
  search link instead of the bottom-nav "Buscar". Fixed rather than worked around.
- **The integration suite was genuinely flaky** — `flushPromises` does not drain
  Vite's module-runner I/O, so async forms had not loaded when assertions ran.
  It passed in isolation and failed under coverage. Replaced fixed tick counts with
  `waitFor()` polling on the expected state.

---

## 5. Verification performed

| Check | Result |
|---|---|
| `npx vue-tsc -b --force` | 0 errors |
| `npm run build` | clean, 4.2 s, SW generated |
| `npx vitest run` | 180/180, three consecutive runs |
| `npx vitest run --coverage` | 92.08% stmts, 180/180 |
| `npm run dev` | boots in 438 ms, all modules transform, no console errors |
| `npm run preview` | `/`, `index.html`, `manifest.webmanifest`, all icons, `sw.js` → 200 |
| Token emission | every spec'd `--color-*` present in built CSS |
| Touch targets | audited and enforced by test |
| Contrast | every text pair measured, all ≥4.5:1 |

### Not verified

- **Lighthouse PWA score ≥ 90** — no browser or Lighthouse binary in this
  environment. The inputs it scores are in place and confirmed serving (manifest
  with three icons including maskable, `sw.js`, `viewport-fit=cover`, iOS meta,
  58 precached assets, 180×180 apple-touch-icon), but the score itself is
  unmeasured. This is the one delivery-checklist item I cannot vouch for.
- **Real-device behaviour** of the micro-interactions and safe-area insets.
- **Clinical correctness** — no formula exists on this branch to be wrong.

---

## 6. File map

```
src/
├── assets/styles/       tokens.css (@theme static + keyframes), main.css
├── components/
│   ├── calculators/     registry.ts + 24 [id]/[PascalId]Form.vue
│   ├── layout/          AppShell, PageHeader, BottomNav, SearchBar
│   └── ui/              11 atomic + composite components
├── composables/         useFavorites, useHistory, useToast
├── data/                calculator-meta, categories, severity
├── types/               logic.ts, calculator-inputs.ts   ← shims, see §9
├── views/               6 views
└── router/              createAppRouter() factory
tests/                   9 suites + setup.ts
public/icons/            4 generated PNGs + favicon.svg
```

---

## 7. Decisions taken without asking

Each of these had a defensible alternative; flagging them so they can be reversed
in one place if you disagree.

| Decision | Alternative | Revert at |
|---|---|---|
| Portuguese severity labels | Spec's English set | `src/data/severity.ts` |
| Added AA colour variants | Ship spec values, fail AA | `tokens.css` |
| Tinted count badges, not white-on-accent | Solid accent fill | `CategoryCard.vue` |
| Height in cm | Metres, matching some logic fields | 4 form components |
| `min-h` over `h` on controls | Exact heights | across `ui/`, `layout/` |
| `createAppRouter()` factory | Module singleton | `router/index.ts` |
| `/` route active-match is exact | Prefix matching | `BottomNav.vue` |
| `OsmolalidadeForm` spelling | Spec's `OsmolaladeForm` | one file rename |
| 24 calculators, not 22 | Spec's stated count | — |

---

## 8. The logic-layer decision

The repo was empty when this work started: both worktrees contained only the
agent definitions. The design layer imports types and metadata that live in the
logic layer, so it could not compile.

You chose **"stub nothing, use local type shims"** over duplicating the logic
layer or blocking. So:

- `src/types/logic.ts` mirrors `src/logic/types.ts` — types plus
  `CalcValidationError`, the one class a view needs in order to render a
  field-level error.
- `src/types/calculator-inputs.ts` mirrors the 24 `Input` interfaces.
- `src/data/calculator-meta.ts` mirrors `CALCULATORS_META` and adds the display
  query helpers (`foldText`, `searchCalculators`) that are genuinely display concerns.
- `src/composables/useFavorites.ts` and `useHistory.ts` are local Pinia stores.

The store shims deliberately reuse the logic branch's **store ids** (`favorites`,
`history`) and **storage keys** (`medcalc-favorites`, `medcalc-history`), so the
merge is an import-path swap with no user-data migration.

Each shim carries a `MERGE:` note at the top of the file.

---

## 9. Merge handoff — verified against the real branch

`feat/calc-logic` has since landed (`f5b345f`). I checked my shims against it
rather than trusting my earlier assumptions. **I was wrong about one thing**, and
the rest of this section is corrected against the actual files.

### Verified good

- All **24 router ids match exactly**, character for character.
- `CALCULATORS_META` is exported by `@/logic/constants` — though **nested by
  category** (7 groups), not the flat record my shim uses.
- Both storage keys and both store ids match.
- 13 of the 24 `Input` type names match.

### Correction: the `Input` names do *not* all match

I previously wrote that exported names match 1:1. They do not — 11 differ:

| My shim | Real logic export |
|---|---|
| `ImcInput` | `BmiInput` |
| `SuperficieCorporalForm` → `SuperficieCorporalInput` | `BsaInput` |
| `PesoIdealInput` | `IdealBodyWeightInput` |
| `DosePesoInput` | `DoseByWeightInput` |
| `GotejamentoInput` | `DripRateInput` |
| `DiluicaoInput` | `DilutionInput` |
| `InfusaoContinuaInput` | `ContinuousInfusionInput` |
| `CockcroftInput` | `CreatinineClearanceInput` |
| `OsmolalidadeInput` | `OsmolalityInput` |
| `CorrecaoSodioInput` | `CorrectedSodiumInput` |
| `CorrecaoCalcioInput` | `CorrectedCalciumInput` |

Matching: `AnionGapInput`, `ChadsVascInput`, `CkdEpiInput`, `FraminghamInput`,
`GlasgowInput`, `HarrisBenedictInput`, `HasBledInput`, `Hba1cInput`,
`HollidaySegarInput`, `MdrdInput`, `QsofaInput`, `ShockIndexInput`, `SofaInput`.

### Finding: the logic layer already ships a registry

`src/logic/calculators/index.ts` exports `CALCULATORS`, keyed by the same 24 ids,
each `{ calculate, input, category }` — and its own doc comment says the design
agent's `CalculatorView` is expected to consume it.

**My `registry.ts` duplicates this.** After the merge it should read the
calculate functions from `CALCULATORS` instead of hand-wiring 24 dynamic imports,
keeping only the form components (which are display concerns and belong here).
That removes ~180 lines of duplication and deletes an entire class of drift bug.
This is a real simplification I did not make — it needs the merge to be worth doing.

### Store API deltas that affect this branch

Verified by grepping actual usage:

| Member I use | Real store | Action |
|---|---|---|
| `history.entries`, `.add`, `.clear` | present | none |
| `history.latest` | **absent** | `HomeView` → `entries.slice(0, 6)` |
| `history.isEmpty` | **absent** | `HistoryView` → `entries.length === 0` |
| `favorites.ids`, `.toggle`, `.isFavorite` | present | none |
| — | `favorites.clear` exists | optional "clear all" |

The real history store also exposes `count` and a `randomId()` helper, and wraps
storage access so it is SSR-safe.

### Four-step merge

1. **Types** — delete `src/types/logic.ts` and `src/types/calculator-inputs.ts`;
   repoint imports to `@/logic/types` and the 11 renamed `Input` types.
   Also drop my local `Sex` in favour of the one `@/logic/types` now exports.
2. **Metadata** — replace `src/data/calculator-meta.ts`'s entries with a re-export
   of `CALCULATORS_META`, keeping `CALCULATOR_IDS`, `CalculatorId`,
   `requireMeta()` and the query helpers. Flatten the category nesting.
3. **Stores** — delete both composables; repoint to `@/stores/favorites` and
   `@/stores/history`; replace `latest` and `isEmpty` per the table above.
4. **Formulas** — point `registry.ts` at `CALCULATORS` (see the finding above).

After step 1, `tests/architecture/boundaries.test.ts` will fail its three `@/logic`
assertions **by design** — they are the merge checklist. Delete them alongside the
shims.

---

## 10. What I would do next

1. Merge the logic layer per §9, and simplify `registry.ts` onto `CALCULATORS`.
2. Run Lighthouse against `npm run preview` and confirm the PWA score.
3. Device-test the safe-area insets on a notched iPhone and an Android handset.
4. Add a visual-regression baseline once the palette decisions above are settled.
5. Resolve the 24-vs-22 count and the `OsmolaladeForm` typo in the agent spec
   itself, so the next run does not hit the same ambiguity.
