import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { createCataloguePhotoHandlers, createCatalogueImageHandler } from '../lib/catalogue-photo-handlers.mjs'
import { attachCataloguePhotos, cataloguePhotoView, isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { uploadCataloguePhoto, cleanupCataloguePhotos } from '../lib/catalogue-photo-store.mjs'
import { normalizeBusinessImage } from '../lib/image-normalization.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const id = 'sofia-mokro-nosle', photo = '10000000-0000-4000-8000-000000000001', actor = '20000000-0000-4000-8000-000000000001'
const user = { id: actor, email_confirmed_at: '2026-11-06', email: 'admin@example.test' }
const row = () => ({ catalogue_id:id,photo_id:photo,object_key:`catalogue/${id}/${photo}.webp`,width:800,height:600,alt_text:'Business photo',rights_basis:'owner_permission',rights_reference:'Owner email permission · 06.11.2026' })
const request = (method = 'GET', body, headers = {}) => new Request(`https://gorez.test/api/admin/catalogue/${id}/photo`, { method, headers: { Origin:'https://gorez.test',...headers }, ...(body ? { body } : {}) })
const form = (patch = {}) => {
  const data = new FormData()
  for (const [key,value] of Object.entries({revision:'0',consent:'true',rightsReference:'Owner email · 06.11.2026',alt:'Shop',...patch})) if (value != null) data.append(key,value)
  data.append('file',new File(['fake decoded in dependency test'],'photo.jpg',{type:'image/jpeg'}))
  return data
}
function harness(patch = {}) {
  const calls = [], state = {id,name:'Example',editable:true,revision:0,photo:null}
  const deps = { authenticate:async()=>user,isAdmin:u=>u.email===user.email,allowAttempt:async()=>true,findEntry:value=>value===id,
    detail:async()=>({...state}),list:async input=>{calls.push(['list',input]);return {entries:[],total:0}},
    normalize:async()=>{calls.push(['normalize']);return {data:Buffer.from('image'),width:800,height:600,bytes:5}},
    upload:async value=>{calls.push(['upload',value]);state.revision++;state.photo={src:`/api/catalogue-media/${value.mediaId}`}},
    remove:async value=>{calls.push(['remove',value]);state.revision++;state.photo=null},...patch }
  return { calls,state,handlers:createCataloguePhotoHandlers(deps) }
}
test('all catalogue photo endpoints require a verified allowlisted admin before reading data or files', async () => {
  for (const identity of [null,{...user,email_confirmed_at:null},{...user,is_anonymous:true},{...user,email:'owner@example.test'}]) {
    const h=harness({authenticate:async()=>identity,detail:()=>assert.fail('private read'),list:()=>assert.fail('private list')})
    const expected=identity?.email==='owner@example.test'?403:401
    for(const response of [await h.handlers.LIST(request()),await h.handlers.GET(request(),id),await h.handlers.POST(request('POST',form()),id),await h.handlers.PATCH(request('PATCH','{}',{'Content-Type':'application/json'}),id)]) assert.equal(response.status,expected)
    assert.equal(h.calls.length,0)
  }
})
test('cross-origin writes, arbitrary catalogue IDs and exhausted write limits are rejected', async()=>{
  const h=harness()
  assert.equal((await h.handlers.POST(request('POST',form(),{Origin:'https://evil.test'}),id)).status,403)
  assert.equal((await h.handlers.PATCH(request('PATCH','{}',{'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'}),id)).status,403)
  for(const value of ['../businesses','sofia-unknown','constructor','10000000-0000-4000-8000-000000000001']) assert.equal((await h.handlers.GET(request(),value)).status,404)
  assert.equal((await harness({allowAttempt:async()=>false}).handlers.POST(request('POST',form()),id)).status,429)
  assert.equal(h.calls.length,0)
})
test('upload accepts only one bounded file, consent, a permission reference and an explicit revision',async()=>{
  for(const patch of [{consent:'false'},{consent:null},{revision:null},{revision:'-1'},{revision:'1.5'},{revision:'99999999999999999999999'},{rightsReference:'x'},{alt:'x'.repeat(161)}]) {
    const h=harness();assert.equal((await h.handlers.POST(request('POST',form(patch)),id)).status,422);assert.equal(h.calls.length,0)
  }
  for(const duplicate of ['consent','file','revision']) {
    const h=harness(), f=form();f.append(duplicate,'forged');assert.equal((await h.handlers.POST(request('POST',f),id)).status,422);assert.equal(h.calls.length,0)
  }
  const h=harness(), f=form();f.append('object_key','another-business/photo');assert.equal((await h.handlers.POST(request('POST',f),id)).status,422)
  assert.equal((await h.handlers.POST(request('POST',form(),{'content-length':'5000000'}),id)).status,422)
})
test('upload uses a server UUID and authenticated actor; stale edits and partners are not overwritten',async()=>{
  const h=harness(), response=await h.handlers.POST(request('POST',form()),id)
  assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/)
  const value=h.calls.find(([kind])=>kind==='upload')[1]
  assert.equal(value.actorId,actor);assert.equal(value.catalogueId,id);assert.match(value.mediaId,/^[0-9a-f-]{36}$/);assert.equal(value.consent,'true')
  assert.equal((await response.json()).revision,1)
  assert.equal((await harness({detail:async()=>({revision:2,editable:true})}).handlers.POST(request('POST',form()),id)).status,409)
  assert.equal((await harness({detail:async()=>({revision:0,editable:false})}).handlers.POST(request('POST',form()),id)).status,409)
})
test('remove is revision-protected and accepts no image/object keys; SQL conflicts remain explicit',async()=>{
  const h=harness(), body=JSON.stringify({revision:0,action:'remove'})
  assert.equal((await h.handlers.PATCH(request('PATCH',body,{'Content-Type':'application/json'}),id)).status,200)
  assert.equal(h.calls[0][1].actorId,actor)
  for(const patch of [{revision:null,action:'remove'},{revision:0,action:'delete'},{revision:0,action:'remove',object_key:'foreign'}]) assert.equal((await h.handlers.PATCH(request('PATCH',JSON.stringify(patch),{'Content-Type':'application/json'}),id)).status,422)
  const failed=harness({remove:async()=>{throw Error('CATALOGUE_PHOTO_CHANGED')}})
  assert.equal((await failed.handlers.PATCH(request('PATCH',body,{'Content-Type':'application/json'}),id)).status,409)
})
test('catalogue listing validates query pagination and reports missing migration without leaking SQL',async()=>{
  const h=harness()
  for(const suffix of ['?q='+('x'.repeat(101)),'?offset=-1','?q=a&q=b','?unknown=x']) assert.equal((await h.handlers.LIST(new Request('https://gorez.test/api/admin/catalogue'+suffix))).status,422)
  const failed=harness({list:async()=>{throw {code:'42P01',message:'secret database details'}}})
  const response=await failed.handlers.LIST(request());assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:{code:'CATALOGUE_MEDIA_NOT_READY'}})
})
test('catalogue photos cannot inject URLs or rights notes into public results or partner images',()=>{
  for(const src of ['javascript:alert(1)','https://outside.test/p.webp','/api/business-media/'+photo,'/catalogue-media/../photo.webp'])assert.equal(isCataloguePhotoSource(src),false)
  assert.equal(isCataloguePhotoSource('/api/catalogue-media/'+photo),true)
  assert.equal(isCataloguePhotoSource('/catalogue-media/original.webp'),true)
  const view=cataloguePhotoView(row());assert.deepEqual(Object.keys(view).sort(),['alt','height','src','width'])
  for(const patch of [{photo_id:null},{rights_basis:null},{rights_reference:''},{width:null},{catalogue_id:'../forged'}]) assert.equal(cataloguePhotoView({...row(),...patch}),null)
  const original=[{id,source:'catalogue'},{id,source:'gorez',photo:{src:'partner-owned'}}], result=attachCataloguePhotos(original,[row()])
  assert.equal(result[0].photo.src,'/api/catalogue-media/'+photo);assert.equal(result[1],original[1]);assert.equal(original[0].photo,undefined)
  assert.doesNotMatch(JSON.stringify(result),/rights_reference|Owner email/)
})
test('public images deliver only the current approved photo and never serve hidden, expired or foreign objects',async()=>{
  const denied=()=>assert.fail('must not download')
  for(const patch of [{findApprovedEntry:()=>null},{read:async()=>null},{read:async()=>({...row(),photo_id:'other'})},{read:async()=>({...row(),object_key:'foreign/secret.webp'})},{read:async()=>({...row(),rights_reference:''})}]) {
    const handler=createCatalogueImageHandler({allowAttempt:async()=>true,read:async()=>row(),findApprovedEntry:()=>true,download:denied,...patch})
    assert.equal((await handler(request(),photo)).status,404)
  }
  const handler=createCatalogueImageHandler({allowAttempt:async()=>true,read:async()=>row(),findApprovedEntry:()=>true,download:async()=>Buffer.from('webp')})
  const response=await handler(request(),photo);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(await response.text(),'webp')
  assert.equal((await handler(request(),'../foreign')).status,404)
})
test('real image normalization rejects spoofed formats and strips embedded metadata',async()=>{
  const buffer=await sharp({create:{width:2400,height:1800,channels:3,background:'#ff9146'}}).jpeg().toBuffer()
  const image=await normalizeBusinessImage(new File([buffer],'camera.jpg',{type:'image/jpeg'})), meta=await sharp(image.data).metadata()
  assert.equal(meta.format,'webp');assert.ok(image.width<=1600&&image.height<=1600);assert.ok(image.bytes<=1048576);assert.equal(meta.exif,undefined)
  await assert.rejects(normalizeBusinessImage(new File(['<svg/>'],'forged.jpg',{type:'image/jpeg'})),/INVALID_IMAGE/)
})
test('ambiguous upload commits are preserved, and no failure removes a possibly committed object',async()=>{
  const calls=[], db={rpc:async(name)=>{calls.push(name);return name==='change_catalogue_photo'?{error:Error('lost response')}:{data:null}},storage:{from:()=>({upload:async()=>({data:{}}),remove:()=>assert.fail('unsafe deletion')})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{photo_id:photo}})})})})}
  await uploadCataloguePhoto(db,{catalogueId:id,actorId:actor,mediaId:photo,image:{data:Buffer.from('x'),bytes:1,width:1,height:1},revision:0,rightsReference:'Permission',alt:'Photo'})
  assert.deepEqual(calls,['reserve_catalogue_photo','change_catalogue_photo'])
})
test('cleanup removes only stale unregistered catalogue objects, never current photos or partner keys',async()=>{
  const first=`catalogue/${id}/${photo}.webp`,second=`catalogue/${id}/30000000-0000-4000-8000-000000000003.webp`, removed=[]
  const db={from:table=>({select:()=>table==='catalogue_photo_cleanup'?{lte:()=>({order:()=>({limit:async()=>({data:[{object_key:first},{object_key:second}]})})})}:{in:async()=>({data:[{object_key:first}]})},delete:()=>({in:async()=>({data:null})})}),storage:{from:()=>({remove:async keys=>{removed.push(...keys);return {data:{}}}})}}
  assert.deepEqual(await cleanupCataloguePhotos(db),{removed:1});assert.deepEqual(removed,[second])
  const bad={...db,from:()=>({select:()=>({lte:()=>({order:()=>({limit:async()=>({data:[{object_key:'foreign-partner/photo.webp'}]})})})})})}
  await assert.rejects(cleanupCataloguePhotos(bad),/INVALID_CATALOGUE_MEDIA_KEY/)
})
test('search reads photo metadata only for the current page and preserves catalogue search during storage outages',async()=>{
  let ids
  const deps={config:discoveryConfig({DISCOVERY_ENABLED:'true'}),readInternal:async()=>[],readCatalogue:async()=>SOFIA_CATALOGUE,readCataloguePhotos:async value=>{ids=value;throw Error('offline')},log:()=>{},claimBudget:()=>assert.fail('paid call')}
  const response=await discoverBusinesses({query:'груминг',locale:'bg',cityCode:'68134',radiusKm:2},deps)
  assert.equal(response.externalStatus,'catalogue');assert.ok(response.results.length);assert.deepEqual(ids,response.results.map(row=>row.id));assert.ok(ids.length<=15)
})
test('admin UI is separate, compact, consent-protected and uses the existing browser compressor',async()=>{
  const source=await readFile(new URL('../components/admin-catalogue.js',import.meta.url),'utf8')
  assert.match(source,/<PhotoPicker.*single/);assert.match(source,/rightsReference/);assert.match(source,/useUnsavedChanges/);assert.match(source,/\.showModal\(\)/);assert.match(source,/onCancel/)
  assert.doesNotMatch(source,/service_role|GOOGLE_|getSupabaseAdmin|\.storage\./)
  const route=await readFile(new URL('../app/api/admin/catalogue/[id]/photo/route.js',import.meta.url),'utf8');assert.match(route,/await context.params/)
})
