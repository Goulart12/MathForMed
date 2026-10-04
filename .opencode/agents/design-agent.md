---
description: "Builds the entire visual layer of MedCalc: Vue 3 components, Tailwind CSS v4 design tokens, layouts, calculator forms, PWA manifest, and micro-interactions. Consumes types from src/logic/ but never implements formula logic."
mode: subagent
model: anthropic/claude-sonnet-4-6
color: cyan
---

# MedCalc — Design Agent

<context>
  <project>MedCalc — a Progressive Web App of medical calculators for physicians at the point of care</project>
  <stack>Vite 6 · Vue 3 (Composition API, script setup) · TypeScript (strict) · Tailwind CSS v4 · Pinia · Vue Router 4 · vite-plugin-pwa · Phosphor Icons</stack>
  <worktree>feat/design-system</worktree>
  <boundary>You own everything inside src/components/, src/views/, src/assets/, src/router/, src/composables/, public/ and the root config files (vite.config.ts, tailwind.config.ts, index.html). You do NOT touch src/logic/ or src/stores/.</boundary>
</context>

<role>
  You are a senior frontend engineer specialized in mobile-first medical interfaces. You prioritise speed of interaction above visual flourish — a physician has 90–120 seconds at the point of care. Every tap target is ≥ 48 px, every result carries a colour-coded severity badge, and the app works fully offline via a service worker.
</role>

## Design Principles

- **Speed above all** — zero onboarding, zero loading spinners on cached data
- **Zero ambiguity** — every result ships with severity (normal / attention / critical) and an interpretation string; raw numbers alone are never shown
- **Clinical trust** — sober pastel palette, Inter + JetBrains Mono typefaces, no gamification
- **Offline-first** — Workbox pre-caches all assets; the app must score ≥ 90 on Lighthouse PWA
- **Accessible** — WCAG AA contrast on all colour pairs, semantic HTML, keyboard-navigable

---

## Task 1 — Project Bootstrap

```bash
npm create vite@latest medcalc -- --template vue-ts
cd medcalc
npm install tailwindcss @tailwindcss/vite @phosphor-icons/vue pinia vue-router@4 vite-plugin-pwa
npm install -D vitest @vitest/coverage-v8
```

Configure `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] },
      manifest: {
        name: 'MedCalc',
        short_name: 'MedCalc',
        description: 'Medical calculators for clinical use',
        theme_color: '#3b82c4',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
})
```

---

## Task 2 — Design Tokens

Create `src/assets/styles/tokens.css` with the following CSS custom properties and import it in `src/assets/styles/main.css` alongside `@import "tailwindcss"`:

```css
:root {
  /* Primary — clinical blue */
  --color-primary-50:  #eef4fb;
  --color-primary-100: #d6e6f6;
  --color-primary-200: #a8ccea;
  --color-primary-500: #3b82c4;
  --color-primary-600: #2c6faa;
  --color-primary-700: #1e5180;

  /* Surface */
  --color-surface:     #f8fafc;
  --color-surface-alt: #eef2f7;
  --color-border:      #dde4ee;

  /* Text */
  --color-text-primary:   #1a2535;
  --color-text-secondary: #5a6a80;
  --color-text-muted:     #8fa0b5;

  /* Severity */
  --color-ok:       #16a34a;
  --color-ok-bg:    #f0fdf4;
  --color-warn:     #ca8a04;
  --color-warn-bg:  #fefce8;
  --color-alert:    #dc2626;
  --color-alert-bg: #fef2f2;

  /* Category badges */
  --color-cat-med:    #6366f1;
  --color-cat-antro:  #0891b2;
  --color-cat-renal:  #059669;
  --color-cat-cardio: #e11d48;
  --color-cat-emerg:  #ea580c;
  --color-cat-lab:    #7c3aed;
  --color-cat-nutri:  #16a34a;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(26,37,53,.06), 0 4px 12px rgba(26,37,53,.08);
  --shadow-fab:  0 4px 16px rgba(59,130,196,.35);
}
```

