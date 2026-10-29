import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// New raster delivery of the vector mark, not a crop of the legacy PNG.
export async function GET(request) {
  const size = new URL(request.url).searchParams.get('size') === '180' ? 180 : 512
  const symbol = await readFile(path.join(process.cwd(), 'public/gorez-symbol.svg'))
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#202126' }}><img alt="" src={`data:image/svg+xml;base64,${symbol.toString('base64')}`} width={size * .74} height={size * .74}/></div>, { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })
}
