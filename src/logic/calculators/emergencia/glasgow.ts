/**
 * Glasgow Coma Scale with traumatic brain injury grading.
 *
 * @module logic/calculators/emergencia/glasgow
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertOneOf } from '../../utils/validators'

/** Eye opening score. */
export type GlasgowEyes = 1 | 2 | 3 | 4
/** Verbal response score. */
export type GlasgowVerbal = 1 | 2 | 3 | 4 | 5
/** Motor response score. */
export type GlasgowMotor = 1 | 2 | 3 | 4 | 5 | 6

/** Inputs for {@link calculateGlasgow}. */
export interface GlasgowInput {
  /** Eye opening: 4 spontaneous, 3 to voice, 2 to pain, 1 none. */
  eyes: GlasgowEyes
  /** Verbal response: 5 oriented … 1 none. */
  verbal: GlasgowVerbal
  /** Motor response: 6 obeys commands … 1 none. */
  motor: GlasgowMotor
}

const EYES: readonly GlasgowEyes[] = [1, 2, 3, 4]
const VERBAL: readonly GlasgowVerbal[] = [1, 2, 3, 4, 5]
const MOTOR: readonly GlasgowMotor[] = [1, 2, 3, 4, 5, 6]

export const GLASGOW_REFERENCES: ReferenceRange[] = [
  { label: 'Severe TBI (3–8)', min: 3, max: 8, severity: 'critical' },
  { label: 'Moderate TBI (9–12)', min: 9, max: 12, severity: 'attention' },
  { label: 'Mild TBI (13–15)', min: 13, max: 15, severity: 'attention' },
]

/** Eye-opening descriptors, keyed by score. */
export const EYES_LABELS: Record<GlasgowEyes, string> = {
  4: 'Spontaneous',
  3: 'To verbal stimulus',
  2: 'To pain',
  1: 'No response',
}

/** Verbal-response descriptors, keyed by score. */
export const VERBAL_LABELS: Record<GlasgowVerbal, string> = {
  5: 'Oriented',
  4: 'Confused conversation',
  3: 'Inappropriate words',
  2: 'Incomprehensible sounds',
  1: 'No verbal response',
}

/** Motor-response descriptors, keyed by score. */
export const MOTOR_LABELS: Record<GlasgowMotor, string> = {
  6: 'Obeys commands',
  5: 'Localises pain',
  4: 'Withdrawal from pain',
  3: 'Abnormal flexion',
  2: 'Extension to pain',
  1: 'No motor response',
}

/** Descriptions of each eye-opening score, highest first, for the form. */
export const EYES_SCALE: readonly { score: GlasgowEyes; label: string }[] = [
  { score: 4, label: EYES_LABELS[4] },
  { score: 3, label: EYES_LABELS[3] },
  { score: 2, label: EYES_LABELS[2] },
  { score: 1, label: EYES_LABELS[1] },
]

/** Descriptions of each verbal response score, highest first, for the form. */
export const VERBAL_SCALE: readonly { score: GlasgowVerbal; label: string }[] = [
  { score: 5, label: VERBAL_LABELS[5] },
  { score: 4, label: VERBAL_LABELS[4] },
  { score: 3, label: VERBAL_LABELS[3] },
  { score: 2, label: VERBAL_LABELS[2] },
  { score: 1, label: VERBAL_LABELS[1] },
]

/** Descriptions of each motor response score, highest first, for the form. */
export const MOTOR_SCALE: readonly { score: GlasgowMotor; label: string }[] = [
  { score: 6, label: MOTOR_LABELS[6] },
  { score: 5, label: MOTOR_LABELS[5] },
  { score: 4, label: MOTOR_LABELS[4] },
  { score: 3, label: MOTOR_LABELS[3] },
  { score: 2, label: MOTOR_LABELS[2] },
  { score: 1, label: MOTOR_LABELS[1] },
]

/** Minimum possible total. */
export const GLASGOW_MIN = 3
/** Maximum possible total. */
export const GLASGOW_MAX = 15

/**
 * Calculates the Glasgow Coma Scale total.
 *
 * total = eyes + verbal + motor
 *
 * @param input - The three component scores.
 * @returns `CalcResult` whose value is the total 3–15, with each component and
 *   its descriptor as sub-results.
 * @throws {CalcValidationError} When a component score is outside its permitted
 *   set (eyes 1–4, verbal 1–5, motor 1–6).
 *
 * @reference Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet. 1974;2(7872):81–84.
 *
 * @example
 * calculateGlasgow({ eyes: 4, verbal: 5, motor: 6 }).value // 15
 */
export function calculateGlasgow(input: GlasgowInput): CalcResult {
  const { eyes, verbal, motor } = input

  assertOneOf(eyes, EYES, 'eyes')
  assertOneOf(verbal, VERBAL, 'verbal')
  assertOneOf(motor, MOTOR, 'motor')

  const total = eyes + verbal + motor

  // Mild and moderate TBI both warrant attention; only severe TBI is critical.
  const severity = total >= 9 ? 'attention' : 'critical'
  const grade = total >= 13 ? 'Mild TBI' : total >= 9 ? 'Moderate TBI' : 'Severe TBI'

  return {
    label: 'Glasgow Coma Scale',
    value: total,
    unit: 'points',
    severity,
    interpretation: `GCS ${total} (E${eyes} V${verbal} M${motor}) — ${grade}. ${
      total < 9
        ? 'A total of 8 or below defines coma and is an indication for airway protection and urgent neuroimaging in head injury.'
        : 'Monitor for changes; a fall of 2 or more points requires reassessment and imaging.'
    }`,
    references: GLASGOW_REFERENCES,
    subResults: [
      {
        label: 'Eye opening',
        value: eyes,
        unit: 'points',
        severity: 'info',
        interpretation: EYES_LABELS[eyes],
      },
      {
        label: 'Verbal response',
        value: verbal,
        unit: 'points',
        severity: 'info',
        interpretation: VERBAL_LABELS[verbal],
      },
      {
        label: 'Motor response',
        value: motor,
        unit: 'points',
        severity: 'info',
        interpretation: MOTOR_LABELS[motor],
      },
    ],
  }
}