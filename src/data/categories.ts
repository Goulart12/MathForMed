import {
  PhBowlFood,
  PhFlask,
  PhHeart,
  PhPill,
  PhRuler,
  PhSiren,
  PhStethoscope,
} from '@phosphor-icons/vue'
import type { Component } from 'vue'
import type { CalcCategory } from '@/types/logic'

export interface CategoryDef {
  slug: CalcCategory
  label: string
  tagline: string
  icon: Component
  /** Tailwind class fragment — solid accent, used for icons and 1px rings. */
  accent: string
  /** Tailwind class fragment — 12 % tint, used behind the icon and count badge. */
  tint: string
}

/**
 * Display metadata for the seven calculator categories. Owned by the design
 * layer (icons and copy are presentation), keyed by the `CalcCategory` union
 * that the logic layer uses for `CalculatorMeta.category`.
 */
export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'medicacao',
    label: 'Medicação',
    tagline: 'Doses, gotejamento e diluições',
    icon: PhPill,
    accent: 'text-cat-med',
    tint: 'bg-cat-med/12',
  },
  {
    slug: 'antropometria',
    label: 'Antropometria',
    tagline: 'Peso, altura e superfície corporal',
    icon: PhRuler,
    accent: 'text-cat-antro',
    tint: 'bg-cat-antro/12',
  },
  {
    slug: 'renal',
    label: 'Renal',
    tagline: 'Filtro glomerular e depuração',
    icon: PhStethoscope,
    accent: 'text-cat-renal',
    tint: 'bg-cat-renal/12',
  },
  {
    slug: 'cardiologia',
    label: 'Cardiologia',
    tagline: 'Risco trombótico e escores',
    icon: PhHeart,
    accent: 'text-cat-cardio',
    tint: 'bg-cat-cardio/12',
  },
  {
    slug: 'emergencia',
    label: 'Emergência',
    tagline: 'Consciência, sepse e choque',
    icon: PhSiren,
    accent: 'text-cat-emerg',
    tint: 'bg-cat-emerg/12',
  },
  {
    slug: 'laboratorial',
    label: 'Laboratorial',
    tagline: 'Eletrólitos, osmolaridade e HbA1c',
    icon: PhFlask,
    accent: 'text-cat-lab',
    tint: 'bg-cat-lab/12',
  },
  {
    slug: 'nutricao',
    label: 'Nutrição',
    tagline: 'Metabolismo basal e hidratação',
    icon: PhBowlFood,
    accent: 'text-cat-nutri',
    tint: 'bg-cat-nutri/12',
  },
]

const CATEGORY_BY_SLUG = new Map<CalcCategory, CategoryDef>(
  CATEGORIES.map((c) => [c.slug, c]),
)

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORY_BY_SLUG.get(slug as CalcCategory)
}

/** Falls back to a neutral label so a bad slug can never blank the screen. */
export function categoryLabel(slug: string): string {
  return getCategory(slug)?.label ?? slug
}
