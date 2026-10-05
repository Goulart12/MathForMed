# MathForMed — design layer (`feat/design-system`)

Visual layer of MathForMed: Vue 3 + Tailwind v4 PWA for medical calculators at the
point of care. Owns `src/components/`, `src/views/`, `src/router/`,
`src/composables/`, `src/data/`, `src/types/`, `public/` and the root configs.

## Status

All 10 design tasks are implemented. `npm run build` is clean (zero TypeScript
errors in strict mode), `npx vitest run` passes 180 tests across 9 files, and the
service worker precaches 58 assets.

The clinical formulas are **not** here — they belong to the `feat/calc-logic`
worktree. See "Merging the logic layer" below.

## Commands

```bash
npm install
npm run dev            # vite dev server
npm run build          # vue-tsc -b && vite build
npm test               # vitest run
npm run test:coverage  # vitest run --coverage
npm run typecheck      # vue-tsc -b
```

## Design decisions worth knowing

**Tokens.** `src/assets/styles/tokens.css` declares every token inside
`@theme static`, which does two things at once: generates the Tailwind utilities
(`bg-primary-600`, `text-ink-muted`) and emits each token to `:root` as a plain
custom property so `var(--color-primary-600)` always resolves, used or not. A
Tailwind v4 `@theme` block is tree-shaken by default, so `static` is load-bearing
here, not decoration.

**Accessibility deviations.** The palette in the agent spec does not pass WCAG AA
when its colours are used as *text*. Measured with a contrast script:

| Pair | Ratio | Verdict |
|------|-------|---------|
| `--color-ok` on `--color-ok-bg` | 3.15:1 | fails AA |
| `--color-warn` on `--color-warn-bg` | 2.84:1 | fails AA |
| `--color-alert` on `--color-alert-bg` | 4.41:1 | fails AA |
| `--color-text-muted` on surface | 2.55:1 | fails AA |
| white on 5 of 7 `--color-cat-*` | 3.3–4.5:1 | fails AA |
| `--color-border` on input white | 1.28:1 | fails 1.4.11 |

The spec'd values are all still declared and still used for fills, borders, icons
and dots. Text and control boundaries use darker same-hue derivatives added
alongside them, every one of which clears AA:

- `--color-ok-text` `#15803d`, `--color-warn-text` `#a16207`,
  `--color-alert-text` `#b91c1c`, `--color-info-text` `#1e5180`
- `--color-ink-faint` `#64748b` (replaces `--color-ink-muted` for small text)
- `--color-line-strong` `#8593a8` (replaces `--color-border` for control borders)

Category count badges are a 12% category tint with `--color-ink` text rather than
white-on-accent, which is what keeps all seven categories compliant.

**Severity labels are Portuguese** (`NORMAL / ATENÇÃO / CRÍTICO / CÁLCULO`) even
though the spec listed `NORMAL / WARNING / CRITICAL`. The entire UI is pt-BR and a
half-English vocabulary reads as a bug. One line in `src/data/severity.ts` if the
English set is preferred.

**Decimal comma.** `AppInput` is a text input with `inputmode="decimal"`, not
`type="number"`. A pt-BR clinician types `1,75`, which `type="number"` discards
along with its spinners. The field keeps the raw string and emits a parsed number,
so a half-typed `1,` survives without the caret jumping. See the 14 `AppInput`
tests.

**Height in centimetres.** Forms collect height in cm and convert to metres in the
`@calculate` payload, because the logic layer's own field names are inconsistent
(`harris-benedict` takes `heightCm`, the others `heightM`) and cm is what a
clinician measures with. This is unit normalisation, not a formula — the
architecture test asserts no `src/components/` script contains arithmetic.

**Height is collected, not computed.** `AppInput` reports the raw value and each
form validates it; no component derives a clinical number from other inputs.

## Architecture tests

Two suites enforce the rules that are easy to erode:

- `tests/architecture/boundaries.test.ts` — asserts `src/logic` and `src/stores`
  do not exist here, that no file under `src/components` or `src/views` imports
  from `@/logic`, that no `<script>` block contains formula arithmetic, and that
  every calculator id has exactly one correctly-named form.
- `tests/architecture/touch-targets.test.ts` — renders every UI, layout and view
  component (empty *and* populated) and asserts each interactive element carries a
  ≥48px Tailwind height utility. This caught six real regressions: the search clear
  button, `AppToggle` segments, the history clear button, both search chips and
  the toast dismiss target.

`tests/app.integration.test.ts` boots the real router + Pinia + views and walks the
primary journeys, including loading all 24 calculator forms.

## Merging the logic layer

Per your instruction, this worktree stubs nothing in `src/logic` or `src/stores`.
Instead there are three design-owned shims, each with a `MERGE:` note at the top
of the file. The merge is four mechanical steps:

1. **Types** — delete `src/types/logic.ts` and `src/types/calculator-inputs.ts`;
   repoint imports to `@/logic/types` and `@/logic/calculators/<category>/<name>`.
   Exported names match 1:1 by design.
2. **Metadata** — replace the body of `src/data/calculator-meta.ts` with
   `export { CALCULATORS_META } from '@/logic/constants'`, keeping the
   `CALCULATOR_IDS` tuple, `CalculatorId`, and the query helpers
   (`searchCalculators`, `foldText`, …) which are display-layer concerns.
3. **Stores** — delete `src/composables/useFavorites.ts` and
   `src/composables/useHistory.ts`; repoint imports to `@/stores/favorites` and
   `@/stores/history`. Both shims already use the logic branch's store ids
   (`favorites`, `history`) and storage keys (`medcalc-favorites`,
   `medcalc-history`), so no user data needs migrating.
4. **Formulas** — fill in each `calculate` in `src/components/calculators/registry.ts`:

   ```ts
   imc: {
     meta: requireMeta('imc'),
     form: defineAsyncComponent(() => import('@/components/calculators/imc/ImcForm.vue')),
     calculate: (i) => import('@/logic/calculators/antropometria/imc').then(m => m.calculateBmi(i)),
   },
   ```

   `calculate` is typed `(input: never) => CalcResult` so each form's payload is
   forced to match its own calculator. Until then every entry throws a named
   Portuguese error and the UI shows it as an inline alert rather than a blank
   page — `tests/app.integration.test.ts` covers exactly that path.

After step 4, `tests/architecture/boundaries.test.ts` will fail on the three
`@/logic` assertions by design — those lines are the merge's checklist. Delete them
at the same time as the shims.

## Not verified here

- **Lighthouse PWA score ≥ 90.** No browser or Lighthouse binary in this
  environment. The inputs it scores are in place and served correctly (manifest
  with three icons including a maskable, `sw.js`, `viewport-fit=cover`, iOS meta
  tags, 58 precached assets, 180×180 apple-touch-icon), but the score itself is
  unmeasured.
- **Real-device feel** of the micro-interactions and safe-area insets.

## Note on the spec

Task 7 says "22 total" but the table lists 24, and Task 3 lists 24 ids. All 24 are
implemented. `osmolalidade`'s component is spelled `OsmolalidadeForm` rather than
the spec's `OsmolaladeForm`, for consistency with the other 23.
