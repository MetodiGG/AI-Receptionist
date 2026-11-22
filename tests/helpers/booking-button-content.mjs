// Reuse the actual pure decorative component in SWC/SSR regression harnesses.
// This module does not mount hooks, run browser code, or request any service.
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as publicAction from './public-action.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const { code } = await transform(await readFile(new URL('../../components/booking-button-content.js', import.meta.url), 'utf8'), {
  filename: 'components/booking-button-content.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === './public-action' ? publicAction : require(name), module, module.exports)
export const { BookingCalendarIcon, BookingButtonContent } = module.exports