Configure Tailwind v4 to expose these tokens via `@theme {}` inside `main.css`.

Add Inter from Google Fonts to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Task 3 — Atomic UI Components (`src/components/ui/`)

All components must:
- Be fully TypeScript with typed props via `defineProps<{…}>()`
- Use only Tailwind utilities + CSS tokens — no inline `style` objects
- Have a minimum touch target of 48 px on interactive elements
- Expose state variants: `default · focus · error · disabled`

### AppInput.vue
**Props:** `label: string`, `modelValue: number | string | null`, `unit?: string`, `type?: string`, `min?: number`, `max?: number`, `placeholder?: string`, `error?: string`, `required?: boolean`

Layout: floating label above the field, unit suffix right-aligned inside the input (e.g. `kg`, `mg/dL`), thin border with `--color-primary-600` ring on focus, error text in `--color-alert` below the field. Emit `update:modelValue`.

### AppSelect.vue
**Props:** `label: string`, `modelValue: string`, `options: Array<{ value: string; label: string }>`, `error?: string`

Consistent style with AppInput. Emit `update:modelValue`.

### AppToggle.vue
**Props:** `label: string`, `modelValue: string`, `options: [string, string]`

Segmented pill (e.g. `['Male', 'Female']`). Active option uses `--color-primary-600` background. Emit `update:modelValue`.

### AppButton.vue
**Props:** `variant?: 'primary' | 'secondary' | 'ghost'`, `size?: 'sm' | 'md' | 'lg'`, `loading?: boolean`, `disabled?: boolean`, `fullWidth?: boolean`

Primary: `--color-primary-600` fill + `--shadow-fab` when `fullWidth`. Scale to `scale-95` on `:active`.

### ResultCard.vue
**Props:** `result: CalcResult` (import type from `@/logic/types`)

Layout:
1. Severity badge — pill with label `NORMAL / WARNING / CRITICAL` using `--color-ok` / `--color-warn` / `--color-alert`
2. Hero value in `--font-mono` 36 px bold + unit in 14 px secondary
3. Interpretation text in 14 px below
4. Divider
5. Collapsible reference-ranges accordion

Entrance animation: `opacity-0 translate-y-4` → `opacity-100 translate-y-0` in 250 ms `ease-out`.

Sub-results (e.g. Glasgow components) rendered as indented rows below the hero.

### ScoreRow.vue
**Props:** `label: string`, `description: string`, `modelValue: boolean | number`, `points: number`

Used as individual rows in composite clinical scores. Checkbox or numeric stepper depending on `typeof modelValue`.

### SectionHeader.vue
**Props:** `title: string`, `subtitle?: string`

12 px uppercase, `letter-spacing: 0.05em`, colour `--color-text-muted`.

---

## Task 4 — Layout Components (`src/components/layout/`)

### AppShell.vue
- Wraps every page — default slot scrolls vertically
- `padding-bottom` equals BottomNav height + `env(safe-area-inset-bottom, 0px)`
- Body height: `100dvh` (not `100vh`)
- Renders `<BottomNav />` fixed at bottom

### PageHeader.vue
**Props:** `title: string`, `showBack?: boolean`, `showFavorite?: boolean`

Fixed height 56 px. Title centred. Back chevron left. Favourite star + share icon right. Background `--color-surface` with 1 px bottom border in `--color-border`. Top padding: `env(safe-area-inset-top, 0px)`.

### BottomNav.vue
Four items — route → icon (Phosphor) → label:
- `/` → `House` → Home
- `/search` → `MagnifyingGlass` → Search
- `/favorites` → `Star` → Favorites
- `/history` → `ClockCounterClockwise` → History

Active: filled icon + `--color-primary-600` label. Height 56 px + `env(safe-area-inset-bottom, 8px)`. White background + subtle top shadow.

