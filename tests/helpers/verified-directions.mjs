import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { publicBusinessLocation } from '../../lib/business-directions.mjs'
import * as publicAction from './public-action.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const url = new URL('../../components/directions-unavailable.js', import.meta.url)
const { code } = await transform(await readFile(url, 'utf8'), {
  filename: url.pathname,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const local = createRequire(url)
const component = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === './public-action' ? publicAction :
  name.endsWith('.module.css') ? { container: 'unavailable-directions' } : local(name), component, component.exports)
export const { DirectionsUnavailable } = component.exports

export function withVerifiedFixtureDirections(business, point = { latitude: 42.712345, longitude: 23.334567 }) {
  return { ...business, ...publicBusinessLocation(business, point) }
}
