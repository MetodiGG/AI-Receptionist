'use client'

export const MAX_SOURCE_PHOTO_BYTES = 50 * 1024 * 1024
export const MAX_SOURCE_PHOTO_PIXELS = 64000000
export const PREPARED_PHOTO_BYTES = 200000
export const PHOTO_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

// Local-only preparation. Large originals never go over the network. The server
// independently decodes and re-encodes the result, stripping EXIF/GPS again.
export async function preparePhotoFile(file, { maxBytes = PREPARED_PHOTO_BYTES } = {}) {
  if (!file?.size || file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error('SOURCE_IMAGE_TOO_LARGE')
  const type = String(file.type || '').toLowerCase()
  const heic = ['image/heic', 'image/heif'].includes(type) || /\.hei[cf]$/i.test(file.name || '')
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type) && !heic
    && !(!type && /\.(jpe?g|png|webp)$/i.test(file.name || ''))) throw new Error('INVALID_IMAGE')
  if (!Number.isInteger(maxBytes) || maxBytes < 10000 || maxBytes > PREPARED_PHOTO_BYTES) throw new Error('IMAGE_PROCESSING_FAILED')
  const url = URL.createObjectURL(file)
  let image, canvas
  try {
    image = new Image()
    image.src = url
    try { await image.decode() } catch { throw new Error(heic ? 'HEIC_UNSUPPORTED' : 'INVALID_IMAGE') }
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_SOURCE_PHOTO_PIXELS) throw new Error('INVALID_IMAGE')
    canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('IMAGE_PROCESSING_FAILED')
    const unsupported = new Set()
    for (const edge of [1600, 1280, 1024, 800, 640, 480]) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      for (const format of ['image/webp', 'image/jpeg', 'image/png']) {
        if (unsupported.has(format)) continue
        context.clearRect(0, 0, canvas.width, canvas.height)
        // Safari may not encode WebP. JPEG is the normal compatibility fallback;
        // give transparent originals a white background, not a black rectangle.
        if (format === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height) }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        for (const quality of format === 'image/png' ? [undefined] : [.84, .72, .6]) {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality))
          if (!blob) break
          // Unsupported encoders silently return PNG; never rename that as WebP.
          if (blob.type !== format) { unsupported.add(format); break }
          if (blob.size && blob.size <= maxBytes) return new File([blob], `photo.${{ 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[format]}`, { type: format })
        }
      }
    }
    throw new Error('IMAGE_PROCESSING_FAILED')
  } catch (error) { throw new Error(['HEIC_UNSUPPORTED', 'INVALID_IMAGE', 'IMAGE_PROCESSING_FAILED'].includes(error.message) ? error.message : 'IMAGE_PROCESSING_FAILED') }
  finally { if (canvas) { canvas.width = 1; canvas.height = 1 }; if (image) image.src = ''; URL.revokeObjectURL(url) }
}

// Preserve the existing bounded application endpoint. A large gallery + team
// is compressed locally to fit its shared request, not rejected at the last step.
export async function fitPhotoFilesToBudget(files, budget) {
  if (!Array.isArray(files) || files.length > 32 || !Number.isInteger(budget) || budget < files.length * 10000) throw new Error('IMAGE_PROCESSING_FAILED')
  if (files.reduce((sum, file) => sum + file.size, 0) <= budget) return files
  const maxBytes = Math.min(PREPARED_PHOTO_BYTES, Math.floor(budget / files.length)), result = []
  for (const file of files) result.push(file.size <= maxBytes ? file : await preparePhotoFile(file, { maxBytes }))
  return result
}
