import sharp from 'sharp'
import { access, mkdir } from 'node:fs/promises'

const input = process.argv[2]
if (!input) throw new Error('Pass the selected owner-provided Other services image path.')
const directory = new URL('../public/category-photos/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [name, size] of [['other-v4.webp', 160], ['other-2x-v4.webp', 240]]) {
  const output = new URL(name, directory)
  try { await access(output); throw new Error(`Refusing to overwrite ${name}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  await sharp(input).resize(size, size, { fit: 'cover', position: 'centre' }).webp({ quality: 86, effort: 6 }).toFile(output.pathname)
}
