import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as copy from '../lib/weekday-hours-copy.mjs'
import { emptyOpeningHours, openingHoursSchema } from '../lib/booking-mode.mjs'
import { scheduleProblem } from '../lib/business-schedule.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const TimeSelect = ({ value, ...props }) => React.createElement('select', { ...props, value }, React.createElement('option', { value }, value))
async function load(name) {
  const filename = `components/${name}.js`, source = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8')
  const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === '../lib/weekday-hours-copy.mjs' ? copy : name === './time-select' ? { TimeSelect } : name === '../lib/booking-mode.mjs' ? { emptyOpeningHours } : require(name), module, module.exports)
  return module.exports
}
const { WeeklyScheduleFields } = await load('weekly-schedule-fields')
const { OpeningHoursEditor } = await load('opening-hours-editor')
const order = [6, 1, 3, 7, 2, 5, 4]
function schedule() {
  return order.map(weekday => ({ weekday, label: `Day ${weekday}`, marker: `keep-${weekday}`, enabled: weekday === 1 || weekday === 6, open: weekday === 1 ? '08:35' : '10:00', close: weekday === 1 ? '17:55' : '14:00', breakEnabled: weekday === 1, breakStart: weekday === 1 ? '12:05' : '11:00', breakEnd: weekday === 1 ? '12:45' : '11:30' }))
}
function openingHours() {
  return order.map(weekday => ({ weekday, periods: weekday === 1 ? [{ open: '08:35', close: '12:05' }, { open: '12:45', close: '17:55' }] : weekday === 6 ? [{ open: '10:00', close: '14:00' }] : [] }))
}
const monday = days => days.find(day => day.weekday === 1)
const day = (days, weekday) => days.find(day => day.weekday === weekday)
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }; return value }
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}

test('native copy finds Monday by weekday identity and applies its exact hours/breaks only to Tuesday–Friday without mutation', () => {
  const source = freeze(schedule()), before = structuredClone(source)
  assert.equal(copy.canCopyMondaySchedule(source), true)
  const result = copy.copyMondayScheduleToWeekdays(source)
  assert.notEqual(result, source)
  assert.deepEqual(result.map(day => day.weekday), order)
  for (const weekday of [2, 3, 4, 5]) {
    const target = day(result, weekday)
    assert.notEqual(target, day(source, weekday))
    assert.equal(target.label, `Day ${weekday}`)
    assert.equal(target.marker, `keep-${weekday}`)
    for (const field of ['enabled', 'open', 'close', 'breakEnabled', 'breakStart', 'breakEnd']) assert.equal(target[field], monday(source)[field], field)
  }
  for (const weekday of [1, 6, 7]) assert.equal(day(result, weekday), day(source, weekday), 'Monday and weekends remain the actual original entries')
  assert.deepEqual(source, before)
  assert.equal(scheduleProblem(result), null)
})

test('native copy supports no recurring break and can fix invalid weekday drafts without altering weekend drafts', () => {
  const source = schedule()
  monday(source).breakEnabled = false
  day(source, 2).open = 'bad'; day(source, 2).enabled = true
  day(source, 6).open = 'weekend-owner-draft'
  const result = copy.copyMondayScheduleToWeekdays(source)
  assert.equal(copy.canCopyMondaySchedule(source), true)
  assert.equal(day(result, 2).open, '08:35')
  assert.equal(day(result, 2).breakEnabled, false)
  assert.equal(day(result, 2).enabled, true)
  assert.equal(day(result, 6).open, 'weekend-owner-draft')
})

