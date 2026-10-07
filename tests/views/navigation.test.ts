import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, type Component } from 'vue'
import HomeView from '@/views/HomeView.vue'
import CategoryView from '@/views/CategoryView.vue'
import SearchView from '@/views/SearchView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import HistoryView from '@/views/HistoryView.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useHistoryStore } from '@/stores/history'
import { CATEGORIES } from '@/data/categories'
import { CALCULATOR_IDS, requireMeta } from '@/data/calculator-meta'
import type { CalcResult } from '@/logic/types'

const currentPath = { value: '/' }
const back = vi.fn()
const push = vi.fn()

vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    name: 'RouterLink',
    props: ['to'],
    setup(props, { slots }) {
      return () => h('a', { href: String(props.to) }, slots.default?.())
    },
  }),
  useRouter: () => ({ back, push }),
  useRoute: () => ({ path: currentPath.value }),
}))

const RESULT: CalcResult = {
  value: 22.09,
  unit: 'kg/m²',
  label: 'IMC',
  severity: 'normal',
  interpretation: 'Peso normal.',
}

function mountView(component: Component, props: Record<string, unknown> = {}) {
  return mount(component, { props }) as VueWrapper
}

describe('BottomNav', () => {
  beforeEach(() => {
    currentPath.value = '/'
  })

  it('offers the four primary destinations', () => {
    const wrapper = mount(BottomNav)
    const labels = wrapper.findAll('a').map((a) => a.text())
    expect(labels).toHaveLength(4)
    expect(wrapper.text()).toContain('Início')
    expect(wrapper.text()).toContain('Buscar')
    expect(wrapper.text()).toContain('Favoritos')
    expect(wrapper.text()).toContain('Histórico')
  })

  it('marks the active destination with aria-current', () => {
    currentPath.value = '/favorites'
    const wrapper = mount(BottomNav)
    const current = wrapper.findAll('a').filter((a) => a.attributes('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toContain('Favoritos')
  })

  it('does not treat the home route as active on a sub-route', () => {
    // The bug this guards: every route is prefixed by `/`, so a naive `startsWith`
    // would light up "Início" everywhere.
    currentPath.value = '/calc/imc'
    const wrapper = mount(BottomNav)
    expect(wrapper.findAll('a').filter((a) => a.attributes('aria-current') === 'page')).toHaveLength(0)
  })

  it('highlights nothing on a drill-down route', () => {
    currentPath.value = '/category/renal'
    const wrapper = mount(BottomNav)
    expect(wrapper.findAll('a').filter((a) => a.attributes('aria-current') === 'page')).toHaveLength(0)
  })

  it('gives each destination a 48px-or-taller target', () => {
    const wrapper = mount(BottomNav)
    for (const link of wrapper.findAll('a')) {
      expect(link.classes().join(' ')).toContain('h-14')
    }
  })
})

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('renders all eight category cards', () => {
    const wrapper = mountView(HomeView)
    for (const category of CATEGORIES) {
      expect(wrapper.text()).toContain(category.label)
    }
  })

  it('passes each card its real calculator count, totalling 28', () => {
    const wrapper = mountView(HomeView)
    const cards = wrapper.findAllComponents({ name: 'CategoryCard' })
    expect(cards).toHaveLength(8)

    const shown = cards.map((c) => c.props('count') as number)
    const expected = CATEGORIES.map(
      (c) => CALCULATOR_IDS.filter((id) => requireMeta(id).category === c.slug).length,
    )
    expect(shown).toEqual(expected)
    expect(shown.reduce((a, b) => a + b, 0)).toBe(28)
    expect(shown.every((n) => n > 0)).toBe(true)
  })

  it('links each card to its category route', () => {
    const wrapper = mountView(HomeView)
    // RouterLink receives a route location object; read it back off the stub.
    const targets = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .map((c) => c.props('to') as { path?: string; name?: string })
    expect(targets).toContainEqual({ name: 'category', params: { slug: 'renal' } })
    expect(targets).toContainEqual({ name: 'search' })
  })

  it('hides the recents strip until something has been calculated', () => {
    const wrapper = mountView(HomeView)
    expect(wrapper.text()).not.toContain('Recentes')
  })

  it('shows the recents strip once history exists', () => {
    const history = useHistoryStore()
    history.add({
      calculatorId: 'imc',
      calculatorName: 'Índice de Massa Corporal',
      inputs: {},
      result: RESULT,
    })
    const wrapper = mountView(HomeView)
    expect(wrapper.text()).toContain('Recentes')
    expect(wrapper.text()).toContain('IMC')
  })

  it('offers a read-only search field that navigates on tap', () => {
    const wrapper = mountView(HomeView)
    const input = wrapper.find('input[type="search"]')
    expect(input.attributes('readonly')).toBeDefined()
    expect(input.attributes('tabindex')).toBe('-1')
  })

  it('never overflows horizontally — the grid is two columns at every width', () => {
    const wrapper = mountView(HomeView)
    const grid = wrapper.findAll('.grid').find((g) => g.classes().includes('grid-cols-2'))
    expect(grid, 'no two-column grid found').toBeTruthy()
    expect(grid!.classes().join(' ')).not.toMatch(/grid-cols-(3|4|5|6)/)
  })
})

describe('CategoryView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lists the calculators in one category', () => {
    const wrapper = mountView(CategoryView, { slug: 'emergencia' })
    const expected = CALCULATOR_IDS.filter((id) => requireMeta(id).category === 'emergencia')
    expect(expected).toHaveLength(4)
    for (const id of expected) {
      expect(wrapper.text()).toContain(requireMeta(id).name)
    }
  })

  it('shows the category name in the header', () => {
    const wrapper = mountView(CategoryView, { slug: 'renal' })
    expect(wrapper.find('h1').text()).toBe('Renal')
  })

  it('renders a not-found state for an unknown slug', () => {
    const wrapper = mountView(CategoryView, { slug: 'nao-existe' })
    expect(wrapper.text()).toContain('Categoria não encontrada')
  })
})

