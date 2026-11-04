import sharp from 'sharp'
import { access, copyFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'

const input = process.argv[2]
if (!input) throw new Error('Pass the owner-provided GoRez PNG path.')
const source = new URL('../assets/brand/gorez-original-v4.png', import.meta.url)
const target = new URL('../public/brand/', import.meta.url)
await mkdir(new URL('../assets/brand/', import.meta.url), { recursive: true })
await mkdir(target, { recursive: true })
// Keep an unchanged source, including provenance metadata. Do not regenerate,
// recolour, extract the background or crop any part of the G/check mark.
await copyFile(input, source, constants.COPYFILE_EXCL)
for (const [name, size, format] of [['gorez-mark-v4.png', 192, 'png'], ['gorez-mark-v4.webp', 192, 'webp'], ['gorez-mark-96-v4.webp', 96, 'webp']]) {
  const output = new URL(name, target)
  try { await access(output); throw new Error(`Refusing to overwrite ${name}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const image = sharp(source.pathname).resize(size, size, { fit: 'contain' })
  await (format === 'png' ? image.png({ compressionLevel: 9 }) : image.webp({ quality: 94, effort: 6 })).toFile(output.pathname)
}
