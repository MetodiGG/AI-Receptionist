import sharp from 'sharp'
import { access, mkdir } from 'node:fs/promises'

// Static transparent product illustrations; not photos of partner businesses.
// Keep the generated originals outside the public bundle. This script only
// makes bounded responsive copies and never flattens their alpha.
const sources = { partners: process.argv[2], ...(process.argv[3] ? { business: process.argv[3] } : {}) }
if (!sources.partners) throw new Error('Pass the generated handshake PNG path, and optionally the laptop PNG path.')
const directory = new URL('../public/home-art/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [name, input] of Object.entries(sources)) for (const size of [240, 480]) {
  const output = new URL(`${name}-3d-${size === 480 ? '2x-' : ''}v${name === 'partners' ? 2 : 1}.webp`, directory)
  try { await access(output); throw new Error(`Refusing to overwrite ${output.pathname}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  await sharp(input).resize(size, name === 'partners' ? size / 2 : size, { fit: 'contain' }).webp({ quality: 88, effort: 6 }).toFile(output.pathname)
}
