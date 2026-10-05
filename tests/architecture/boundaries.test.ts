import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CALCULATOR_IDS, CALCULATORS_META } from '@/data/calculator-meta'
import { CALCULATORS } from '@/logic/calculators'
import { CALCULATORS_META as LOGIC_META } from '@/logic/constants'

const SRC = resolve(process.cwd(), 'src')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const SOURCE_FILES = walk(SRC).filter((f) => /\.(ts|vue)$/.test(f))

/** Directories the design layer owns. `src/logic` and `src/stores` belong to the
 *  logic agent's worktree and are absent here by design. */
const UI_DIRS = ['components', 'views']

/** The single seam where the UI is allowed to reach a real calculation function. */
const WIRING_SEAM = join(SRC, 'components', 'calculators', 'registry.ts')

/** Frameworks and globals the logic layer must stay free of. */
const FORBIDDEN_IN_LOGIC = [
  { label: 'vue', pattern: /from\s+['"]vue['"]|from\s+['"]@vue\// },
  { label: 'pinia', pattern: /from\s+['"]pinia['"]/ },
  { label: 'browser API', pattern: /\b(window|document|localStorage|navigator)\s*[.[]/ },
]

/**
 * Module specifiers that `file` imports **as values**.
 *
 * `import type` is erased at build time, so it cannot ship clinical code and is
 * not reported. The `import` keyword must start a line, otherwise the match can
 * begin on an unrelated statement and run on to a later import — which is how a
 * naive single regex ends up flagging a file for a type-only import.
 */
function valueImports(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const statement = /^[ \t]*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm
  const specifiers: string[] = []
  for (const match of source.matchAll(statement)) {
    const clause = (match[1] ?? '').trim()
    if (clause.startsWith('type ')) continue
    specifiers.push(match[2] ?? '')
  }
  return specifiers
}

describe('architecture boundaries', () => {
  it('finds source files to check', () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(40)
  })

  it('carries both layers after the merge', () => {
    // `src/logic` and `src/stores` arrived with feat/calc-logic.
    for (const dir of ['logic', 'stores']) {
      expect(() => statSync(join(SRC, dir)), `src/${dir} must exist after the merge`).not.toThrow()
    }
  })

  it('keeps the logic layer free of framework and browser dependencies', () => {
    const logicFiles = walk(join(SRC, 'logic')).filter((f) => f.endsWith('.ts'))
    expect(logicFiles.length).toBeGreaterThan(20)

    for (const file of logicFiles) {
      const source = readFileSync(file, 'utf8')
      for (const { label, pattern } of FORBIDDEN_IN_LOGIC) {
        expect(
          pattern.test(source),
          `${relative(SRC, file)} must not reference ${label}`,
        ).toBe(false)
      }
    }
  })

  it('reaches calculation functions only through the registry seam', () => {
    // `src/logic/types` is fair game everywhere — it carries only types plus the
    // `CalcValidationError` class the view needs for `instanceof`. Importing a
    // formula from `src/logic/calculators` as a value is not: that must go
    // through the one seam, so there is a single place to audit what the UI can
    // execute. Type-only imports of the input interfaces are fine — the forms
    // declare their `@calculate` payload with them.
    const offenders = SOURCE_FILES.filter(
      (f) => f.startsWith(join(SRC, 'components')) || f.startsWith(join(SRC, 'views')),
    )
      .filter((f) => f !== WIRING_SEAM)
      .filter((file) => valueImports(file).some((s) => s.startsWith('@/logic/calculators/')))
      .map((f) => relative(SRC, f))
    expect(
      offenders,
      'only src/components/calculators/registry.ts may import calculation functions as values',
    ).toEqual([])
  })

  it.each(UI_DIRS)('src/%s contains no formula arithmetic', (dir) => {
    // Catches the classic mistake of pasting a formula into a form. Only the
    // `<script>` block is scanned: Tailwind class strings legitimately contain
    // `opacity/25`-style fractions that a naive text match would flag.
    const dirPath = join(SRC, dir)
    const offenders = SOURCE_FILES.filter((f) => f.startsWith(dirPath)).flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      const match = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)
      // A .vue with no script block cannot contain a formula.
      if (!match?.[1]) return []
      const script = match[1]
      const arithmetic = /(?<![-\w.])\d+(?:\.\d+)?\s*[*\/]\s*(?:\d+(?:\.\d+)?|\w+\s*[*\/])/.test(script)
      return arithmetic ? [relative(SRC, file)] : []
    })
    expect(
      offenders,
      'calculation arithmetic belongs in src/logic, never in the UI layer',
    ).toEqual([])
  })

  it('keeps every calculator id and its form directory in step', () => {
    for (const id of CALCULATOR_IDS) {
      const dir = join(SRC, 'components', 'calculators', id)
      expect(() => statSync(dir), `no form directory for ${id}`).not.toThrow()
      const files = readdirSync(dir).filter((f) => f.endsWith('.vue'))
      expect(files, `${id} has no form component`).toHaveLength(1)
    }
  })

  it('names every form after its metadata id', () => {
    for (const id of CALCULATOR_IDS) {
      const meta = CALCULATORS_META[id]!
      const file = readdirSync(join(SRC, 'components', 'calculators', id)).find((f) =>
        f.endsWith('.vue'),
      )
      // ImcForm, ChadsVascForm, … — PascalCase of the id.
      const expected = id
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
      expect(file).toBe(`${expected}Form.vue`)
      expect(meta.shortName.length).toBeGreaterThan(0)
    }
  })

  it('declares one input type and one function per calculator in the logic layer', () => {
    for (const id of CALCULATOR_IDS) {
      const entry = CALCULATORS[id as keyof typeof CALCULATORS]
      expect(entry, `${id} has no logic entry`).toBeDefined()
      expect(typeof entry.calculate, `${id}.calculate is not a function`).toBe('function')
    }
    expect(Object.keys(CALCULATORS)).toHaveLength(CALCULATOR_IDS.length)
  })

  it('keeps the UI and logic metadata registries on the same ids and categories', () => {
    // The design layer owns the pt-BR display copy and the logic layer the
    // domain copy, so the strings differ by design — the keys must not.
    expect(Object.keys(LOGIC_META)).toEqual([...CALCULATOR_IDS])
    for (const id of CALCULATOR_IDS) {
      expect(LOGIC_META[id]?.category, `${id} category`).toBe(CALCULATORS_META[id]?.category)
    }
  })
})