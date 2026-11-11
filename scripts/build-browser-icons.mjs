import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { BRAND_APPLE_ICON, BRAND_FAVICON_ICO, BRAND_FAVICON_PNG, BRAND_MARK_PNG, BRAND_PWA_ICON } from '../lib/brand-assets.mjs'

// Derive every browser icon from the unchanged owner-supplied GoRez mark.
// Run from any directory with: node scripts/build-browser-icons.mjs
const asset = path => new URL(`../public${path}`, import.meta.url)
const mark = await readFile(asset(BRAND_MARK_PNG))
const { width, height, hasAlpha } = await sharp(mark).metadata()
if (!hasAlpha || width !== height) throw new Error('Expected the square transparent GoRez master mark')

const cream = '#fff7ee'
const render = async (size, markSize = size, background = { r: 0, g: 0, b: 0, alpha: 0 }) => {
  const logo = await sharp(mark).resize(markSize, markSize).png().toBuffer()
  if (size === markSize) return logo
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toBuffer()
}

const dimensions = [16, 32, 48, 96]
const icons = await Promise.all(dimensions.map(size => render(size)))
// The ICO directory stores actual PNG images, preserving the logo transparency.
const header = Buffer.alloc(6 + 16 * dimensions.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(dimensions.length, 4)
let offset = header.length
for (const [index, size] of dimensions.entries()) {
  const entry = 6 + 16 * index
  header[entry] = size
  header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(icons[index].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += icons[index].length
}
await Promise.all([
  writeFile(asset(BRAND_FAVICON_ICO), Buffer.concat([header, ...icons])),
  writeFile(asset(BRAND_FAVICON_PNG), icons.at(-1)),
  writeFile(asset(BRAND_APPLE_ICON), await render(180, 148, cream)),
  writeFile(asset(BRAND_PWA_ICON), await render(512, 336, cream)),
])
