// Mechanical project-asset preparation only: retain the generated alpha,
// normalize framing, downscale, strip metadata and encode efficient WebP files.
// No image-generation API, remote input, background removal or pixel repainting.
import { mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const inputRoot = process.argv[2]
if (!inputRoot) throw new Error('Pass the directory containing the original built-in generated PNGs.')
const manifest = JSON.parse(await readFile(new URL('../docs/category-art-prompts-2026-10-30.json', import.meta.url), 'utf8'))
const destination = fileURLToPath(new URL('../public/category-art/', import.meta.url))
await mkdir(destination, { recursive: true })
for (const asset of manifest.assets) {
  if (!/^[a-z]+$/.test(asset.name) || !/^exec-[a-f0-9-]+\.png$/.test(asset.sourceFilename)) throw new Error('INVALID_ART_MANIFEST')
  const input = join(resolve(inputRoot), asset.sourceFilename), metadata = await sharp(input).metadata(), stats = await sharp(input).stats()
  if (!metadata.hasAlpha || stats.channels.at(-1).min !== 0) throw new Error(`SOURCE_MUST_BE_TRANSPARENT: ${asset.name}`)
  const prepared = await sharp(input).trim({ threshold: 8 }).resize(224, 224, { fit: 'contain', background: '#00000000' })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: '#00000000' }).png().toBuffer()
  for (const size of [128, 256]) {
    const filename = `${asset.name}${size === 128 ? '-sm' : ''}-v1.webp`
    const info = await sharp(prepared).resize(size, size).webp({ quality: 84, alphaQuality: 95, effort: 6 }).toFile(join(destination, filename))
    console.info(`${filename}: ${info.size} bytes`)
  }
}
