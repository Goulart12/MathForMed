/**
 * Global domain types for MathForMed.
 *
 * This module is the single source of truth shared by the logic layer
 * (`src/logic/**`) and the presentation layer (`src/components/**`, `src/views/**`).
 *
 * @module logic/types
 */

/**
 * Clinical severity of a computed value.
 *
 * - `normal`   — within the expected reference range
 * - `attention` — outside the reference range; clinically relevant, not emergent
 * - `critical`  — outside the reference range and requiring immediate action
 * - `info`      — descriptive output (doses, volumes, scores without a risk band)
 */
export type Severity = 'normal' | 'attention' | 'critical' | 'info'

/**
 * The result of a single calculation.
 *
 * Every calculation in this application returns a fully populated `CalcResult`;
 * a bare number is never an acceptable return value (see the logic agent's
 * absolute rules).
 */
export interface CalcResult {
  /** Computed value. Numbers are preferred; strings are allowed for composite text output. */
  value: number | string
  /** Unit of measure, e.g. `kg/m²`, `mL/min`, `gtt/min`, `mEq/L`. */
  unit?: string
  /** Short name of the computed value, e.g. `Required Dose`. */
  label: string
  /** Clinical severity classification of `value`. */
  severity: Severity
  /** Human-readable clinical interpretation, always populated. */
  interpretation: string
  /** Published reference ranges backing the severity classification. */
  references?: ReferenceRange[]
  /** Nested results for composite scores (Glasgow components, eGFR + stage, etc.). */
  subResults?: CalcResult[]
}

/** A published reference interval with the severity assigned to it. */
export interface ReferenceRange {
  /** Name of the band, e.g. `G3b Moderately-to-severely decreased`. */
  label: string
  /** Inclusive lower bound. Omitted for open-ended `≥` bands. */
  min?: number
  /** Inclusive upper bound. Omitted for open-ended `≤` bands. */
  max?: number
  /** Severity applied when `value` falls inside this band. */
  severity: Severity
}

/** Registry metadata describing one calculator. */
export interface CalculatorMeta {
  /** Stable kebab-case id. Must match the vue-router `/calc/:id` param. */
  id: string
  /** Full display name, e.g. `Clearance of Creatinine (Cockcroft-Gault)`. */
  name: string
  /** Abbreviated display name for tight layouts, e.g. `Cockcroft-Gault`. */
  shortName: string
  /** One-line clinical description shown in lists and search. */
  description: string
  /** Grouping used by the home grid and category pages. */
  category: CalcCategory
  /** Free-form search keywords. */
  tags: string[]
  /** Oxford-style evidence grade for the underlying formula. */
  evidenceLevel?: 'A' | 'B' | 'C'
  /** Primary literature citation backing the formula. */
  reference?: string
}

/** Top-level calculator categories. */
export type CalcCategory =
  | 'medicacao'
  | 'antropometria'
  | 'renal'
  | 'cardiologia'
  | 'emergencia'
  | 'laboratorial'
  | 'nutricao'

/** Union of every category id, useful for iteration and exhaustive checks. */
export const CALC_CATEGORIES: readonly CalcCategory[] = [
  'medicacao',
  'antropometria',
  'renal',
  'cardiologia',
  'emergencia',
  'laboratorial',
  'nutricao',
] as const

/** Biological sex used by sex-specific formulas (never gender identity). */
export type Sex = 'M' | 'F'

/**
 * Error thrown when a calculator receives an out-of-range or malformed input.
 *
 * Errors are thrown (never returned) so that an invalid result can never reach
 * the UI as if it were clinically valid.
 */
export class CalcValidationError extends Error {
  constructor(
    /** Name of the offending input field, matching the calculator's `Input` key. */
    public readonly field: string,
    message: string,
  ) {
    super(message)
    this.name = 'CalcValidationError'
    // Preserve the prototype chain when the output target is ES5.
    Object.setPrototypeOf(this, CalcValidationError.prototype)
  }
}