import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Action } from '../types'

const tick = atom({ plugin: 'buddy', key: 'tick' } as const, 0)
const action = atom({ plugin: 'buddy', key: 'action' } as const, null, { shape: 'action-1' })
const lastActive = atom({ plugin: 'buddy', key: 'lastActive' } as const, 0)

const BODY = 'rgb(217,119,87)'
const EYE = 'rgb(30,30,46)'
const SLEEP_AFTER = 100 // ticks of 300ms with no activity = 30s
const ACTION_LEN = 14

type Pose = {
  eyes: string
  arms: 'down' | 'up' | 'left' | 'right'
  legsA: boolean
  shift: number
  lift: number
  label: string
}

const NORMAL = 'OEOOOEO'
const CLOSED = 'OOOOOOO'

function idlePose(t: number): Pose {
  const n = t % 36
  const base = { arms: 'down' as const, legsA: true, shift: 1, lift: 0 }
  if (n < 9) return { ...base, eyes: NORMAL, label: 'sitting...' }
  if (n === 9) return { ...base, eyes: CLOSED, label: 'sitting...' }
  if (n < 14) return { ...base, eyes: NORMAL, label: 'sitting...' }
  if (n < 17) return { ...base, eyes: 'EOOEOOO', label: 'hm?' }
  if (n < 20) return { ...base, eyes: 'OOOEOOE', label: 'hm?' }
  if (n === 20) return { ...base, eyes: CLOSED, label: 'sitting...' }
  return { ...base, eyes: NORMAL, label: 'sitting...' }
}

function dancePose(i: number, label: string): Pose {
  return {
    eyes: NORMAL,
    arms: i % 2 === 0 ? 'up' : 'down',
    legsA: i % 2 === 0,
    shift: [1, 0, 1, 2][i % 4],
    lift: 0,
    label,
  }
}

function pickPose(t: number, a: Action | null, isWorking: boolean, idle: number): Pose {
  if (a) {
    const i = t - a.start
    switch (a.name) {
      case 'wave':
        return { eyes: NORMAL, arms: i % 2 === 0 ? 'left' : 'right', legsA: true, shift: 1, lift: 0, label: 'hi!' }
      case 'done':
        return { eyes: NORMAL, arms: i % 2 === 0 ? 'left' : 'right', legsA: true, shift: 1, lift: 0, label: 'all done!' }
      case 'pet':
        return { eyes: i % 6 === 5 ? NORMAL : CLOSED, arms: 'up', legsA: i % 2 === 0, shift: 1, lift: i % 2, label: '<3 <3 purrr' }
      case 'dance':
        return dancePose(i, 'dancing!')
      case 'sleep':
        return sleepPose(t)
    }
  }
  if (isWorking) return dancePose(t, 'working...')
  if (idle > SLEEP_AFTER) return sleepPose(t)
  return idlePose(t)
}

function sleepPose(t: number): Pose {
  const z = ['z', 'zZ', 'zZz', 'zZ'][Math.floor(t / 3) % 4]
  return { eyes: CLOSED, arms: 'down', legsA: false, shift: 1, lift: 0, label: z }
}

function rows(p: Pose): string[] {
  const top =
    p.arms === 'up' ? 'O       O'
    : p.arms === 'left' ? 'O        '
    : p.arms === 'right' ? '        O'
    : '         '
  const mid = p.arms === 'up' ? ' OOOOOOO ' : 'OOOOOOOOO'
  const body = [
    top,
    ' OOOOOOO ',
    ' ' + p.eyes + ' ',
    mid,
    ' OOOOOOO ',
    p.legsA ? ' O O O O ' : '  O O O  ',
  ]
  // A jump moves the critter up one row; the height stays the same.
  const blank = '         '
  return p.lift ? [...body, blank] : [blank, ...body]
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.clock.every(300, () => {
      void update($, tick, t => t + 1)
    })

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const t = await read($, tick)
    await update($, lastActive, () => t)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const t = await read($, tick)
    await update($, lastActive, () => t)
    await update($, action, () => ({ name: 'done', start: t }))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const t = await read($, tick)
    let a = await read($, action)
    if (a && t - a.start > ACTION_LEN) a = null
    const idle = t - (await read($, lastActive))
    const p = pickPose(t, a, e.props.isWorking, idle)

    const act = (name: Action['name']) => async () => {
      const now = await read($, tick)
      await update($, action, () => ({ name, start: now }))
      if (name !== 'sleep') await update($, lastActive, () => now)
    }

    return (
      <Box flexDirection="column">
        {rows(p).map(r => (
          <Text>
            {' '.repeat(p.shift * 2)}
            {r.split('').map(c =>
              c === ' ' ? (
                <Text>{'  '}</Text>
              ) : (
                <Text backgroundColor={c === 'E' ? EYE : BODY}>{'  '}</Text>
              ),
            )}
          </Text>
        ))}
        <Text dimColor>  {p.label}</Text>
        <Box>
          <Button key="pet" label="pet" onPress={act('pet')} />
          <Text> </Text>
          <Button key="wave" label="wave" onPress={act('wave')} />
          <Text> </Text>
          <Button key="dance" label="dance" onPress={act('dance')} />
          <Text> </Text>
          <Button key="sleep" label="sleep" onPress={act('sleep')} />
        </Box>
      </Box>
    )
  })
}
