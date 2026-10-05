import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Router } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'

/**
 * Boots the real application graph — real router, real Pinia, real views — and
 * walks the primary journeys. This is the suite that would catch a wiring break
 * between the router, the shell and a calculator form, which unit tests on
 * individual views structurally cannot.
 *
 * Every assertion waits on the state it expects rather than on a fixed number of
 * ticks: navigation is asynchronous and views and forms are dynamic imports
 * resolved by Vite's module runner over real I/O, so the load time varies by an
 * order of magnitude between a cold run and one under coverage instrumentation.
 */

async function boot(initialPath = '/'): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createAppRouter()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await router.push(initialPath)
  await router.isReady()
  return { wrapper, router }
}

async function waitFor(check: () => boolean, what: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`timed out waiting for ${what}`)
}

/** Waits until `wrapper` renders `text`. */
function waitForText(wrapper: VueWrapper, text: string, what = `"${text}"`): Promise<void> {
  return waitFor(() => wrapper.text().includes(text), `${what} to render`)
}

/** RouterLink clicks start an async navigation that exposes no promise. */
function waitForPath(router: Router, path: string): Promise<void> {
  return waitFor(() => router.currentRoute.value.path === path, `the route to become ${path}`)
}

type Tappable = { trigger: (event: string) => unknown }

/** Taps a link and waits for the destination route to settle. */
async function tap(router: Router, anchor: Tappable, path: string): Promise<void> {
  await anchor.trigger('click')
  await waitForPath(router, path)
}

