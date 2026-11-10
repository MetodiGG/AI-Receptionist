import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PRICING_COPY } from '../../lib/product-config.mjs'
import { SOCIAL_PREVIEW_TITLE, SOCIAL_PREVIEW_ARTWORK, SOCIAL_PREVIEW_SIZE } from '../../lib/social-preview.mjs'

export const runtime = 'nodejs'

// The original owner-provided banner is used intact. Only its empty decorative
// left margin falls outside this CSS frame; logo, copy, calendar and phone fit
// inside the 1200×630 share canvas without stretching or redrawing the artwork.
async function homePreview() {
  const banner = await readFile(path.join(process.cwd(), 'public', SOCIAL_PREVIEW_ARTWORK))
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #ffe7d0, #fff7ef)', color: '#202126', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 52, width: 1200, height: 384, overflow: 'hidden' }}>
        <img alt="" src={`data:image/jpeg;base64,${banner.toString('base64')}`} width={1536} height={384} style={{ position: 'absolute', left: -336, top: 0 }}/>
      </div>
      <div style={{ display: 'flex', position: 'absolute', left: 48, right: 48, bottom: 94, justifyContent: 'center', fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1.15 }}>{SOCIAL_PREVIEW_TITLE}</div>
      <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 36, justifyContent: 'center', fontSize: 28, color: '#9b431d' }}>gorez.co</div>
      <div style={{ display: 'flex', position: 'absolute', bottom: 0, left: 0, height: 8, width: 1200, background: '#ef752e' }}/>
    </div>,
    { ...SOCIAL_PREVIEW_SIZE, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  )
}

export async function GET(request) {
  const url=new URL(request.url),en=url.searchParams.get('lang')==='en',business=url.searchParams.get('page')==='business'
  if (!business) return homePreview()
  const logo=await readFile(path.join(process.cwd(),'public/brand/gorez-mark-v4.png'))
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#f6f5f2',padding:'64px 78px',color:'#202126'}}><div style={{display:'flex',alignItems:'center',gap:22}}><img src={`data:image/png;base64,${logo.toString('base64')}`} width={100} height={100}/><span style={{fontSize:58,fontWeight:700}}>GoRez</span><span style={{marginLeft:'auto',fontSize:26}}>gorez.co</span></div><div style={{display:'flex',fontSize:76,fontWeight:700,lineHeight:1.12,marginTop:55,maxWidth:1020}}>{business?(en?'More time for your clients.':'Повече време за клиентите.'):(en?'Your next appointment. One click away.':'Следващият ти час. На един клик.')}</div><div style={{display:'flex',marginTop:'auto',fontSize:28,color:'#5d6069',maxWidth:1000}}>{business?PRICING_COPY[en?'en':'bg'].summary:(en?'Beauty · Auto services · Sports · And more':'Красота · Автосервизи · Спорт · И още')}</div><div style={{position:'absolute',bottom:0,left:0,height:16,width:1200,background:'#ff722e',display:'flex'}}/></div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=86400'}})
}
