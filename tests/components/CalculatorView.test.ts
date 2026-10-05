import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import CalculatorView from '@/views/CalculatorView.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useHistoryStore } from '@/stores/history'
import { CalcValidationError, type CalcResult } from '@/logic/types'

/** Stubs vue-router so the view can mount without a real router. */
const push = vi.fn()
vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    props: ['to'],
    setup: (_, { slots }) => () => h('a', {}, slots.default?.()),
  }),
  useRouter: () => ({ back: vi.fn(), push }),
  useRoute: () => ({ path: '/calc/imc' }),
}))

const RESULT: CalcResult = {
  value: 22.09,
  unit: 'kg/m²',
  label: 'Índice de Massa Corporal',
  severity: 'normal',
  interpretation: 'Peso normal.',
  references: [{ label: 'Normal', min: 18.5, max: 24.9, severity: 'normal' }],
}

/**
 * Replaces the async form with a button that emits a fixed payload, so the test
 * exercises the view's contract with a form rather than any one form's fields.
 */
const StubForm = defineComponent({
  name: 'StubForm',
  emits: ['calculate'],
  setup: (_, { emit }) => () =>
    h('button', { type: 'button', onClick: () => emit('calculate', { weightKg: 70, heightM: 1.78 }) }, 'emit'),
})

const calculate = vi.fn<(input: never) => CalcResult>()

vi.mock('@/components/calculators/registry', () => ({
  getEntry: (id: string) =>
    id === 'imc'
      ? {
          meta: {
            id: 'imc',
            name: 'Índice de Massa Corporal',
            shortName: 'IMC',
            description: 'Classificação de peso pela OMS.',
            category: 'antropometria',
            tags: ['imc'],
            evidenceLevel: 'A' as const,
          },
          form: StubForm,
          calculate,
        }
      : undefined,
}))

function mountView(id = 'imc') {
  return mount(CalculatorView, { props: { id } })
}

/** Clicks the stub form's submit button — not the header's back/favourite icons. */
async function submit(wrapper: ReturnType<typeof mountView>) {
  await wrapper.findAll('button').find((b) => b.text() === 'emit')!.trigger('click')
  await flushPromises()
}

describe('CalculatorView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    calculate.mockReset()
    calculate.mockReturnValue(RESULT)
    push.mockReset()
  })

  it('shows no result before anything is calculated', () => {
    expect(mountView().find('[aria-live="polite"]').exists()).toBe(false)
  })

  it('renders the result after the form emits', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    const card = wrapper.find('[aria-live="polite"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('22.09')
    expect(card.text()).toContain('kg/m²')
    expect(card.text()).toContain('Peso normal.')
  })

  it('passes the form payload straight through to the calculator', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    expect(calculate).toHaveBeenCalledTimes(1)
    expect(calculate.mock.calls[0]![0]).toEqual({ weightKg: 70, heightM: 1.78 })
  })

  it('colours the severity badge from the severity value', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    const badge = wrapper
      .findAll('span')
      .find((s) => s.classes().includes('uppercase') && s.text() === 'NORMAL')
    expect(badge, 'no NORMAL badge found').toBeTruthy()
    expect(badge!.classes()).toContain('text-ok-text')
    expect(badge!.classes()).toContain('bg-ok-bg')
  })

  it.each([
    ['attention', 'ATENÇÃO', 'text-warn-text'],
    ['critical', 'CRÍTICO', 'text-alert-text'],
    ['info', 'CÁLCULO', 'text-info-text'],
  ] as const)('renders %s with its own tone', async (severity, label, toneClass) => {
    calculate.mockReturnValue({ ...RESULT, severity, value: 30 })
    const wrapper = mountView()
    await submit(wrapper)
    expect(wrapper.find('[aria-live="polite"]').text()).toContain(label)
    expect(wrapper.html()).toContain(toneClass)
  })

  it('records the calculation in history with an ISO timestamp', async () => {
    const history = useHistoryStore()
    const wrapper = mountView()
    await submit(wrapper)
    expect(history.entries).toHaveLength(1)
    const entry = history.entries[0]!
    expect(entry.calculatorId).toBe('imc')
    expect(entry.calculatorName).toBe('Índice de Massa Corporal')
    expect(entry.result).toEqual(RESULT)
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false)
  })

  it('keeps history newest-first across repeated calculations', async () => {
    const history = useHistoryStore()
    calculate.mockReturnValueOnce(RESULT).mockReturnValueOnce({ ...RESULT, value: 31 })
    const wrapper = mountView()
    await submit(wrapper)
    await submit(wrapper)
    expect(history.entries.map((e) => e.result.value)).toEqual([31, 22.09])
  })

  it('surfaces a validation error instead of a result', async () => {
    calculate.mockImplementation(() => {
      throw new CalcValidationError('weightKg', "O campo 'weightKg' deve estar entre 0.5 e 300 kg.")
    })
    const wrapper = mountView()
    await submit(wrapper)
    expect(wrapper.find('[role="alert"]').text()).toContain('deve estar entre 0.5 e 300 kg')
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(false)
  })

  it('does not record a failed calculation in history', async () => {
    const history = useHistoryStore()
    calculate.mockImplementation(() => {
      throw new CalcValidationError('weightKg', 'out of range')
    })
    const wrapper = mountView()
    await submit(wrapper)
    expect(history.entries).toHaveLength(0)
  })

  it('reports a missing logic module without blaming the input', async () => {
    calculate.mockImplementation(() => {
      throw new Error('camada de lógica ainda não integrada')
    })
    const wrapper = mountView()
    await submit(wrapper)
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('camada de lógica')
  })

  it('survives a calculator that throws something that is not an Error', async () => {
    calculate.mockImplementation(() => {
      throw 'boom'
    })
    const wrapper = mountView()
    await submit(wrapper)
    expect(wrapper.find('[role="alert"]').text()).toContain('Não foi possível calcular')
  })

  it('offers a reset that clears the result', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)

    const reset = wrapper.findAll('button').find((b) => b.text().includes('Novo cálculo'))!
    await reset.trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(false)
  })

  it('renders a not-found state for an unknown id', () => {
    const wrapper = mountView('nao-existe')
    expect(wrapper.text()).toContain('Calculadora não encontrada')
    expect(wrapper.text()).toContain('nao-existe')
  })

  it('toggles a favorite from the header', async () => {
    const favorites = useFavoritesStore()
    const wrapper = mountView()
    const star = wrapper.find('[aria-label="Adicionar aos favoritos"]')
    expect(star.exists()).toBe(true)
    await star.trigger('click')
    expect(favorites.isFavorite('imc')).toBe(true)
  })

  it('reflects the favorited state on the header button', async () => {
    const favorites = useFavoritesStore()
    favorites.toggle('imc')
    const wrapper = mountView()
    expect(wrapper.find('[aria-label="Remover dos favoritos"]').exists()).toBe(true)
  })

  it('shows the reference-range accordion only once a result exists', async () => {
    const wrapper = mountView()
    expect(wrapper.text()).not.toContain('Valores de referência')

    await submit(wrapper)
    expect(wrapper.text()).toContain('Valores de referência')
  })

  it('reveals reference ranges when the accordion is opened', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    const accordion = wrapper.findAll('button').find((b) => b.text().includes('Valores de referência'))!
    expect(accordion.attributes('aria-expanded')).toBe('false')
    await accordion.trigger('click')
    expect(wrapper.text()).toContain('18.5 – 24.9')
  })
})