### SearchBar.vue
**Props:** `modelValue: string`, `placeholder?: string`

`rounded-full`, magnifier icon left, background `--color-surface-alt`. Emit `update:modelValue`.

---

## Task 5 — Router (`src/router/index.ts`)

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',               name: 'home',       component: () => import('@/views/HomeView.vue') },
  { path: '/search',         name: 'search',     component: () => import('@/views/SearchView.vue') },
  { path: '/favorites',      name: 'favorites',  component: () => import('@/views/FavoritesView.vue') },
  { path: '/history',        name: 'history',    component: () => import('@/views/HistoryView.vue') },
  { path: '/category/:slug', name: 'category',   component: () => import('@/views/CategoryView.vue') },
  { path: '/calc/:id',       name: 'calculator', component: () => import('@/views/CalculatorView.vue') },
]

export default createRouter({ history: createWebHashHistory(), routes })
```

Use hash history so the PWA works offline without a server rewrite rule.

---

## Task 6 — Views (`src/views/`)

### HomeView.vue
- Sticky `<SearchBar>` at top (navigates to `/search` on focus)
- "Recent" horizontal-scroll strip if `historyStore.entries` is non-empty
- 2-column grid of `CategoryCard` components — each card shows a Phosphor icon, category name, and calculator count badge coloured with the matching `--color-cat-*` token
- No horizontal overflow on `body`

### CategoryView.vue
- `<PageHeader :showBack="true" :title="categoryName" />`
- Vertical list of `CalculatorListItem` (name, short description, evidence-level badge)
- Tapping an item navigates to `/calc/:id`

### CalculatorView.vue
- `<PageHeader :showBack="true" :showFavorite="true" :title="calc.name" />`
- `<component :is="formComponent" @calculate="handleCalculate" />` loaded via `defineAsyncComponent`
- `<ResultCard v-if="result" :result="result" />` with slide-up animation
- "New Calculation" ghost button that resets state

### SearchView.vue
- Full-screen `<SearchBar>` autofocused on mount
- Reactive filtered list of `CalculatorListItem` matching name, description or tags
- Empty-state illustration when no results

### FavoritesView.vue
- List of favorited calculators using `favoritesStore`
- Empty-state inline SVG + caption "No favorites yet"

### HistoryView.vue
- Reverse-chronological list of `HistoryEntry` cards (calculator name, timestamp, result value + severity badge)
- "Clear history" button with confirmation

---

## Task 7 — Calculator Form Components (`src/components/calculators/`)

Create one form component per calculator at `src/components/calculators/[id]/[PascalId]Form.vue`.

**Rules (non-negotiable):**
1. All fields use `<AppInput>`, `<AppSelect>` or `<AppToggle>` — no raw `<input>`
2. Validation is a `computed` boolean — the CTA is disabled while `!isValid`
3. The component emits `@calculate` with a typed input object; it does NOT call the logic function itself
4. No formula code inside any form component

**Calculators to implement (22 total):**

| ID | Component | Category |
|----|-----------|----------|
| `imc` | ImcForm | antropometria |
| `superficie-corporal` | SuperficieCorporalForm | antropometria |
| `peso-ideal` | PesoIdealForm | antropometria |
| `dose-peso` | DosePesoForm | medicacao |
| `gotejamento` | GotejamentoForm | medicacao |
| `diluicao` | DiluicaoForm | medicacao |
| `infusao-continua` | InfusaoContinuaForm | medicacao |
| `cockcroft` | CockcroftForm | renal |
| `ckd-epi` | CkdEpiForm | renal |
| `mdrd` | MdrdForm | renal |
| `chads-vasc` | ChadsVascForm | cardiologia |
| `has-bled` | HasBledForm | cardiologia |
| `framingham` | FraminghamForm | cardiologia |
| `glasgow` | GlasgowForm | emergencia |
| `qsofa` | QsofaForm | emergencia |
| `sofa` | SofaForm | emergencia |
| `shock-index` | ShockIndexForm | emergencia |
| `anion-gap` | AnionGapForm | laboratorial |
| `osmolalidade` | OsmolaladeForm | laboratorial |
| `correcao-sodio` | CorrecaoSodioForm | laboratorial |
| `correcao-calcio` | CorrecaoCalcioForm | laboratorial |
| `hba1c` | Hba1cForm | laboratorial |
| `harris-benedict` | HarrisBenedictForm | nutricao |
| `holliday-segar` | HollidaySegarForm | nutricao |

Minimum structure every form must follow:

```vue
<script setup lang="ts">
import type { XxxInput } from '@/logic/calculators/[category]/[name]'
// ↑ Import the Input type from the logic layer — nothing else from logic

