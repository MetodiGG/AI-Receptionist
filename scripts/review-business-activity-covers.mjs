// Offline contact sheets for source recovery review. No publication, network,
// source modifications, retouching, catalogue writes or production requests.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({ options: { 'source-dir': { type: 'string' } } })
if (!values['source-dir']) throw Error('Provide the explicit approved source directory')
const source = resolve(values['source-dir'])
const manifest = JSON.parse(await readFile(resolve(root, 'docs/business-activity-cover-sources-2026-11-15.json'), 'utf8'))
const recovered = manifest.assets.filter(item => item.sourceRecovery)
const directory = resolve(root, 'artifacts/activity-cover-review')
await mkdir(directory, { recursive: true })
const escape = text => text.replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
const pages = []
for (let start = 0; start < recovered.length; start += 16) {
  const items = recovered.slice(start, start + 16), columns = 4, cellWidth = 280, cellHeight = 178
  const width = columns * cellWidth, height = Math.ceil(items.length / columns) * cellHeight
  const layers = []
  for (const [index, item] of items.entries()) {
    const left = (index % columns) * cellWidth, top = Math.floor(index / columns) * cellHeight
    layers.push({ input: await sharp(resolve(source, item.sourceFile)).resize(128, 128).jpeg({ quality: 88 }).toBuffer(), left, top: top + 30 })
    layers.push({ input: await sharp(resolve(root, item.approvedServicePhoto)).resize(128, 128).jpeg({ quality: 88 }).toBuffer(), left: left + 132, top: top + 30 })
    const label = '<svg width="280" height="26"><rect width="280" height="26" fill="#fff"/><text x="2" y="12" font-size="11" font-family="Arial" fill="#222">'+escape(item.id)+'</text><text x="2" y="24" font-size="10" font-family="Arial" fill="#555">Original PNG                         Approved thumbnail</text></svg>'
    layers.push({ input: Buffer.from(label), left, top })
  }
  const path = resolve(directory, `source-pairs-${String(pages.length + 1).padStart(2, '0')}.jpg`)
  await sharp({ create: { width, height, channels: 3, background: '#ffffff' } }).composite(layers).jpeg({ quality: 90 }).toFile(path)
  pages.push({ file: path, ids: items.map(item => item.id) })
}
await writeFile(resolve(directory, 'source-pairs-index.json'), JSON.stringify(pages, null, 2) + '\n')
console.log(JSON.stringify({ recoveredSources: recovered.length, pages }, null, 2))
