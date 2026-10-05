import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppButton from '@/components/ui/AppButton.vue'

/** Types into the field the way a clinician does, then returns the emit payload. */
async function type(wrapper: ReturnType<typeof mount>, value: string) {
  const input = wrapper.find('input')
  await input.setValue(value)
  return input
}

describe('AppInput', () => {
  it('emits null for an empty numeric field', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: 70 } })
    await type(wrapper, '')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('emits a number, not a string, for numeric fields', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: null } })
    await type(wrapper, '82.5')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([82.5])
  })

  it('parses a pt-BR decimal comma', async () => {
    // The single most important case: 1,75 must not become 175 or null.
    const wrapper = mount(AppInput, { props: { label: 'Altura', modelValue: null } })
    await type(wrapper, '1,75')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1.75])
  })

  it('emits an intermediate value while a decimal comma is being typed', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Altura', modelValue: null } })
    const input = wrapper.find('input')
    await input.setValue('1,')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
    await input.setValue('1,5')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1.5])
  })

  it('emits null for a lone minus sign rather than NaN', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Delta', modelValue: null } })
    await type(wrapper, '-')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('emits null for non-numeric text in a numeric field', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: null } })
    await type(wrapper, 'abc')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('keeps raw text verbatim in a text field', async () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Unidade', modelValue: '', type: 'text' },
    })
    await type(wrapper, 'mg/mL')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['mg/mL'])
  })

  it('does not rewrite what the user typed when the parent echoes the same number back', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Altura', modelValue: null } })
    await type(wrapper, '1,75')
    // Parent re-renders with the parsed value; the field must keep "1,75".
    await wrapper.setProps({ modelValue: 1.75 })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1,75')
  })

  it('clears the field when the parent nulls the value', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: 70 } })
    await wrapper.setProps({ modelValue: null })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('uses a decimal inputmode so phones show a numeric pad', () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: null } })
    expect(wrapper.find('input').attributes('inputmode')).toBe('decimal')
  })

  it('renders the unit inside the field and the error below it', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Sódio', modelValue: null, unit: 'mEq/L', error: 'Fora da faixa' },
    })
    expect(wrapper.text()).toContain('mEq/L')
    expect(wrapper.text()).toContain('Fora da faixa')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('links the error to the field for screen readers', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Sódio', modelValue: null, error: 'Fora da faixa' },
    })
    const input = wrapper.find('input')
    const describedBy = input.attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(wrapper.find(`#${describedBy}`).text()).toBe('Fora da faixa')
  })

  it('gives each instance a distinct id so labels stay paired', () => {
    // Both fields live in one app, which is where duplicate ids would actually
    // break a screen reader. Separate `mount` calls restart the id counter.
    const wrapper = mount({
      components: { AppInput },
      template: `
        <div>
          <AppInput label="Peso" :model-value="null" />
          <AppInput label="Altura" :model-value="null" />
        </div>
      `,
    })
    const [first, second] = wrapper.findAll('input')
    const idFirst = first!.attributes('id')
    const idSecond = second!.attributes('id')
    expect(idFirst).toBeTruthy()
    expect(idFirst).not.toBe(idSecond)
    const labels = wrapper.findAll('label')
    expect(labels[0]!.attributes('for')).toBe(idFirst)
    expect(labels[1]!.attributes('for')).toBe(idSecond)
  })

  it('associates the label with the field', () => {
    const wrapper = mount(AppInput, { props: { label: 'Peso', modelValue: null } })
    const id = wrapper.find('input').attributes('id')
    expect(wrapper.find('label').attributes('for')).toBe(id)
  })

  it('disables the field', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Peso', modelValue: null, disabled: true },
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('shows the hint only when there is no error', () => {
    const withHint = mount(AppInput, {
      props: { label: 'Peso', modelValue: null, hint: '70' },
    })
    expect(withHint.text()).toContain('70')
    const withError = mount(AppInput, {
      props: { label: 'Peso', modelValue: null, hint: '70', error: 'Ruim' },
    })
    expect(withError.text()).not.toContain('70')
    expect(withError.text()).toContain('Ruim')
  })
})

