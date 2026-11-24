import { createHash } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import sharp from 'sharp'
import { staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'

const hash = input => createHash('sha256').update(input).digest('hex')
const safeInside = (root, target) => {
  const value = relative(root, target)
  return !!value && !isAbsolute(value) && value !== '..' && !value.startsWith('..' + sep)
}

export async function readDiscoveryImage(publicDirectory, url) {
  const path = staticDiscoveryPhotoPath(url)
  if (!path) throw Error('not a supported local image')
  const root = await realpath(publicDirectory)
  const target = await realpath(resolve(root, '.'+path))
  if (!safeInside(root, target)) throw Error('image outside public assets')
  const info = await stat(target)
  if (!info.isFile() || info.size < 10 || info.size > 10 * 1024 * 1024) throw Error('unsupported local asset size')
  return readFile(target)
}

// DCT sign pattern after mean normalization. Compressing/resizing, common
// crops and tint/contrast variants are candidates, not semantic verdicts.
const N = 16, F = 8
const cosines = Array.from({ length: F }, (_, u) => Array.from({ length: N }, (_, x) => Math.cos((2*x+1)*u*Math.PI/(2*N))))
const crops = [
  ['full', 1, 1, .5, .5],
  ['centre-90', .9, .9, .5, .5], ['centre-80', .8, .8, .5, .5], ['centre-70', .7, .7, .5, .5], ['centre-60', .6, .6, .5, .5],
  ['top-75', .75, .75, .5, 0], ['bottom-75', .75, .75, .5, 1],
  ['left-75', .75, .75, 0, .5], ['right-75', .75, .75, 1, .5],
  ['square-centre', 1, 1, .5, .5, true], ['square-top', 1, 1, .5, 0, true], ['square-bottom', 1, 1, .5, 1, true],
]
function luminanceAt(rgb, width, height, x, y) {
  const x0 = Math.max(0, Math.min(width-1, Math.floor(x))), x1 = Math.min(width-1, x0+1)
  const y0 = Math.max(0, Math.min(height-1, Math.floor(y))), y1 = Math.min(height-1, y0+1)
  const fx = Math.max(0, x-x0), fy = Math.max(0, y-y0)
  const read = (x, y) => { const i=3*(y*width+x); return .2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2] }
  return (1-fy)*((1-fx)*read(x0,y0)+fx*read(x1,y0))+fy*((1-fx)*read(x0,y1)+fx*read(x1,y1))
}
function dct(luma, flip) {
  const rows = Array.from({ length:N }, (_, y) => cosines.map(cv => cv.reduce((sum, c, x) => sum+c*luma[y*N+(flip ? N-1-x : x)], 0)))
  const values = []
  for (let v=0; v<F; v++) for (let u=0; u<F; u++) values.push(cosines[v].reduce((sum,c,y)=>sum+c*rows[y][u],0))
  const rest=values.slice(1).sort((a,b)=>a-b), median=rest[rest.length>>>1]
  return values.reduce((pair,v,i)=>{ if (i && v>median) pair[i>>>5]|=1<<(i&31); return pair }, [0,0])
}
function signature(rgb,width,height,[crop,fx,fy,ax,ay,square]) {
  const w = (square ? Math.min(width,height):width)*fx, h=(square ? Math.min(width,height):height)*fy
  const sx=(width-w)*ax, sy=(height-h)*ay
  const luma=Array.from({length:N*N},(_,i)=>{
    // Average over a tiny footprint to reduce compression and sampling noise.
    const x=sx+(i%N+.5)*w/N-.5, y=sy+(Math.floor(i/N)+.5)*h/N-.5
    const dx=w/(N*4),dy=h/(N*4)
    return (luminanceAt(rgb,width,height,x-dx,y-dy)+luminanceAt(rgb,width,height,x+dx,y-dy)+
      luminanceAt(rgb,width,height,x-dx,y+dy)+luminanceAt(rgb,width,height,x+dx,y+dy))/4
  })
  const mean=luma.reduce((a,b)=>a+b,0)/luma.length
  const sigma=Math.sqrt(luma.reduce((v,l)=>v+(l-mean)**2,0)/luma.length)
  const norm=Float32Array.from(luma,x=>(x-mean)/Math.max(8,sigma))
  const flip=Float32Array.from(norm,(_,i)=>norm[Math.floor(i/N)*N+N-1-i%N])
  return {crop,bits:dct(luma,false),reflected:dct(luma,true),norm,flip}
}

export async function fingerprintDiscoveryPhoto(buffer) {
  const opts={ failOn:'error', limitInputPixels: 16*1024*1024 }
  const original=sharp(buffer,opts)
  const metadata=await original.metadata()
  if ((metadata.pages || 1)!==1) throw Error('animation is outside the photo audit')
  const pipeline=()=>sharp(buffer,opts).autoOrient().flatten({background:'#ffffff'}).toColourspace('srgb').removeAlpha()
  const { data, info }=await pipeline().raw().toBuffer({resolveWithObject:true})
  if (info.channels!==3) throw Error('unhandled decoded colour')
  const decoded=hash(Buffer.concat([Buffer.from(info.width+'x'+info.height+'\0'),data]))
  const small=await pipeline().resize({width:96,height:96,fit:'inside',withoutEnlargement:true}).raw().toBuffer({resolveWithObject:true})
  return {sha256:hash(buffer),decoded,width:info.width,height:info.height,format:metadata.format,
    signatures:crops.filter((item,i)=>!item[5] || Math.max(small.info.width,small.info.height)-Math.min(small.info.width,small.info.height)>8)
      .map(item=>signature(small.data,small.info.width,small.info.height,item))}
}

const population = value => {
  let v=value-((value>>>1)&0x55555555)
  v=(v&0x33333333)+((v>>>2)&0x33333333)
  return ((((v+(v>>>4))&0x0f0f0f0f)*0x01010101)>>>24)&0xff
}
const difference = (a,b) => population(a[0]^b[0])+population(a[1]^b[1])
function score(a,b,reflect,limit) {
  const hamming=difference(a.bits,reflect ? b.reflected:b.bits)
  if (hamming>limit) return null
  const compared=reflect ? b.flip:b.norm
  let error=0
  for (let i=0; i<a.norm.length; i++) error+=Math.abs(a.norm[i]-compared[i])
  error/=a.norm.length
  // Spatial luminance agreement is also required; color or generic subject
  // similarity alone must not move an image into another ownership group.
  return error<=.54 ? {kind:'visual-review-candidate',hamming,spatialError:Number(error.toFixed(3)),crops:[a.crop,b.crop],flip:reflect}:null
}
export function compareDiscoveryPhotos(a,b,{maxDistance=10}={}) {
  if (a.sha256===b.sha256) return {kind:'identical-bytes'}
  if (a.decoded===b.decoded) return {kind:'identical-decoded'}
  let best=null
  for (const [x,y] of [[a.signatures[0],b.signatures[0]],...b.signatures.slice(1).map(y=>[a.signatures[0],y]),...a.signatures.slice(1).map(x=>[x,b.signatures[0]])]) {
    for (const reflect of [false,true]) {
      const candidate=score(x,y,reflect,maxDistance)
      if (candidate && (!best || candidate.spatialError<best.spatialError)) best=candidate
    }
  }
  return best
}
