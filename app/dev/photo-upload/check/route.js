import { readApplicationPhotos, prepareApplicationPhotos } from '../../../../lib/application-photos.mjs'
import { normalizeBusinessImage } from '../../../../lib/image-normalization.mjs'

export async function POST(request) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })
  try {
    const { files } = await readApplicationPhotos(request)
    const images = await prepareApplicationPhotos(files, 0, normalizeBusinessImage)
    return Response.json({ count: images.length, photos: images.map(({ image }) => ({ width: image.width, height: image.height, bytes: image.bytes, format: 'image/webp' })) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return Response.json({ error: error.message }, { status: 422 }) }
}
