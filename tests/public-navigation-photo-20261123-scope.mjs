import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = '8f145b4edb6c076af614d644117e10257df12df0'
const root = fileURLToPath(new URL('../', import.meta.url))
const changed = {
  'app/layout.js': ['d53f2dae19b7a0234dcebdf5b924e3e431ad295d4c1cf5d533b2bf7511a80a58', 'ba6e577c5cd356564cd58c3351dc01e64fe50f6fa03629b6167c78d0592f2b9b'],
  'components/service-thumbnail.js': ['c27fc50b29de0991f13c6d1afdb94c8f0888c80b58668dadfb9862ee567ab3e9', 'cd17efcb4b9e67799a008f813def31d3930effcb23b31e5b8ce07bd33485262e'],
  'lib/discovery/subcategories.mjs': ['f2dbe83bcb2723d9da4e365d02afc6d2b0f108a73a40b74122509c31b6d8030e', 'd45cdfb973e9f5faf5423a4a5f723c34b82a0f79aac981a674ca80e7e5c336d4'],
  'lib/service-photo-catalogue-matches.mjs': ['aba631bc8637383a89f202a3e7868ccbc8c7a21f4544005e8649c27904efa70d', '1f87a862bf16e4e5bc3ef45ab45f81429d48a6183e36af38fbd1fb4e4c3c7117'],
}
const newFiles = {
  'components/go-rez-scroll-top.js': '88452bc9897e9c25effe0754cc14edf40eadd75cff7e2075e1c57e9f453a88e3',
  'components/go-rez-scroll-top.module.css': '9602d7d2c727e96b89d5b20d99906dcf775cc9c6b3b947aac48b8f38e5eb518f',
  'lib/scroll-top.mjs': '75db68056c4127155d814d58055bfa32f56742f0a5678e94bb10943642612469',
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const allowed = (path, hash) => {
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === hash } catch { return false }
}
export const navigationPhotosAllowsFileChange = path => Object.hasOwn(changed, path) && allowed(path, changed[path][1])
export const navigationPhotosAllowsNewFile = path => Object.hasOwn(newFiles, path) && allowed(path, newFiles[path])

// Historic comparisons run on their original inputs; no old receipt is
// rewritten and any additional file change still fails the pinned hash check.
export function navigationPhotosPriorSource(path, current) {
  if (!Object.hasOwn(changed, path)) return current
  const [priorHash, currentHash] = changed[path], hash = digest(current)
  if (hash === priorHash) return current
  if (hash !== currentHash) throw Error('Unreviewed 23 Nov navigation/photo source delta: ' + path)
  const prior = execFileSync('git', ['show', `${base}:${path}`], { cwd: root, encoding: 'utf8' })
  if (digest(prior) !== priorHash) throw Error('Navigation/photo replay must restore every prior source byte: ' + path)
  return prior
}
