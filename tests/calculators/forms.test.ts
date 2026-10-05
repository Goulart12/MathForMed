import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import ImcForm from '@/components/calculators/imc/ImcForm.vue'
import CockcroftForm from '@/components/calculators/cockcroft/CockcroftForm.vue'
import DiluicaoForm from '@/components/calculators/diluicao/DiluicaoForm.vue'
import GlasgowForm from '@/components/calculators/glasgow/GlasgowForm.vue'
import SofaForm from '@/components/calculators/sofa/SofaForm.vue'
import AppInput from '@/components/ui/AppInput.vue'

function mountForm(component: Component): VueWrapper {
  return mount(component)
}

/**
 * Finds a field by its label rather than by DOM index, so inserting a field
 * cannot silently repoint a test at the wrong control.
 */
function field(wrapper: VueWrapper, label: string) {
  const component = wrapper.findAllComponents(AppInput).find((c) => c.props('label') === label)
  expect(component, `no AppInput labelled "${label}"`).toBeTruthy()
  return component!.find('input')
}

/** The submit CTA — the only control whose enabled state gates the payload. */
function cta(wrapper: VueWrapper) {
  return wrapper.find('button[type="submit"]')
}

async function submit(wrapper: VueWrapper) {
  await wrapper.find('form').trigger('submit')
}

describe('ImcForm', () => {
  it('starts with the CTA disabled', () => {
    expect(cta(mountForm(ImcForm)).attributes('disabled')).toBeDefined()
  })

  it('keeps the CTA disabled with only one field filled', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('70')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
  })

  it('enables the CTA once both fields are plausible', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Altura').setValue('175')
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits the typed payload on submit, converting cm to metres', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Altura').setValue('175')
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([{ weightKg: 70, heightM: 1.75 }])
  })

  it('parses a pt-BR decimal comma on a fractional field', async () => {
    // Height is in cm here, so the comma case belongs on a value that is
    // genuinely fractional — serum creatinine.
    const wrapper = mountForm(CockcroftForm)
    await field(wrapper, 'Idade').setValue('65')
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Creatinina sérica').setValue('1,1')
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)?.[0]).toMatchObject({
      serumCreatinineMgDl: 1.1,
    })
  })

  it('rejects a weight below the logic layer minimum', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('0.2')
    await field(wrapper, 'Altura').setValue('175')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
  })

  it('rejects a height above the logic layer maximum', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Altura').setValue('260')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
  })

  it('accepts the exact boundary values the logic layer allows', async () => {
    const wrapper = mountForm(ImcForm)
    await field(wrapper, 'Peso').setValue('0.5')
    await field(wrapper, 'Altura').setValue('30')
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits nothing when submit is forced while invalid', async () => {
    const wrapper = mountForm(ImcForm)
    await submit(wrapper)
    expect(wrapper.emitted('calculate')).toBeUndefined()
  })

  it('uses only AppInput fields — no raw inputs of its own', () => {
    // Rule 1: fields go through the atomic components. `AppInput` renders the
    // real <input>, so the count is checked via the component's own class hook.
    const wrapper = mountForm(ImcForm)
    expect(wrapper.findAllComponents({ name: 'AppInput' })).toHaveLength(2)
  })
})

describe('CockcroftForm', () => {
  it('requires age, weight and creatinine before enabling', async () => {
    const wrapper = mountForm(CockcroftForm)
    expect(cta(wrapper).attributes('disabled')).toBeDefined()

    await field(wrapper, 'Idade').setValue('65')
    await field(wrapper, 'Peso').setValue('70')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()

    await field(wrapper, 'Creatinina sérica').setValue('1.1')
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits the payload with the selected sex', async () => {
    const wrapper = mountForm(CockcroftForm)
    await field(wrapper, 'Idade').setValue('65')
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Creatinina sérica').setValue('1.1')
    await wrapper.findAll('[role="radio"]')[1]!.trigger('click')
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([
      { age: 65, weightKg: 70, serumCreatinineMgDl: 1.1, sex: 'F' },
    ])
  })

  it('defaults to the male toggle', async () => {
    const wrapper = mountForm(CockcroftForm)
    await field(wrapper, 'Idade').setValue('65')
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Creatinina sérica').setValue('1.1')
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)?.[0]).toMatchObject({ sex: 'M' })
  })

  it('rejects an age outside 1–120', async () => {
    const wrapper = mountForm(CockcroftForm)
    await field(wrapper, 'Idade').setValue('0')
    await field(wrapper, 'Peso').setValue('70')
    await field(wrapper, 'Creatinina sérica').setValue('1.1')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
  })
})

