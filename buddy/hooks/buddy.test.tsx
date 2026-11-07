import { expect, test } from 'claude-code/testing'

const BAND = (isWorking: boolean) =>
  ({
    plugin: 'buddy',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking },
    surface: 'terminal',
  }) as const

test('the buddy sits when idle and has four buttons', async ($) => {
  const ui = await $.ui.mount(BAND(false))
  expect(await ui.find({ type: 'Text', text: /sitting/ })).toBeTruthy()
  for (const key of ['pet', 'wave', 'dance', 'sleep']) {
    expect(await ui.find({ type: 'Button', key })).toBeTruthy()
  }
  await ui.unmount()
})

test('pressing pet makes it purr, wave makes it say hi', async ($) => {
  const ui = await $.ui.mount(BAND(false))
  await ui.press({ key: 'pet' })
  expect(await ui.find({ type: 'Text', text: /purrr/ })).toBeTruthy()
  await ui.press({ key: 'wave' })
  expect(await ui.find({ type: 'Text', text: /hi!/ })).toBeTruthy()
  await ui.press({ key: 'sleep' })
  expect(await ui.find({ type: 'Text', text: /z/ })).toBeTruthy()
  await ui.unmount()
})

test('it dances while Claude is working', async ($) => {
  const ui = await $.ui.mount(BAND(true))
  expect(await ui.find({ type: 'Text', text: /working/ })).toBeTruthy()
  await ui.unmount()
})

test('it yields to a survey', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({ ...BAND(false), props: { hasSurvey: true, isWorking: false } })
  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'pet' })).toBeFalsy()
  await ui.unmount()
})
