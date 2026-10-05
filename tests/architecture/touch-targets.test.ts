import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ScoreRow from '@/components/ui/ScoreRow.vue'
import SeverityBadge from '@/components/ui/SeverityBadge.vue'
import CalculatorListItem from '@/components/ui/CalculatorListItem.vue'
import CategoryCard from '@/components/ui/CategoryCard.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import SearchBar from '@/components/layout/SearchBar.vue'
import HomeView from '@/views/HomeView.vue'
import CategoryView from '@/views/CategoryView.vue'
import SearchView from '@/views/SearchView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import HistoryView from '@/views/HistoryView.vue'
import { CATEGORIES } from '@/data/categories'
import { CALCULATORS_META } from '@/data/calculator-meta'
import { useFavoritesStore } from '@/composables/useFavorites'
import { useHistoryStore } from '@/composables/useHistory'
import type { CalcResult } from '@/types/logic'

/**
 * Enforces the agent's hard rule that every interactive element offers at least
 * a 48 × 48 px touch target.
 *
 * The check runs against the *rendered* DOM rather than the template source, so
 * `:class` bindings resolve for real. jsdom loads no stylesheet, so instead of
 * measuring layout this asserts the Tailwind height utility on each element —
 * the spacing scale is rem-based, so `h-12` = 3rem = 48px and the rule reduces
 * to `>= 12` on the numeric suffix.
 */

/**
 * Views import `RouterLink` directly, so a `global.components` registration
 * loses to the real component — the module itself has to be replaced.
 */
vi.mock('vue-router', () => {
  const RouterLink = defineComponent({
    name: 'RouterLink',
    props: ['to'],
    setup: (_props, { slots }) => () => h('a', {}, slots.default?.()),
  })
  return {
    RouterLink,
    useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
    useRoute: () => ({ path: '/' }),
  }
})

const DIMENSION = /\b(?:min-)?h-(\d+(?:\.\d+)?)\b|\bsize-(\d+(?:\.\d+)?)\b/g

const RESULT: CalcResult = {
  value: 22.09,
  unit: 'kg/m²',
  label: 'IMC',
  severity: 'normal',
  interpretation: 'Peso normal.',
  references: [{ label: 'Normal', min: 18.5, max: 24.9, severity: 'normal' }],
}

function render(component: unknown, props: Record<string, unknown> = {}): VueWrapper {
  return mount(component, { props } as never) as VueWrapper
}

interface Offender {
  where: string
  tag: string
  detail: string
}

/** Checkboxes are exempt: their tap target is the wrapping <label>. */
function audit(wrappers: Array<[string, VueWrapper]>): Offender[] {
  const offenders: Offender[] = []

  for (const [where, wrapper] of wrappers) {
    for (const element of wrapper.element.querySelectorAll('button, a, input, select, textarea')) {
      const el = element as HTMLElement
      const type = el.getAttribute('type')
      if (type === 'checkbox' || type === 'radio') continue

      const classes = typeof el.className === 'string' ? el.className : ''
      // RouterLink renders the anchor element itself, so an unclassed <a> is
      // the router's, not ours.
      if (el.tagName === 'A' && classes.trim() === '') continue

      const declared = [...classes.matchAll(DIMENSION)].map((m) =>
        Number.parseFloat(m[1] ?? m[2] ?? '0'),
      )
      if (declared.length === 0) {
        offenders.push({ where, tag: el.tagName, detail: 'no explicit size' })
        continue
      }
      const smallest = Math.min(...declared)
      if (smallest < 12) {
        offenders.push({ where, tag: el.tagName, detail: `${smallest * 4}px` })
      }
    }
  }

  return offenders
}

describe('touch targets are at least 48 x 48 px', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('holds for every atomic UI component', () => {
    expect(
      audit([
        ['AppInput', render(AppInput, { label: 'Peso', modelValue: 70, unit: 'kg' })],
        ['AppInput (error)', render(AppInput, { label: 'Peso', modelValue: null, error: 'Ruim' })],
        [
          'AppSelect',
          render(AppSelect, {
            label: 'Sexo',
            modelValue: '',
            options: [{ value: 'M', label: 'M' }],
          }),
        ],
        ['AppToggle', render(AppToggle, { label: 'Sexo', modelValue: 'M', options: ['M', 'F'] })],
        ['AppButton sm', render(AppButton, { size: 'sm' })],
        ['AppButton md', render(AppButton, { size: 'md' })],
        ['AppButton lg', render(AppButton, { size: 'lg', fullWidth: true })],
        [
          'ScoreRow (boolean)',
          render(ScoreRow, { label: 'ICC', description: 'x', modelValue: true, points: 1 }),
        ],
        [
          'ScoreRow (numeric)',
          render(ScoreRow, {
            label: 'Glasgow',
            description: 'x',
            modelValue: 4,
            points: 0,
            min: 0,
            max: 6,
          }),
        ],
        ['ResultCard', render(ResultCard, { result: RESULT })],
        ['SeverityBadge', render(SeverityBadge, { severity: 'critical' })],
        ['CalculatorListItem', render(CalculatorListItem, { calculator: CALCULATORS_META.imc })],
        [
          'CalculatorListItem (favorite)',
          render(CalculatorListItem, { calculator: CALCULATORS_META.imc, favorite: true }),
        ],
        ['CategoryCard', render(CategoryCard, { category: CATEGORIES[0]!, count: 3 })],
        ['ToastHost', render(ToastHost)],
      ]),
    ).toEqual([])
  })

  it('holds for every layout component', () => {
    expect(
      audit([
        ['AppShell', render(AppShell)],
        ['PageHeader (back)', render(PageHeader, { title: 'IMC', showBack: true })],
        [
          'PageHeader (both actions)',
          render(PageHeader, {
            title: 'IMC',
            showBack: true,
            showFavorite: true,
            showShare: true,
          }),
        ],
        ['BottomNav', render(BottomNav)],
        ['SearchBar (with value)', render(SearchBar, { modelValue: 'sodio' })],
        ['SearchBar (empty)', render(SearchBar, { modelValue: '' })],
      ]),
    ).toEqual([])
  })

  it('holds for every view in its empty state', () => {
    expect(
      audit([
        ['HomeView', render(HomeView)],
        ['CategoryView', render(CategoryView, { props: true })],
        ['SearchView (idle)', render(SearchView)],
        ['FavoritesView (empty)', render(FavoritesView)],
        ['HistoryView (empty)', render(HistoryView)],
      ]),
    ).toEqual([])
  })

  it('holds for the views in their populated state', async () => {
    useFavoritesStore().toggle('imc')
    useHistoryStore().add({
      calculatorId: 'imc',
      calculatorName: 'IMC',
      inputs: {},
      result: RESULT,
    })

    const search = render(SearchView)
    await search.find('input[type="search"]').setValue('sódio')

    expect(
      audit([
        ['HomeView (with recents)', render(HomeView)],
        ['SearchView (results)', search],
        ['FavoritesView (populated)', render(FavoritesView)],
        ['HistoryView (populated)', render(HistoryView)],
      ]),
    ).toEqual([])
  })

  it('keeps the checkbox tap target on its wrapping 48px label', () => {
    const wrapper = render(ScoreRow, {
      label: 'Insuficiência cardíaca',
      description: 'x',
      modelValue: false,
      points: 1,
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    const label = checkbox.element.closest('label')
    expect(label, 'the checkbox must live inside a label').toBeTruthy()
    expect(label!.className).toMatch(/min-h-12/)
  })
})
