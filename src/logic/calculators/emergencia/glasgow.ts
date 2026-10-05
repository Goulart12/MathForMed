/**
 * Glasgow Coma Scale with traumatic brain injury grading.
 *
 * @module logic/calculators/emergencia/glasgow
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertOneOf } from '../../utils/validators'
import { pluralize } from '../../utils/units'

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
  { label: 'TCE grave (3–8)', min: 3, max: 8, severity: 'critical' },
  { label: 'TCE moderado (9–12)', min: 9, max: 12, severity: 'attention' },
  { label: 'TCE leve (13–15)', min: 13, max: 15, severity: 'attention' },
]

/** Eye-opening descriptors, keyed by score. */
export const EYES_LABELS: Record<GlasgowEyes, string> = {
  4: 'Espontânea',
  3: 'Ao estímulo verbal',
  2: 'À dor',
  1: 'Sem resposta',
}

/** Verbal-response descriptors, keyed by score. */
export const VERBAL_LABELS: Record<GlasgowVerbal, string> = {
  5: 'Orientado',
  4: 'Conversa confusa',
  3: 'Palavras inapropriadas',
  2: 'Sons incompreensíveis',
  1: 'Sem resposta verbal',
}

/** Motor-response descriptors, keyed by score. */
export const MOTOR_LABELS: Record<GlasgowMotor, string> = {
  6: 'Obedece comandos',
  5: 'Localiza a dor',
  4: 'Retirada à dor',
  3: 'Flexão anormal',
  2: 'Extensão à dor',
  1: 'Sem resposta motora',
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
  const grade = total >= 13 ? 'TCE leve' : total >= 9 ? 'TCE moderado' : 'TCE grave'

  return {
    label: 'Escala de Coma de Glasgow',
    value: total,
    unit: pluralize(total, 'ponto'),
    severity,
    interpretation: `GCS ${total} (E${eyes} V${verbal} M${motor}) — ${grade}. ${
      total < 9
        ? 'Um total de 8 ou menos define coma e é indicação de proteção das vias aéreas e de neuroimagem urgente no traumatismo craniano.'
        : 'Monitore mudanças; uma queda de 2 ou mais pontos exige reavaliação e imagem.'
    }`,
    references: GLASGOW_REFERENCES,
    subResults: [
      {
        label: 'Abertura ocular',
        value: eyes,
        unit: pluralize(eyes, 'ponto'),
        severity: 'info',
        interpretation: EYES_LABELS[eyes],
      },
      {
        label: 'Resposta verbal',
        value: verbal,
        unit: pluralize(verbal, 'ponto'),
        severity: 'info',
        interpretation: VERBAL_LABELS[verbal],
      },
      {
        label: 'Resposta motora',
        value: motor,
        unit: pluralize(motor, 'ponto'),
        severity: 'info',
        interpretation: MOTOR_LABELS[motor],
      },
    ],
  }
}