describe('AppSelect', () => {
  const options = [
    { value: 'a', label: 'Opção A' },
    { value: 'b', label: 'Opção B' },
  ]

  it('emits the chosen option value', async () => {
    const wrapper = mount(AppSelect, { props: { label: 'Sexo', modelValue: '', options } })
    await wrapper.find('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b'])
  })

  it('renders every option', () => {
    const wrapper = mount(AppSelect, { props: { label: 'Sexo', modelValue: '', options } })
    expect(wrapper.findAll('option')).toHaveLength(2)
    expect(wrapper.text()).toContain('Opção A')
  })

  it('adds a disabled placeholder when one is supplied', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Sexo', modelValue: '', options, placeholder: 'Selecione' },
    })
    expect(wrapper.findAll('option')).toHaveLength(3)
    expect(wrapper.find('option').attributes('disabled')).toBeDefined()
  })

  it('associates the label with the select', () => {
    const wrapper = mount(AppSelect, { props: { label: 'Sexo', modelValue: '', options } })
    expect(wrapper.find('label').attributes('for')).toBe(
      wrapper.find('select').attributes('id'),
    )
  })

  it('marks itself invalid when an error is present', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Sexo', modelValue: '', options, error: 'Ruim' },
    })
    expect(wrapper.find('select').attributes('aria-invalid')).toBe('true')
  })
})

describe('AppToggle', () => {
  const options: [string, string] = ['M', 'F']

  it('emits the newly picked option', async () => {
    const wrapper = mount(AppToggle, { props: { label: 'Sexo', modelValue: 'M', options } })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['F'])
  })

  it('does not re-emit when the active option is tapped again', async () => {
    const wrapper = mount(AppToggle, { props: { label: 'Sexo', modelValue: 'M', options } })
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('exposes a radiogroup with one checked option', () => {
    const wrapper = mount(AppToggle, { props: { label: 'Sexo', modelValue: 'F', options } })
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    const checked = wrapper.findAll('[role="radio"]').filter((b) => b.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0]!.text()).toBe('F')
  })

  it('moves selection with the arrow keys', async () => {
    const wrapper = mount(AppToggle, { props: { label: 'Sexo', modelValue: 'M', options } })
    await wrapper.findAll('[role="radio"]')[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['F'])
  })

  it('does not emit while disabled', async () => {
    const wrapper = mount(AppToggle, {
      props: { label: 'Sexo', modelValue: 'M', options, disabled: true },
    })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('AppButton', () => {
  it('is a submit button when asked', () => {
    const wrapper = mount(AppButton, { props: { type: 'submit' } })
    expect(wrapper.find('button').attributes('type')).toBe('submit')
  })

  it('is inert while loading, and announces what it is doing', () => {
    const wrapper = mount(AppButton, { props: { loading: true, loadingLabel: 'Calculando' } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toContain('Calculando')
  })

  it('does not emit a click while loading', async () => {
    const wrapper = mount(AppButton, { props: { loading: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not emit a click while disabled', async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('emits a click when enabled', async () => {
    const wrapper = mount(AppButton)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('goes full width on request', () => {
    const wrapper = mount(AppButton, { props: { fullWidth: true } })
    expect(wrapper.find('button').classes()).toContain('w-full')
  })

  it.each(['sm', 'md', 'lg'] as const)('keeps a 48px-or-taller target at size %s', (size) => {
    // Class-level assertion: every size carries `min-h-12` (48px) or taller, so a
    // one-line Tailwind regression cannot quietly shrink the tap target.
    const wrapper = mount(AppButton, { props: { size } })
    const classes = wrapper.find('button').classes()
    // Tailwind's spacing scale is in rem: `min-h-12` = 3rem = 48px.
    const touch = classes.find((c) => /^(min-)?h-\d+$/.test(c))
    expect(touch, `size ${size} has no explicit height utility`).toBeTruthy()
    const rem = Number.parseFloat(touch!.slice(touch!.lastIndexOf('-') + 1))
    expect(rem * 16, `size ${size} is under 48px: ${touch}`).toBeGreaterThanOrEqual(48)
  })

  it('reserves the FAB shadow for the full-width primary CTA', () => {
    const fab = mount(AppButton, { props: { variant: 'primary', fullWidth: true } })
    expect(fab.find('button').classes()).toContain('shadow-fab')
    const inline = mount(AppButton, { props: { variant: 'primary' } })
    expect(inline.find('button').classes()).not.toContain('shadow-fab')
  })

  it('scales down while pressed', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.find('button').classes()).toContain('active:scale-95')
  })
})
