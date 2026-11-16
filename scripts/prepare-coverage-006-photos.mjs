// Mechanical full-frame compression of two built-in image_gen outputs.
// No generation, retouching, cropping, network or credentials in this script.
import sharp from 'sharp'
import { access, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const sourceRoot = process.argv[2]
if (!sourceRoot) throw Error('Pass the directory containing the two generated PNGs')
const coverOnly = process.argv.includes('--cover-only')
const sources = [
  ['sx-groom-french-bulldog', 'exec-1163315a-a36c-4ed9-8c90-d13690bfa3e5.png'],
  ['sx-groom-chow-chow', 'exec-26de4484-e62e-4692-8934-dc6d5a0ed97f.png'],
]
for (const [id, sourceFile] of sources) {
  if (coverOnly && id !== 'sx-groom-french-bulldog') continue
  const input = resolve(sourceRoot, sourceFile)
  const file = coverOnly ? `public/business-cover-photos/activity-${id}-v1.webp` : `public/service-photos/${id}-v1.webp`
  const output = new URL(`../${file}`, import.meta.url)
  try { await access(output); throw Error(`Refusing to overwrite ${id}`) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const original = await readFile(input)
  const metadata = await sharp(original).metadata()
  if (metadata.format !== 'png' || metadata.width !== metadata.height) throw Error('Expected a square generated PNG')
  const size = coverOnly ? 720 : 256
  const info = await sharp(original).rotate().resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: coverOnly ? 76 : 86, effort: coverOnly ? 5 : 6 }).toFile(output.pathname)
  const bytes = await readFile(output)
  console.log(JSON.stringify({ id, sourceFile, sourceSha256: createHash('sha256').update(original).digest('hex'),
    file, width: info.width, height: info.height,
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }))
}
