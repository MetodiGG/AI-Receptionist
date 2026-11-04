import sharp from 'sharp'
import { mkdir, readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

// Mechanical optimization of the owner's fourteen attachments. No generation,
// retouching, external download, provider request or credentials involved.
const sourceRoot = process.argv[2]
if (!sourceRoot) throw new Error('Pass the directory containing the owner attachment groups.')
const manifest = JSON.parse(await readFile(new URL('../docs/homepage-category-photos-2026-11-04.json', import.meta.url), 'utf8'))
const target = new URL('../public/category-photos/', import.meta.url)
await mkdir(target, { recursive: true })
for (const asset of manifest.assets) {
  if (!/^[a-z_]+$/.test(asset.id) || !/^[A-F0-9-]{36}\/\d+-Photo-\d+\.jpg$/.test(asset.source)) throw new Error('Invalid owner attachment record.')
  const input = resolve(sourceRoot, asset.source)
  for (const [suffix, size] of [['', 160], ['-2x', 240]]) {
    const output = new URL(`${asset.id}${suffix}-v${asset.version || 2}.webp`, target)
    try { await access(output); throw new Error(`Refusing to overwrite ${output.pathname}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
    await sharp(input).rotate().resize(size, size, { fit: 'cover', position: 'centre' }).webp({ quality: 86, effort: 6 }).toFile(output.pathname)
  }
}
