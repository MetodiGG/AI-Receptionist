import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as brandAssets from '../../lib/brand-assets.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
async function component(file, imports = {}) {
  const source = await readFile(new URL(`../../components/${file}.js`, import.meta.url), 'utf8')
  const { code } = await transform(source, { filename: `${file}.js`, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const result = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in imports ? imports[name] : require(name), result, result.exports)
  return result.exports
}
const logo = await component('brand-logo', { '../lib/brand-assets.mjs': brandAssets })
export const { BrandLoading } = await component('brand-loading', { './brand-logo': logo })