describe('SearchView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts with suggestions instead of a result list', () => {
    const wrapper = mountView(SearchView)
    expect(wrapper.text()).toContain('Sugestões')
    expect(wrapper.text()).toContain('28 calculadoras')
  })

  it('filters as the query is typed', async () => {
    const wrapper = mountView(SearchView)
    await wrapper.find('input[type="search"]').setValue('sódio')
    expect(wrapper.text()).toContain('Correção de Sódio')
    expect(wrapper.text()).not.toContain('Gotejamento')
  })

  it('reports the number of matches', async () => {
    const wrapper = mountView(SearchView)
    await wrapper.find('input[type="search"]').setValue('renal')
    expect(wrapper.text()).toMatch(/resultado\(s\)/)
  })

  it('shows an empty state when nothing matches', async () => {
    const wrapper = mountView(SearchView)
    await wrapper.find('input[type="search"]').setValue('zzzzqqq')
    expect(wrapper.text()).toContain('Nenhuma calculadora corresponde')
  })

  it('clears the query from the empty state', async () => {
    const wrapper = mountView(SearchView)
    const input = wrapper.find('input[type="search"]')
    await input.setValue('zzzzqqq')
    await wrapper.findAll('button').find((b) => b.text() === 'Limpar busca')!.trigger('click')
    expect(wrapper.text()).toContain('Sugestões')
  })

  it('navigates back on Escape', async () => {
    const wrapper = mountView(SearchView)
    await wrapper.find('input[type="search"]').trigger('keydown', { key: 'Escape' })
    expect(back).toHaveBeenCalled()
  })

  it('loads a suggestion with one tap', async () => {
    const wrapper = mountView(SearchView)
    await wrapper.findAll('button').find((b) => b.text() === 'gotejamento')!.trigger('click')
    expect(wrapper.text()).toContain('Gotejamento')
  })
})

describe('FavoritesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('shows an empty state with the documented caption', () => {
    const wrapper = mountView(FavoritesView)
    expect(wrapper.text()).toContain('Nenhum favorito ainda')
  })

  it('lists a favorited calculator', () => {
    useFavoritesStore().toggle('imc')
    const wrapper = mountView(FavoritesView)
    expect(wrapper.text()).toContain('Índice de Massa Corporal')
    expect(wrapper.text()).not.toContain('Nenhum favorito ainda')
  })

  it('ignores a stale id left in storage by an older build', () => {
    useFavoritesStore().ids.push('calculadora-removida')
    const wrapper = mountView(FavoritesView)
    expect(wrapper.text()).not.toContain('undefined')
  })

  it('removes a favorite from the list', async () => {
    const favorites = useFavoritesStore()
    favorites.toggle('imc')
    const wrapper = mountView(FavoritesView)
    await wrapper.find('[aria-label^="Remover"]').trigger('click')
    expect(favorites.isFavorite('imc')).toBe(false)
  })
})

describe('HistoryView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function seed() {
    const history = useHistoryStore()
    history.add({
      calculatorId: 'imc',
      calculatorName: 'Índice de Massa Corporal',
      inputs: {},
      result: RESULT,
    })
  }

  it('shows an empty state with no history', () => {
    const wrapper = mountView(HistoryView)
    expect(wrapper.text()).toContain('Nenhum cálculo ainda')
  })

  it('lists entries newest-first with their value and severity', () => {
    seed()
    const wrapper = mountView(HistoryView)
    expect(wrapper.text()).toContain('Índice de Massa Corporal')
    expect(wrapper.text()).toContain('22.09')
    expect(wrapper.text()).toContain('NORMAL')
  })

  it('requires a second tap before clearing', async () => {
    const history = useHistoryStore()
    seed()
    const wrapper = mountView(HistoryView)

    const clear = wrapper.findAll('button').find((b) => b.text() === 'Limpar')!
    await clear.trigger('click')
    expect(history.entries).toHaveLength(1)
    expect(wrapper.text()).toContain('Não pode ser desfeito')

    await wrapper.findAll('button').find((b) => b.text() === 'Confirmar')!.trigger('click')
    expect(history.entries).toHaveLength(0)
  })

  it('formats the timestamp for a pt-BR reader', () => {
    seed()
    const wrapper = mountView(HistoryView)
    // e.g. "04/10/26, 17:41" — ICU inserts the comma, so allow it optionally.
    expect(wrapper.text()).toMatch(/\d{2}\/\d{2}\/\d{2},?\s*\d{2}:\d{2}/)
  })

  it('tolerates an unparseable timestamp instead of printing NaN', () => {
    const history = useHistoryStore()
    history.entries.push({
      id: 'x',
      calculatorId: 'imc',
      calculatorName: 'IMC',
      timestamp: 'data inválida',
      inputs: {},
      result: RESULT,
    })
    const wrapper = mountView(HistoryView)
    expect(wrapper.text()).not.toContain('NaN')
  })
})

describe('view integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('keeps favorites and history independent', async () => {
    const favorites = useFavoritesStore()
    const history = useHistoryStore()
    favorites.toggle('imc')
    history.add({
      calculatorId: 'hba1c',
      calculatorName: 'HbA1c',
      inputs: {},
      result: RESULT,
    })

    const favView = mountView(FavoritesView)
    const histView = mountView(HistoryView)
    await flushPromises()
    expect(favView.text()).toContain('Índice de Massa Corporal')
    expect(favView.text()).not.toContain('HbA1c e glicose')
    expect(histView.text()).toContain('HbA1c')
  })
})
