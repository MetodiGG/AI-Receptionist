// Load the real shared presentation component for offline SWC/SSR tests.
// Only generated CSS-module class names are stubbed; no action is simulated.
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const css = await readFile(new URL('../../components/public-action.module.css', import.meta.url), 'utf8')
export const publicActionStyles = Object.freeze(Object.fromEntries([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(match => [match[1], `public-action-${match[1]}`])))
async function load(path, imports = {}) {
  const { code } = await transform(await readFile(new URL('../../' + path, import.meta.url), 'utf8'), {
    filename: path, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(imports, name) ? imports[name] : require(name), module, module.exports)
  return module.exports
}
const icons = await load('components/icon.js')
export const { PublicAction, PublicActionContent, PublicActionPair } = await load('components/public-action.js', {
  './icon': icons, './public-action.module.css': publicActionStyles,
})
const wrappers = new Set([PublicAction, PublicActionContent, PublicActionPair])
export function expandPublicActions(node) {
  if (Array.isArray(node)) return node.map(expandPublicActions)
  if (!React.isValidElement(node)) return node
  if (wrappers.has(node.type)) return expandPublicActions(node.type(node.props))
  return node.props.children === undefined ? node : React.cloneElement(node, {}, expandPublicActions(node.props.children))
}