describe('application shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('renders HomeView with all seven categories at the root route', async () => {
    const { wrapper } = await boot('/')
    await waitFor(
      () => wrapper.findAllComponents({ name: 'CategoryCard' }).length === 7,
      'all seven category cards',
    )
  })

  it('always renders the bottom navigation', async () => {
    const { wrapper } = await boot('/')
    await waitForText(wrapper, 'Categorias')
    expect(wrapper.findComponent({ name: 'BottomNav' }).exists()).toBe(true)
  })

  it('navigates between the four bottom-nav destinations', async () => {
    const { wrapper, router } = await boot('/')
    await waitForText(wrapper, 'Categorias')

    const destinations = [
      { label: 'Buscar', path: '/search', probe: 'Sugestões' },
      { label: 'Favoritos', path: '/favorites', probe: 'Nenhum favorito ainda' },
      { label: 'Histórico', path: '/history', probe: 'Nenhum cálculo ainda' },
      { label: 'Início', path: '/', probe: 'Categorias' },
    ] as const

    for (const { label, path, probe } of destinations) {
      // Scope to the bottom nav: Home also renders a link whose label contains
      // "Buscar", and matching on text alone picks the wrong one.
      const navLink = wrapper
        .findComponent({ name: 'BottomNav' })
        .findAllComponents({ name: 'RouterLink' })
        .find((link) => link.text().includes(label))
      expect(navLink, `bottom nav has no "${label}" item`).toBeTruthy()

      await tap(router, navLink!.find('a'), path)
      await waitForText(wrapper, probe, `${probe} after tapping ${label}`)
    }
  })

  it('opens a calculator and renders its form with the CTA disabled', async () => {
    const { wrapper, router } = await boot('/calc/imc')
    expect(router.currentRoute.value.name).toBe('calculator')
    await waitFor(() => wrapper.find('button[type="submit"]').exists(), 'the IMC form to render')
    expect(wrapper.text()).toContain('IMC')
    expect(wrapper.findAllComponents({ name: 'AppInput' })).toHaveLength(2)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('loads every one of the 24 calculator forms without throwing', async () => {
    const forms = import.meta.glob('@/components/calculators/*/*.vue')
    const slugs = Object.keys(forms).map((path) => path.split('/').at(-2)!)
    expect(slugs).toHaveLength(24)

    for (const slug of slugs) {
      const { wrapper, router } = await boot(`/calc/${slug}`)
      expect(router.currentRoute.value.name, slug).toBe('calculator')
      // A missing module, or one that throws at import or setup time, fails here.
      await waitFor(
        () => wrapper.find('button[type="submit"]').exists(),
        `${slug} to render its submit button`,
      )
      expect(wrapper.find('h1').text().length, `${slug} has an empty title`).toBeGreaterThan(0)
      wrapper.unmount()
    }
  }, 60_000)

  it('lists the calculators of a category', async () => {
    const { wrapper } = await boot('/category/emergencia')
    await waitForText(wrapper, 'Emergência')
    expect(wrapper.find('h1').text()).toBe('Emergência')
    expect(wrapper.findAllComponents({ name: 'CalculatorListItem' })).toHaveLength(4)
  })

  it('drills from home to a calculator in two taps', async () => {
    const { wrapper, router } = await boot('/')
    await waitForText(wrapper, 'Categorias')

    const card = wrapper
      .findAllComponents({ name: 'CategoryCard' })
      .find((c) => (c.props('category') as { slug: string }).slug === 'emergencia')
    expect(card, 'no emergency category card').toBeTruthy()
    await tap(router, card!.find('a'), '/category/emergencia')

    await waitFor(
      () => wrapper.findAllComponents({ name: 'CalculatorListItem' }).length === 4,
      'the emergency calculator list',
    )
    await tap(router, wrapper.findAllComponents({ name: 'CalculatorListItem' })[0]!.find('a'), '/calc/glasgow')
    await waitFor(() => wrapper.findComponent({ name: 'GlasgowForm' }).exists(), 'the Glasgow form')
  })

  it('finds a calculator by search', async () => {
    const { wrapper, router } = await boot('/search')
    await waitFor(() => wrapper.find('input[type="search"]').exists(), 'the search field')

    await wrapper.find('input[type="search"]').setValue('gotejamento')
    await waitForText(wrapper, 'Gotejamento')
    expect(wrapper.findAllComponents({ name: 'CalculatorListItem' })).toHaveLength(1)

    await tap(router, wrapper.findAllComponents({ name: 'CalculatorListItem' })[0]!.find('a'), '/calc/gotejamento')
  })

  it('keeps a favorite across a remount', async () => {
    const first = await boot('/favorites')
    await waitForText(first.wrapper, 'Nenhum favorito ainda')
    await tap(first.router,
      first.wrapper.findAll('a').find((a) => a.text().includes('Escolher'))!,
      '/',
    )
    first.wrapper.unmount()

    const second = await boot('/calc/hba1c')
    await waitFor(
      () => second.wrapper.find('[aria-label="Adicionar aos favoritos"]').exists(),
      'the favourite button',
    )
    await second.wrapper.find('[aria-label="Adicionar aos favoritos"]').trigger('click')
    second.wrapper.unmount()

    const third = await boot('/favorites')
    await waitForText(third.wrapper, 'HbA1c')
    expect(third.wrapper.text()).not.toContain('Nenhum favorito ainda')
  })

  it('redirects an unknown path home instead of showing a blank screen', async () => {
    const { wrapper, router } = await boot('/rota/que/nao/existe')
    await waitFor(() => router.currentRoute.value.name === 'home', 'the catch-all redirect')
    await waitFor(
      () => wrapper.findAllComponents({ name: 'CategoryCard' }).length === 7,
      'the home category grid',
    )
  })

  it('reports a friendly state for an unknown calculator id', async () => {
    const { wrapper } = await boot('/calc/nao-existe')
    await waitForText(wrapper, 'Calculadora não encontrada')
    // The shell must survive it.
    expect(wrapper.findComponent({ name: 'BottomNav' }).exists()).toBe(true)
  })

  it('names the calculator in the document title', async () => {
    // The route meta alone yields "Calculadora", which is useless across tabs.
    await boot('/calc/imc')
    await waitFor(() => document.title.includes('IMC'), 'the calculator document title')
    expect(document.title).not.toContain('Calculadora')
  })

  it('falls back to the route title for the non-calculator routes', async () => {
    await boot('/search')
    await waitFor(() => document.title.includes('Buscar'), 'the search document title')
  })

  it('survives a failed calculation without losing the form', async () => {
    const { wrapper, router } = await boot('/calc/imc')
    await waitFor(() => wrapper.find('button[type="submit"]').exists(), 'the IMC form to render')

    const [weight, height] = wrapper.findAll('input')
    await weight!.setValue('70')
    await height!.setValue('175')
    await wrapper.find('form').trigger('submit')

    // The logic layer is not merged yet, so this exercises the error path: the
    // form must stay on screen with an explanation rather than a blank page.
    await waitForText(wrapper, 'ainda não está disponível')
    expect(wrapper.findAllComponents({ name: 'AppInput' })).toHaveLength(2)
    expect(router.currentRoute.value.path).toBe('/calc/imc')
  })
})
