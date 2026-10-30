'use client'

// Local-only preparation: no network request, EXIF or original filename. The
// server independently decodes, checks and re-encodes every received image.
export async function preparePhotoFile(file) {
  if (!file || file.size > 20 * 1024 * 1024) throw new Error('IMAGE_TOO_LARGE')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('INVALID_IMAGE')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('INVALID_IMAGE')
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    let blob
    for (const quality of [.8, .65, .5]) {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality))
      if (blob?.size <= 200000) break
    }
    if (!blob || blob.type !== 'image/webp' || blob.size > 600000) throw new Error('IMAGE_TOO_LARGE')
    return new File([blob], 'photo.webp', { type: 'image/webp' })
  } catch (error) { throw new Error(error.message === 'IMAGE_TOO_LARGE' ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE') }
  finally { URL.revokeObjectURL(url) }
}
