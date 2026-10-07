/**
 * Fundal height against gestational age — McDonald's rule.
 *
 * @module logic/calculators/ginecologia/alturaUterina
 */

import type { CalcResult, ReferenceRange } from '../../types'
import { assertRange } from '../../utils/validators'

/** Inputs for {@link calculateAlturaUterina}. */
export interface AlturaUterinaInput {
  /** Fundal height in centimetres, measured pubic symphysis to fundus. */
  alturaUterinaCm: number
  /** Gestational age in completed weeks. */
  igSemanas: number
  /** Days into the current week, accompanying `igSemanas`. */
  igDias?: number
}

/** First and last week of the window in which McDonald's rule holds. */
const RELIABLE_FROM_WEEKS = 20
const RELIABLE_TO_WEEKS = 36

/**
 * McDonald's rule: the fundal height in centimetres should equal the
 * gestational age in weeks, within about 2 cm.
 */
export function expectedAuByMcDonald(igSemanas: number): number {
  return igSemanas
}

/**
 * Classifies fundal height against gestational age.
 *
 * The measurement is read against the ±2 cm window only between 20 and 36
 * weeks; before 20 weeks the uterus is still partly intrapelvic and after 36
 * weeks the fundus reaches the costal margin, so the rule is not applicable and
 * the result is reported as informational in either direction.
 *
 * @param input - Measured fundal height and the gestational age.
 * @returns The signed difference from the expected height, with the
 *   classification and expected range.
 * @throws {CalcValidationError} When the measurement or the age is out of range.
 *
 * @reference McDonald W. Br Med J. 1906.
 * @reference Figueiró-Filho EA et al. Rev Bras Ginecol Obstet. 2006;28(9):509–517.
 * @reference FEBRASGO. Manual de Gestação de Alto Risco. 2022.
 * @reference Ministério da Saúde. Cadernos de Atenção Básica nº 32. 2012.
 *
 * @example
 * calculateAlturaUterina({ alturaUterinaCm: 28, igSemanas: 28 }).severity // 'normal'
 */
export function calculateAlturaUterina(input: AlturaUterinaInput): CalcResult {
  const { alturaUterinaCm, igSemanas, igDias = 0 } = input

  assertRange(alturaUterinaCm, 10, 50, 'alturaUterinaCm', 'cm')
  assertRange(igSemanas, 16, 42, 'igSemanas', 'semanas')
  assertRange(igDias, 0, 6, 'igDias', 'dias')

  const expectedAu = expectedAuByMcDonald(igSemanas)
  const delta = round1(alturaUterinaCm - expectedAu)
  const withinWindow = igSemanas >= RELIABLE_FROM_WEEKS && igSemanas <= RELIABLE_TO_WEEKS

  const subResults: CalcResult[] = [
    {
      label: 'AU medida',
      value: alturaUterinaCm,
      unit: 'cm',
      severity: 'info',
      interpretation: '',
    },
    {
      label: 'AU esperada (McDonald)',
      value: expectedAu,
      unit: 'cm',
      severity: 'info',
      interpretation: `Faixa normal: ${expectedAu - 2} a ${expectedAu + 2} cm, entre ${RELIABLE_FROM_WEEKS} e ${RELIABLE_TO_WEEKS} semanas.`,
    },
  ]

  let severity: CalcResult['severity']
  let label: string
  let interpretation: string

  if (!withinWindow) {
    severity = 'info'
    label = 'Fora da janela da regra'
    interpretation = `A regra de McDonald só é válida entre ${RELIABLE_FROM_WEEKS} e ${RELIABLE_TO_WEEKS} semanas; nesta idade gestacional ela não se aplica. AU medida: ${alturaUterinaCm} cm. Prefira datação e crescimento pela ultrassonografia.`
  } else if (Math.abs(delta) <= 2) {
    severity = 'normal'
    label = 'AU adequada para a idade gestacional'
    interpretation = `AU de ${alturaUterinaCm} cm dentro do esperado para ${igSemanas}s${igDias ? ` ${igDias}d` : ''} (esperado: ${expectedAu - 2} a ${expectedAu + 2} cm).`
  } else if (delta < 0 && delta >= -4) {
    severity = 'attention'
    label = 'AU pequena para a idade gestacional'
    interpretation = `AU de ${alturaUterinaCm} cm, ${formatAbs(delta)} cm abaixo do esperado. Investigue restrição de crescimento fetal, oligoidrâmnio ou erro de datação com ultrassonografia.`
  } else if (delta > 0 && delta <= 4) {
    severity = 'attention'
    label = 'AU grande para a idade gestacional'
    interpretation = `AU de ${alturaUterinaCm} cm, ${formatAbs(delta)} cm acima do esperado. Investigue macrossomia, polidrâmnio ou gemelaridade com ultrassonografia.`
  } else if (delta < 0) {
    severity = 'critical'
    label = 'AU muito pequena para a idade gestacional'
    interpretation = `AU de ${alturaUterinaCm} cm, ${formatAbs(delta)} cm abaixo do esperado (mais de 4 cm). Alta suspeita de restrição de crescimento fetal (RCIU) ou de erro de datação. Ultrassonografia obstétrica.`
  } else {
    severity = 'critical'
    label = 'AU muito grande para a idade gestacional'
    interpretation = `AU de ${alturaUterinaCm} cm, ${formatAbs(delta)} cm acima do esperado (mais de 4 cm). Avalie macrossomia, polidrâmnio ou gemelaridade. Ultrassonografia obstétrica.`
  }

  return {
    // Signed so the reader can see direction at a glance; `-0.0` cannot occur
    // because the rounding helper normalises zero.
    value: delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
    unit: 'cm',
    label,
    severity,
    interpretation,
    subResults,
    references: mcDonaldReferences(expectedAu),
  }
}

/**
 * The classification bands for a given expected height.
 *
 * The bounds are the integer-centimetre edges the classification actually
 * uses: a delta of exactly ±4 cm is still an `attention` band, so `critical`
 * starts one centimetre beyond.
 *
 * @param expectedAu - Expected fundal height in centimetres.
 * @returns The reference bands, from smallest to largest measurement.
 */
function mcDonaldReferences(expectedAu: number): ReferenceRange[] {
  return [
    { label: 'Muito pequena (suspeita de RCIU)', max: expectedAu - 5, severity: 'critical' },
    { label: 'Pequena para a IG', min: expectedAu - 4, max: expectedAu - 3, severity: 'attention' },
    { label: 'Adequada', min: expectedAu - 2, max: expectedAu + 2, severity: 'normal' },
    { label: 'Grande para a IG', min: expectedAu + 3, max: expectedAu + 4, severity: 'attention' },
    { label: 'Muito grande', min: expectedAu + 5, severity: 'critical' },
  ]
}

/** Rounds to one decimal. Adding zero collapses `-0` to `0`. */
function round1(value: number): number {
  return Math.round(value * 10) / 10 + 0
}

/** Absolute value rendered without a leading `-`, for prose. */
function formatAbs(value: number): string {
  return Math.abs(value).toFixed(1)
}