describe('DiluicaoForm', () => {
  it('blocks a final concentration that is not a dilution', async () => {
    // The logic layer throws on final >= initial; the CTA must stay disabled and
    // the field must explain why, rather than letting the submit blow up.
    const wrapper = mountForm(DiluicaoForm)
    await field(wrapper, 'Concentração inicial').setValue('100')
    await field(wrapper, 'Volume inicial retirado').setValue('1')
    await field(wrapper, 'Concentração final desejada').setValue('100')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('menor que a inicial')
  })

  it('blocks a final concentration above the initial one', async () => {
    const wrapper = mountForm(DiluicaoForm)
    await field(wrapper, 'Concentração inicial').setValue('10')
    await field(wrapper, 'Volume inicial retirado').setValue('1')
    await field(wrapper, 'Concentração final desejada').setValue('100')
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
  })

  it('accepts a genuine dilution', async () => {
    const wrapper = mountForm(DiluicaoForm)
    await field(wrapper, 'Concentração inicial').setValue('100')
    await field(wrapper, 'Volume inicial retirado').setValue('1')
    await field(wrapper, 'Concentração final desejada').setValue('10')
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([
      { initialConcentration: 100, initialVolumeMl: 1, finalConcentration: 10 },
    ])
  })

  it('leaves the concentration fields empty until they are filled', () => {
    const wrapper = mountForm(DiluicaoForm)
    expect(cta(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).not.toContain('menor que a inicial')
  })
})

describe('GlasgowForm', () => {
  it('is submittable from the default best responses', () => {
    const wrapper = mountForm(GlasgowForm)
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits the numeric components behind the option labels', async () => {
    const wrapper = mountForm(GlasgowForm)
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([{ eyes: 4, verbal: 5, motor: 6 }])
  })

  it('coerces a selected option string into a number', async () => {
    const wrapper = mountForm(GlasgowForm)
    const selects = wrapper.findAll('select')
    await selects[0]!.setValue('1')
    await selects[1]!.setValue('1')
    await selects[2]!.setValue('1')
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([{ eyes: 1, verbal: 1, motor: 1 }])
  })

  it('offers every published response option', () => {
    const wrapper = mountForm(GlasgowForm)
    const counts = wrapper.findAll('select').map((s) => s.findAll('option').length)
    expect(counts).toEqual([4, 5, 6])
  })
})

describe('SofaForm', () => {
  it('is submittable from the all-zero default', () => {
    const wrapper = mountForm(SofaForm)
    expect(cta(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits all six organ scores', async () => {
    const wrapper = mountForm(SofaForm)
    const selects = wrapper.findAll('select')
    for (const [index, value] of ['1', '2', '3', '4', '0', '1'].entries()) {
      await selects[index]!.setValue(value!)
    }
    await submit(wrapper)
    expect(wrapper.emitted('calculate')?.at(-1)).toEqual([
      {
        respirationScore: 1,
        coagulationScore: 2,
        liverScore: 3,
        cardiovascularScore: 4,
        cnsScore: 0,
        renalScore: 1,
      },
    ])
  })

  it('offers a 0–4 band for each of the six systems', () => {
    const wrapper = mountForm(SofaForm)
    for (const select of wrapper.findAll('select')) {
      expect(select.findAll('option')).toHaveLength(5)
    }
  })
})
