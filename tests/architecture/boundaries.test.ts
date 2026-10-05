import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CALCULATOR_IDS, CALCULATORS_META } from '@/data/calculator-meta'

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

describe('architecture boundaries', () => {
  it('finds source files to check', () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(40)
  })

  it('leaves the logic layer to the logic worktree', () => {
    // `src/logic` and `src/stores` are owned by feat/calc-logic. They must not
    // appear here, or the merge will conflict on files nobody reviewed.
    for (const dir of ['logic', 'stores']) {
      expect(() => statSync(join(SRC, dir)), `src/${dir} must not exist in this worktree`).toThrow()
    }
  })

  it.each(UI_DIRS)('src/%s never imports from src/logic', (dir) => {
    const dirPath = join(SRC, dir)
    const offenders = SOURCE_FILES.filter((f) => f.startsWith(dirPath)).filter((file) => {
      const source = readFileSync(file, 'utf8')
      return /from\s+['"]@\/logic\//.test(source)
    })
    expect(
      offenders.map((f) => relative(SRC, f)),
      'UI files must consume logic types via the @/types shim until the branch merges',
    ).toEqual([])
  })

  it.each(UI_DIRS)('src/%s imports no calculation function from the logic layer', (dir) => {
    const dirPath = join(SRC, dir)
    const offenders = SOURCE_FILES.filter((f) => f.startsWith(dirPath)).filter((file) => {
      const source = readFileSync(file, 'utf8')
      // `import type` is erased at build time, so only value imports can ship code.
      return /import\s+(?!type\s)[\s\S]{0,80}from\s+['"]@\/logic\//.test(source)
    })
    expect(offenders.map((f) => relative(SRC, f))).toEqual([])
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

  it('declares every shimmed input type and calculator', () => {
    const inputs = readFileSync(join(SRC, 'types', 'calculator-inputs.ts'), 'utf8')
    // One exported Input interface per calculator, by contract.
    const exported = inputs.match(/export interface \w+Input\b/g) ?? []
    expect(exported.length).toBe(CALCULATOR_IDS.length)
  })
})
