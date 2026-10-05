/**
 * KDIGO chronic kidney disease G1–G5 staging, shared by the three renal
 * calculators so that a CrCl of 55 mL/min is staged identically no matter
 * which equation produced it.
 *
 * @module logic/utils/kdigo
 */

import type { ReferenceRange } from '../types'

/** A single KDIGO stage with its label, severity and published GFR interval. */
export interface KdigoStage extends ReferenceRange {
  /** Stage code, e.g. `G3b`. */
  stage: string
}

/**
 * KDIGO 2024 GFR stages, kept as a tuple so that the positional lookups in
 * {@link classifyKdigo} stay checked against the published length.
 *
 * @reference KDIGO. Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117–S314.
 */
export const KDIGO_STAGES = [
  { stage: 'G1', label: 'G1 — Normal ou elevada', min: 90, severity: 'normal' },
  { stage: 'G2', label: 'G2 — Ligeiramente reduzida', min: 60, max: 89, severity: 'normal' },
  {
    stage: 'G3a',
    label: 'G3a — Ligeiramente a moderadamente reduzida',
    min: 45,
    max: 59,
    severity: 'attention',
  },
  {
    stage: 'G3b',
    label: 'G3b — Moderadamente a severamente reduzida',
    min: 30,
    max: 44,
    severity: 'attention',
  },
  {
    stage: 'G4',
    label: 'G4 — Severamente reduzida',
    min: 15,
    max: 29,
    severity: 'critical',
  },
  { stage: 'G5', label: 'G5 — Falência renal', max: 14, severity: 'critical' },
] as const

/**
 * Returns the KDIGO stage that contains `gfr`.
 *
 * @param gfr - Glomerular filtration rate in mL/min/1.73 m².
 * @returns The matching stage. Values below the G5 ceiling clamp to G5; NaN
 *   input throws from the caller before reaching here.
 *
 * @reference KDIGO. Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117–S314.
 */
export function classifyKdigo(gfr: number): KdigoStage {
  const rounded = Math.round(gfr)

  if (rounded >= 90) return KDIGO_STAGES[0]
  if (rounded >= 60) return KDIGO_STAGES[1]
  if (rounded >= 45) return KDIGO_STAGES[2]
  if (rounded >= 30) return KDIGO_STAGES[3]
  if (rounded >= 15) return KDIGO_STAGES[4]
  return KDIGO_STAGES[5]
}

/**
 * Full reference-range list for a GFR-based result, so the UI can render the
 * complete staging table as an accordion.
 */
export const KDIGO_REFERENCES: ReferenceRange[] = KDIGO_STAGES.map(
  ({ label, min, max, severity }: KdigoStage) => ({ label, min, max, severity }),
)