test('closed, invalid or unconfigured Monday cannot create a fake native schedule', () => {
  for (const patch of [
    { enabled: false }, { open: '' }, { close: '' }, { open: '25:00' }, { close: '08:35' }, { close: '07:00' },
    { breakStart: '08:00' }, { breakEnd: '18:00' }, { breakStart: '13:00', breakEnd: '12:00' },
    { breakStart: '08:35', breakEnd: '17:55' }, { breakStart: '', breakEnd: '' },
  ]) {
    const source = schedule(); Object.assign(monday(source), patch)
    assert.equal(copy.canCopyMondaySchedule(source), false, JSON.stringify(patch))
    assert.equal(copy.copyMondayScheduleToWeekdays(source), source)
  }
  for (const source of [undefined, [], schedule().slice(1), schedule().map(row => ({ ...row, weekday: 2 })), schedule().map(row => ({ ...row, weekday: 8 }))]) {
    assert.equal(copy.canCopyMondaySchedule(source), false)
    assert.equal(copy.copyMondayScheduleToWeekdays(source), source)
  }
})

test('external hours copy retains both real Monday shifts and creates independent period objects for each weekday', () => {
  const source = freeze(openingHours()), before = structuredClone(source)
  assert.equal(copy.canCopyMondayOpeningHours(source), true)
  const result = copy.copyMondayOpeningHoursToWeekdays(source)
  assert.deepEqual(result.map(day => day.weekday), order)
  for (const weekday of [2, 3, 4, 5]) {
    const target = day(result, weekday)
    assert.deepEqual(target.periods, monday(source).periods)
    assert.notEqual(target.periods, monday(source).periods)
    assert.notEqual(target.periods[0], monday(source).periods[0])
    assert.notEqual(target.periods, day(result, weekday === 2 ? 3 : 2).periods)
  }
  day(result, 2).periods[0].open = '09:15'
  assert.equal(day(result, 3).periods[0].open, '08:35')
  assert.equal(monday(source).periods[0].open, '08:35')
  for (const weekday of [1, 6, 7]) assert.equal(day(result, weekday), day(source, weekday))
  assert.deepEqual(source, before)
})

