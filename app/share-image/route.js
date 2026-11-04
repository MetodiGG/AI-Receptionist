import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PRICING_COPY } from '../../lib/product-config.mjs'

export async function GET(request) {
  const url=new URL(request.url),en=url.searchParams.get('lang')==='en',business=url.searchParams.get('page')==='business'
  const logo=await readFile(path.join(process.cwd(),'public/brand/gorez-mark-v4.png'))
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#f6f5f2',padding:'64px 78px',color:'#202126'}}><div style={{display:'flex',alignItems:'center',gap:22}}><img src={`data:image/png;base64,${logo.toString('base64')}`} width={100} height={100}/><span style={{fontSize:58,fontWeight:700}}>GoRez</span><span style={{marginLeft:'auto',fontSize:26}}>gorez.co</span></div><div style={{display:'flex',fontSize:76,fontWeight:700,lineHeight:1.12,marginTop:55,maxWidth:1020}}>{business?(en?'More time for your clients.':'Повече време за клиентите.'):(en?'Your next appointment. One click away.':'Следващият ти час. На един клик.')}</div><div style={{display:'flex',marginTop:'auto',fontSize:28,color:'#5d6069',maxWidth:1000}}>{business?PRICING_COPY[en?'en':'bg'].summary:(en?'Beauty · Auto services · Sports · And more':'Красота · Автосервизи · Спорт · И още')}</div><div style={{position:'absolute',bottom:0,left:0,height:16,width:1200,background:'#ff722e',display:'flex'}}/></div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=86400'}})
}
