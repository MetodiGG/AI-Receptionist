import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Preserve the uploaded artwork within the maskable safe area.
export async function GET(request) {
  const size = new URL(request.url).searchParams.get('size') === '180' ? 180 : 512
  const symbol = await readFile(path.join(process.cwd(), 'public/brand/gorez-mark-v4.png'))
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#202126' }}><img alt="" src={`data:image/png;base64,${symbol.toString('base64')}`} width={size * .8} height={size * .8}/></div>, { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })
}