test('external copy accepts one valid shift, fixes incomplete weekday targets and never copies closed/overlapping/invalid source shifts', () => {
  const one = openingHours(); monday(one).periods = [{ open: '09:00', close: '18:00' }]; day(one, 3).periods = [{ open: 'not-entered', close: '' }]
  assert.equal(copy.canCopyMondayOpeningHours(one), true)
  const result = copy.copyMondayOpeningHoursToWeekdays(one)
  assert.equal(openingHoursSchema.safeParse(result).success, true)
  for (const periods of [
    [], [{ open: '', close: '18:00' }], [{ open: '24:30', close: '18:00' }], [{ open: '18:00', close: '09:00' }],
    [{ open: '09:00', close: '09:00' }], [{ open: '09:00', close: '13:00' }, { open: '12:00', close: '18:00' }],
    [{ open: '13:00', close: '18:00' }, { open: '09:00', close: '12:00' }],
    [{ open: '08:00', close: '09:00' }, { open: '10:00', close: '11:00' }, { open: '12:00', close: '13:00' }],
  ]) {
    const source = openingHours(); monday(source).periods = periods
    assert.equal(copy.canCopyMondayOpeningHours(source), false, JSON.stringify(periods))
    assert.equal(copy.copyMondayOpeningHoursToWeekdays(source), source)
  }
  for (const source of [undefined, [], openingHours().slice(1), openingHours().map(row => ({ ...row, weekday: 2 }))]) {
    assert.equal(copy.canCopyMondayOpeningHours(source), false)
    assert.equal(copy.copyMondayOpeningHoursToWeekdays(source), source)
  }
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: actual native component exposes one compact Monday-only button, copies explicitly and preserves later manual day edits`, () => {
    let value = schedule(), updates = 0
    const render = disabled => WeeklyScheduleFields({ days: value, locale, disabled, onChange: next => { value = next; updates++ } })
    let node = render(false)
    let action = elements(node, element => element.props.className === 'schedule-copy-weekdays')
    assert.equal(action.length, 1)
    assert.equal(action[0].props.type, 'button')
    assert.equal(action[0].props.disabled, false)
    assert.equal(action[0].props.children, locale === 'en' ? 'Apply to Mon–Fri' : 'Повтаря се - Пон/Петък')
    assert.match(action[0].props['aria-label'], locale === 'en' ? /Monday hours and breaks.*Monday–Friday/ : /часовете и почивките.*понеделник–петък/)
    assert.equal(updates, 0, 'rendering or changing source fields never silently applies the copy')
    action[0].props.onClick()
    assert.equal(updates, 1)
    assert.equal(day(value, 4).enabled, true)
    const tuesday = elements(render(false), element => element.type === 'fieldset' && element.key === '2')[0]
    const controls = elements(tuesday, element => element.type === TimeSelect)
    controls[0].props.onChange({ target: { value: '09:45' } })
    assert.equal(day(value, 2).open, '09:45')
    assert.equal(day(value, 3).open, '08:35', 'later manual day edits are independent')
    const before = updates
    action = elements(render(true), element => element.props.className === 'schedule-copy-weekdays')[0]
    assert.equal(action.props.disabled, true)
    action.props.onClick()
    assert.equal(updates, before, 'handler also respects parent-disabled state')
    const html = renderToStaticMarkup(React.createElement(WeeklyScheduleFields, { days: value, locale, onChange() {} }))
    assert.match(html, /class="schedule-copy-actions"/)
    assert.doesNotMatch(html, /type="submit"/)
  })

  test(`${locale}: actual external editor copies shifts only on its button, keeps weekend values and allows individual edits afterwards`, () => {
    let value = openingHours(), updates = 0
    const render = disabled => OpeningHoursEditor({ value, locale, disabled, onChange: next => { value = next; updates++ } })
    let node = render(false)
    let action = elements(node, element => element.props.className === 'schedule-copy-weekdays')
    assert.equal(action.length, 1)
    assert.equal(action[0].props.disabled, false)
    assert.equal(action[0].props.children, locale === 'en' ? 'Apply to Mon–Fri' : 'Повтаря се - Пон/Петък')
    assert.match(action[0].props['aria-label'], locale === 'en' ? /Monday opening hours.*Monday–Friday/ : /работното време.*понеделник–петък/)
    assert.equal(updates, 0)
    const saturday = day(value, 6), sunday = day(value, 7)
    action[0].props.onClick()
    assert.equal(updates, 1)
    assert.equal(day(value, 6), saturday)
    assert.equal(day(value, 7), sunday)
    const tuesday = elements(render(false), element => element.props.className === 'opening-hours-day' && element.key === '2')[0]
    const input = elements(tuesday, element => element.type === 'input' && element.props.type === 'time')[0]
    input.props.onChange({ target: { value: '09:20' } })
    assert.equal(day(value, 2).periods[0].open, '09:20')
    assert.equal(day(value, 3).periods[0].open, '08:35')
    const before = updates
    action = elements(render(true), element => element.props.className === 'schedule-copy-weekdays')[0]
    assert.equal(action.props.disabled, true)
    action.props.onClick()
    assert.equal(updates, before)
    const html = renderToStaticMarkup(React.createElement(OpeningHoursEditor, { value, locale, onChange() {} }))
    assert.match(html, /class="schedule-copy-actions"/)
    assert.doesNotMatch(html, /type="submit"/)
  })
}

test('both real controls disable their Monday action for closed or invalid source data and the external unconfigured fallback', () => {
  let calls = 0
  const weekly = schedule(); monday(weekly).enabled = false
  const external = openingHours(); monday(external).periods = []
  for (const [component, props] of [[WeeklyScheduleFields, { days: weekly }], [OpeningHoursEditor, { value: external }], [OpeningHoursEditor, {}]]) {
    const tree = component({ ...props, onChange() { calls++ } }), action = elements(tree, element => element.props.className === 'schedule-copy-weekdays')[0]
    assert.equal(action.props.disabled, true)
    action.props.onClick()
  }
  assert.equal(calls, 0)
})
