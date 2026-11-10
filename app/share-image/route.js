import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { SOCIAL_PREVIEW_ARTWORK, SOCIAL_PREVIEW_SIZE } from '../../lib/social-preview.mjs'
import { socialPreviewSvg } from '../../lib/social-preview-image.mjs'

export const runtime = 'nodejs'

// Home, search, business signup and business-profile links use the same updated
// artwork. Their actual titles/descriptions remain in each page's metadata.
export async function GET() {
  const banner = await readFile(path.join(process.cwd(), 'public', SOCIAL_PREVIEW_ARTWORK))
  const image = Buffer.from(socialPreviewSvg(banner)).toString('base64')
  return new ImageResponse(
    <img alt="" src={`data:image/svg+xml;base64,${image}`} width={1200} height={630}/>,
    { ...SOCIAL_PREVIEW_SIZE, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  )
}
