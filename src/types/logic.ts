/**
 * TEMPORARY SHIM — design worktree only.
 *
 * Mirrors `src/logic/types.ts` from the `feat/calc-logic` worktree so the UI
 * layer compiles and type-checks standalone. Nothing here implements clinical
 * logic; it is types plus the one error class the views need in order to render
 * a field-level validation message.
 *
 * MERGE: delete `src/types/logic.ts` and repoint imports from `@/types/logic`
 * to `@/logic/types`. The exported names are intentionally identical.
 */

export type Severity = 'normal' | 'attention' | 'critical' | 'info'

export type CalcCategory =
  | 'medicacao'
  | 'antropometria'
  | 'renal'
  | 'cardiologia'
  | 'emergencia'
  | 'laboratorial'
  | 'nutricao'

export interface ReferenceRange {
  label: string
  min?: number
  max?: number
  severity: Severity
}

export interface CalcResult {
  value: number | string
  unit?: string
  label: string
  severity: Severity
  interpretation: string
  references?: ReferenceRange[]
  /** Composite scores — Glasgow components, SOFA organ systems, etc. */
  subResults?: CalcResult[]
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

export class CalcValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message)
    this.name = 'CalcValidationError'
  }
}
