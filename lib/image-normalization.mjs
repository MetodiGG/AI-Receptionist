import sharp from 'sharp'
import { MAX_UPLOAD_BYTES } from './business-media.mjs'

export async function normalizeBusinessImage(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size || file.size > MAX_UPLOAD_BYTES) throw new Error('IMAGE_TOO_LARGE')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('INVALID_IMAGE')
  try {
    const input = Buffer.from(await file.arrayBuffer())
    if (input.length > MAX_UPLOAD_BYTES) throw new Error('IMAGE_TOO_LARGE')
    const image = sharp(input, { limitInputPixels: 40000000, failOn: 'warning', animated: false })
    const metadata = await image.metadata()
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) !== 1) throw new Error('INVALID_IMAGE')
    // Re-encode, auto-orient and strip EXIF/XMP/IPTC, including GPS. Never keep
    // user filenames, metadata, SVG/XML or original compressed bytes.
    for (const edge of [1600, 1280, 1024, 800]) {
      const { data, info } = await image.clone().rotate().resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
      if (data.length <= 1024 * 1024) return { data, width: info.width, height: info.height, bytes: data.length }
    }
    throw new Error('IMAGE_TOO_LARGE')
  } catch (error) { throw new Error(error.message === 'IMAGE_TOO_LARGE' ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE') }
}
