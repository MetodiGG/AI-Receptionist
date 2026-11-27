import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const locationActionFitBaseline = '2a1f06479bd2cf5c49b72017c4b094eee7e95dca'
export const locationActionFitPath = 'components/public-action.module.css'
const before = '85df4e1edeb0c0759e39a3cd07bfb235c710beb3edba3a41a998abf430a6fe75'
const after = '0a198d04cf6e9357fa037ced1d46742b804aa896791793104c8d765c43c2d8b0'
const root = fileURLToPath(new URL('../', import.meta.url))
const sha = value => createHash('sha256').update(value).digest('hex')
let original

export function locationActionFitAllowsFileChange(path) {
  if (path !== locationActionFitPath) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(readFileSync(file)) === after
  } catch { return false }
}

export function locationActionFitPriorSource(path, source) {
  if (path !== locationActionFitPath || sha(source) !== after) return source
  if (!original) {
    original = execFileSync('git', ['show', locationActionFitBaseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Location action fit baseline does not match pinned CSS')
  }
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