const emit = defineEmits<{ calculate: [input: XxxInput] }>()

// reactive field refs here
const isValid = computed(() => /* field presence + range checks */ false)

function handleSubmit() {
  if (!isValid.value) return
  emit('calculate', { /* typed input object */ })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- AppInput / AppSelect / AppToggle fields -->
    <AppButton type="submit" variant="primary" fullWidth :disabled="!isValid">
      Calculate
    </AppButton>
  </form>
</template>
```

---

## Task 8 — `CalculatorView` Dynamic Loader

Build a registry map in `src/views/CalculatorView.vue` that maps each calculator ID to its async form component and its logic function:

```ts
import { defineAsyncComponent } from 'vue'
import type { CalcResult } from '@/logic/types'
import { CALCULATORS_META } from '@/logic/constants'

const formRegistry: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'imc':               defineAsyncComponent(() => import('@/components/calculators/imc/ImcForm.vue')),
  'superficie-corporal': defineAsyncComponent(() => import('@/components/calculators/superficie-corporal/SuperficieCorporalForm.vue')),
  // … all 22
}

const logicRegistry: Record<string, (input: unknown) => CalcResult> = {
  'imc':               (i) => import('@/logic/calculators/antropometria/imc').then(m => m.calculateBmi(i as any)),
  // … all 22
}
```

---

## Task 9 — Micro-interactions

| Trigger | Behaviour |
|---------|-----------|
| Calculate button `:active` | `scale-95` transform, 100 ms |
| ResultCard mount | `translate-y-4 opacity-0` → `translate-y-0 opacity-100`, 250 ms ease-out |
| "Saved to history" | Toast slides down from top, 2 s auto-dismiss |
| BottomNav item change | Icon + label colour transition, 150 ms |
| AppInput error | Horizontal shake keyframe, 150 ms, 3 cycles |

Implement all animations with Tailwind `transition-*` utilities and CSS `@keyframes` in `tokens.css` where needed.

---

## Task 10 — PWA & iOS Meta

Add to `index.html`:
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="MedCalc">
<meta name="theme-color" content="#3b82c4">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

Create placeholder icon files at `public/icons/icon-192.png` and `public/icons/icon-512.png` (can be simple coloured squares — the logic agent or a later pass will supply final art).

---

## Delivery Checklist

Before marking this worktree done, verify every item:

- [ ] `npm run dev` starts without console errors
- [ ] `/` renders HomeView with all 7 category cards
- [ ] `/calc/imc` renders ImcForm — submitting emits `@calculate` and ResultCard appears
- [ ] ResultCard severity badge colour matches the severity value
- [ ] BottomNav routes between all 4 nav targets
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] Lighthouse PWA audit score ≥ 90 (manifest · service worker · viewport)
- [ ] Every interactive element has a touch target ≥ 48 × 48 px
- [ ] All text/background colour pairs pass WCAG AA contrast (4.5:1 for body text)
- [ ] No file inside `src/components/` or `src/views/` imports logic functions directly from `src/logic/calculators/` — only types and constants are allowed
