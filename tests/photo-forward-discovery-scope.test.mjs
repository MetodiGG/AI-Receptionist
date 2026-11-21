import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const BASE = '3858c4e5f7e96d8a53db09bc09dc3a014be7658b'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const baseTree = git('ls-tree', '-r', '-z', BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob')
const protectedRoot = path => /^(?:app\/api|hooks|lib|public)\//.test(path)
function frozenPath(path) {
  return protectedRoot(path)
    || /^components\//.test(path) && !['components/inline-category-grid.js', 'components/discovery-subcategories.js'].includes(path)
    || /^app\/.*\.css$/.test(path) && path !== 'app/inline-discovery.css'
    || /^(?:package\.json|pnpm-lock\.yaml|next\.config\.mjs)$/.test(path)
}
const frozen = baseTree.filter(record => frozenPath(record.path))

test('the photo-forward pass changes no search, API, taxonomy, images, booking, cards, summary, presence or dependency files from 3858c4e', async () => {
  assert.equal(frozen.length, 2625)
  assert.equal(sha256(JSON.stringify(frozen)), '5ca0ccae56c0a003d91c4d37e43a8f286d8fcf455527a11ddcc82d3b9c728278')
  for (let offset = 0; offset < frozen.length; offset += 32) {
    await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
      const path = new URL('../' + record.path, import.meta.url)
      const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
      const oid = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
      assert.equal(oid, record.oid, `${record.path} must remain byte-identical to ${BASE}`)
    }))
  }
  const expected = baseTree.filter(record => protectedRoot(record.path)).map(record => record.path).sort()
  assert.equal(expected.length, 2492)
  const actual = git('ls-files', '--cached', '--others', '-z', '--', 'app/api', 'hooks', 'lib', 'public').split('\0').filter(Boolean)
  assert.deepEqual([...new Set(actual)].sort(), expected, 'No new/renamed/removed data, APIs, taxonomy or media may hide outside the frozen manifest')
})

test('the complete main search and booking/card/summary/presence sources retain their reviewed byte hashes', async () => {
  const files = {
    'components/discovery-search.js': '94e0b22f2830dbf5d81304188e7e8eaa87861db83f82669b7d50c26780cfd47a',
    'components/discovery-business-card.js': 'f7d488df5789416d1c934dc939878968b71d9c937cade3642a963ac02cd31a01',
    'components/inline-discovery-summary.js': 'ab80456bd6692e129c4777ecddc61036d0085cb33e8b916d17b8129ea68cfb54',
    'components/inline-discovery-panel.js': '814c7f1d82b28b2743630c86118b7cf184995512921c4a937d922fd63342d6db',
    'app/inline-discovery-panel.css': '5982be44f3705c226a76b0ed9f260d3501b0d90ba28eec7ae038b94c45fb0b60',
  }
  for (const [path, hash] of Object.entries(files)) assert.equal(sha256(await read(path)), hash, path)
  const source = await read('components/discovery-search.js')
  const start = source.indexOf('<form className="discovery-form"'), end = source.indexOf('</form>', start) + 7
  assert.ok(start >= 0 && end > start)
  assert.equal(sha256(source.slice(start, end)), '8ba0c17fc09aede40e70af62f168f90ec900f5f3e08870d4ac0ef22090f6c89a')
})

test('approved tile markup cannot change category/service filtering, image failure behavior or the legacy non-home menu', async () => {
  const current = await read('components/discovery-subcategories.js')
  const original = git('show', BASE + ':components/discovery-subcategories.js')
  const between = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker), end = source.indexOf(endMarker, start)
    assert.ok(start >= 0 && end > start)
    return source.slice(start, end)
  }
  for (const [start, end] of [
    ['function SubcategoryPhoto(', 'export function DiscoverySubcategories('],
    ['export function DiscoverySubcategories(', '  if (inline) {'],
  ]) assert.equal(between(current, start, end), between(original, start, end))
  const legacyStart = '  if (!category ||'
  assert.ok(current.includes(legacyStart) && original.includes(legacyStart))
  assert.equal(current.slice(current.indexOf(legacyStart)), original.slice(original.indexOf(legacyStart)))
  assert.ok(current.includes("const needsWideLabels = choices.some(item => /\\p{L}{14,}/u.test(item[language] || item.label || ''))"), 'the only narrow-layout flag is derived from complete visible localized labels')
  assert.match(current, /data-long-label=\{needsWideLabels \? 'true' : undefined\}/)
  const category = await read('components/inline-category-grid.js')
  const categoryBefore = git('show', BASE + ':components/inline-category-grid.js')
  const originalPhoto = between(categoryBefore, 'function CategoryPhoto(', '// A persistent')
  const approvedPhoto = originalPhoto
    .replace('  const [failed, setFailed] = useState(null)\n', '  const [failed, setFailed] = useState(null)\n  const source = category.photo2x\n')
    .replace('failed !== category.photo', 'failed !== source')
    .replace('src={category.photo}', 'src={source}')
    .replace('srcSet={`${category.photo} 1x, ${category.photo2x} 2x`}', 'srcSet={`${category.photo} 160w, ${category.photo2x} 240w`} sizes="(max-width:699px)50vw,(max-width:999px)33vw,280px"')
    .replace('width={80} height={80}', 'width={240} height={240}')
    .replace('setFailed(category.photo)', 'setFailed(source)')
  assert.notEqual(approvedPhoto, originalPhoto)
  assert.equal(between(category, 'function CategoryPhoto(', '// A persistent'), approvedPhoto, 'only approved existing-image responsive metadata and its primary-source error key may differ')
})

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
function summaryRules(source) {
  const found = []
  parse(source).walkRules(rule => {
    const selectors = rule.selectors.filter(selector => /\.inline-summary(?:\b|[.-])/.test(selector))
    if (!selectors.length) return
    const conditions = []
    for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
      if (parent.type === 'atrule') conditions.unshift([parent.name, parent.params])
    }
    found.push({
      selectors, conditions,
      declarations: rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value, Boolean(node.important)]),
    })
  })
  return found
}

test('rewriting tile CSS leaves the complete existing summary CSS cascade unchanged', async () => {
  const before = summaryRules(git('show', BASE + ':app/inline-discovery.css'))
  assert.ok(before.length > 15, 'freeze the actual responsive, dark, sticky, focus and reduced-motion summary rules')
  assert.deepEqual(summaryRules(await read('app/inline-discovery.css')), before)
})
