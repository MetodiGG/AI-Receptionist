import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { normalizeBusinessImage } from '../lib/image-normalization.mjs'
import { businessContentSchema, parseContentUpdate, createContentHandler } from '../lib/business-content.mjs'
import { createMediaHandlers, createMediaImageHandler, boundedBytes } from '../lib/media-handlers.mjs'
import { getBusinessPhotos, getStaffPhoto, getCuratedBusinessPhoto } from '../lib/business-photos.mjs'
import { readApplicationPhotos, prepareApplicationPhotos } from '../lib/application-photos.mjs'
import { createBusinessApplicationHandler } from '../lib/business-application.mjs'
import { cleanupBusinessMedia } from '../lib/media-cleanup.mjs'

const bid='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',mid='30000000-0000-4000-8000-000000000001'
const user={id:'20000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-10-30T00:00:00Z',email:'owner@example.com'}
const url='https://example.com/api',read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')
const business={name:'Offline business',slug:'offline-business',phone:'',contact_email:'',address:'Test 1',city_ekatte:'68134',neighborhood:'',industry:'other',timezone:'Europe/Sofia',website_url:'',privacy_contact_email:'',booking_terms:'',default_duration_min:10,booking_slot_minutes:15,booking_window_days:60,minimum_notice_minutes:0,cancellation_notice_hours:12,email_notifications_enabled:true,notification_locale:'bg',review_requests_enabled:true,public_profile:{},welcome_message:'',bot_instructions:''}
const patch=body=>new Request(url,{method:'PATCH',headers:{'content-type':'application/json',origin:'https://example.com'},body:JSON.stringify(body)})

test('admin content schema validates exact minutes and canonical cities, rejecting privilege/owner changes',()=>{
  const parsed=businessContentSchema.parse(business)
  assert.equal(parsed.city,'София');assert.equal(parsed.default_duration_min,10)
  for(const extra of [{owner_id:other},{platform_status:'enabled'},{active:true},{plan:'paid'},{content_revision:0}])assert.throws(()=>businessContentSchema.parse({...business,...extra}))
  for(const website_url of ['javascript:alert(1)','data:image/png;base64,AA','https://user:secret@example.com'])assert.throws(()=>businessContentSchema.parse({...business,website_url}))
  assert.throws(()=>businessContentSchema.parse({...business,city_ekatte:'12345'}))
  assert.throws(()=>parseContentUpdate({revision:1,section:'services',reason:'Local QA',payload:[{id:mid,name:'Hair',description:'',category:'',duration_min:10,price:20,active:true,sort_order:0},{id:mid,name:'Hair',description:'',category:'',duration_min:10,price:20,active:true,sort_order:0}]}))
})
test('content mutations require verified admin, same origin, valid revision/body and quota before saving',async()=>{
  let saved=0
  const deps={authenticate:async()=>user,isAdmin:()=>true,allowAttempt:async()=>true,save:async input=>{saved++;assert.equal(input.actorId,user.id);assert.equal(input.payload.city,'София')}}
  const input={revision:1,section:'business',payload:business,reason:'Owner requested correction'}
  for(const override of [{authenticate:async()=>null},{authenticate:async()=>({...user,is_anonymous:true})},{authenticate:async()=>({...user,email_confirmed_at:null})},{isAdmin:()=>false},{allowAttempt:async()=>false}])assert.ok((await createContentHandler({...deps,...override})(patch(input),bid)).status>=400)
  assert.equal(saved,0)
  const cross=new Request(url,{method:'PATCH',headers:{origin:'https://bad.example','content-type':'application/json'},body:JSON.stringify(input)})
  assert.equal((await createContentHandler(deps)(cross,bid)).status,403)
  assert.equal((await createContentHandler(deps)(patch({...input,actorId:other}),bid)).status,422)
  const result=await createContentHandler(deps)(patch(input),bid)
  assert.equal(result.status,200);assert.match(result.headers.get('cache-control'),/no-store/);assert.equal(saved,1)
  const stale=await createContentHandler({...deps,save:async()=>{throw new Error('CONTENT_CHANGED')}})(patch(input),bid)
  assert.equal(stale.status,409)
})
test('image decoding re-encodes WebP, auto-orients and strips metadata; spoofed/oversized formats fail',async()=>{
  const input=await sharp({create:{width:32,height:48,channels:3,background:'#d96222'}}).jpeg().withMetadata({orientation:6}).toBuffer()
  const output=await normalizeBusinessImage(new File([input],'private-name.jpg',{type:'image/jpeg'}))
  const meta=await sharp(output.data).metadata()
  assert.equal(meta.format,'webp');assert.equal(meta.width,48);assert.equal(meta.height,32);assert.equal(meta.exif,undefined);assert.equal(meta.xmp,undefined);assert.equal(meta.orientation,undefined)
  assert.ok(output.bytes<1048576)
  for(const [bytes,type] of [['<svg xmlns="http://www.w3.org/2000/svg"/>','image/png'],['not an image','image/jpeg'],[input,'image/svg+xml']])await assert.rejects(normalizeBusinessImage(new File([bytes],'photo',{type})),/INVALID_IMAGE/)
  await assert.rejects(normalizeBusinessImage({size:5*1024*1024,type:'image/png',arrayBuffer(){throw new Error('must not read')}}),/IMAGE_TOO_LARGE/)
})
test('media routes isolate tenants, reject client privilege fields and require rights consent before uploads',async()=>{
  let writes=0,normalizations=0
  const deps={authenticate:async()=>user,isAdmin:()=>false,readAccess:async()=>({id:bid,owner_id:user.id,content_revision:2}),allowAttempt:async()=>true,list:async()=>({media:[]}),normalize:async()=>{normalizations++;return {data:Buffer.from('test'),width:1,height:1,bytes:4}},upload:async input=>{writes++;assert.equal(input.admin,false);assert.equal(input.actorId,user.id)},mutate:async()=>{writes++}}
  const form=(extra={})=>{const f=new FormData();f.append('file',new File(['bytes'],'p.png',{type:'image/png'}));f.append('revision','2');f.append('consent','true');for(const [k,v] of Object.entries(extra))f.append(k,v);return new Request(url,{method:'POST',headers:{origin:'https://example.com'},body:f})}
  assert.equal((await createMediaHandlers({...deps,authenticate:async()=>null}).POST(form(),bid)).status,401)
  assert.equal((await createMediaHandlers({...deps,readAccess:async()=>({owner_id:other})}).POST(form(),bid)).status,403)
  assert.equal((await createMediaHandlers(deps).POST(form({admin:'true'}),bid)).status,422)
  assert.equal((await createMediaHandlers({...deps,ownsStaff:async()=>false}).POST(form({staffId:other}),bid)).status,403)
  assert.equal((await createMediaHandlers({...deps,readAccess:async()=>({owner_id:user.id,platform_status:'archived'})}).POST(form(),bid)).status,409)
  assert.equal(writes,0);assert.equal(normalizations,0)
  const ok=await createMediaHandlers(deps).POST(form(),bid)
  assert.equal(ok.status,200);assert.equal(writes,1);assert.equal(normalizations,1)
  assert.equal((await createMediaHandlers(deps).PATCH(patch({revision:2,action:'hide',mediaId:mid,actorId:other}),bid)).status,422)
  assert.equal((await createMediaHandlers({...deps,allowAttempt:async()=>false}).GET(new Request(url),bid)).status,429)
})
test('upload body limit is enforced for streamed bodies without Content-Length',async()=>{
  const request=new Request(url,{method:'POST',body:new ReadableStream({start(c){c.enqueue(new Uint8Array(50));c.enqueue(new Uint8Array(51));c.close()}}),duplex:'half'})
  await assert.rejects(boundedBytes(request,100),/IMAGE_TOO_LARGE/)
})
test('private image delivery never downloads bytes for guests of pending/hidden/inactive businesses or staff',async()=>{
  let downloads=0
  const value={media:{active:true,object_key:'private/path.webp',staff_id:null},business:{active:true,platform_status:'enabled',owner_id:user.id},staffActive:true}
  const deps={allowAttempt:async()=>true,read:async()=>value,authenticate:async()=>null,isAdmin:()=>false,download:async()=>{downloads++;return new Blob(['webp'])}}
  const request=new Request(url)
  const publicImage=await createMediaImageHandler(deps)(request,mid)
  assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('content-type'),'image/webp');assert.match(publicImage.headers.get('cache-control'),/no-store/)
  for(const hidden of [{...value,media:{...value.media,active:false}},{...value,business:{...value.business,platform_status:'pending'}},{...value,business:{...value.business,active:false}},{...value,media:{...value.media,staff_id:bid},staffActive:false}]){
    const before=downloads
    assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden})(request,mid)).status,404)
    assert.equal(downloads,before)
    assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden,authenticate:async()=>({...user,id:other})})(request,mid)).status,404)
    assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden,authenticate:async()=>user})(request,mid)).status,200)
    assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden,authenticate:async()=>({...user,id:other}),isAdmin:()=>true})(request,mid)).status,200)
  }
})
test('public gallery uses only active IDs, preserves cover ordering and separates staff portraits from business photos',()=>{
  const rows=[{id:mid,staff_id:null,active:true,sort_order:2,width:100,height:100,alt_text:'Business'},{id:other,staff_id:bid,active:true,sort_order:0,width:100,height:100},{id:bid,staff_id:null,active:false,sort_order:-1,alt_text:'Must stay private'}]
  const value={id:'450c5c2f-db41-476b-a21e-98cf5ee29194',media_gallery_managed:true,media:rows}
  assert.deepEqual(getBusinessPhotos(value).map(row=>row.src),[`/api/business-media/${mid}`])
  assert.equal(getStaffPhoto(value,bid).src,`/api/business-media/${other}`)
  assert.deepEqual(getBusinessPhotos({...value,media:[]}),[])
  assert.equal(getBusinessPhotos({id:value.id}).length,2)
})
test('curated photo delivery applies the same access gate and redirects only to the exact business whitelist',async()=>{
  const id='450c5c2f-db41-476b-a21e-98cf5ee29194',source='/businesses/vesi-studio/interior-20261026.webp'
  const value={media:{active:true,curated_src:source,staff_id:null},business:{id,active:true,platform_status:'enabled',owner_id:user.id},staffActive:true}
  let downloads=0,resolutions=0
  const deps={allowAttempt:async()=>true,read:async()=>value,authenticate:async()=>null,isAdmin:()=>false,download:async()=>{downloads++;return new Blob(['must not use Storage'])},resolveCurated:(bid,src)=>{resolutions++;return getCuratedBusinessPhoto(bid,src)?.src}}
  const request=new Request(url),result=await createMediaImageHandler(deps)(request,mid)
  assert.equal(result.status,307);assert.equal(result.headers.get('location'),source);assert.match(result.headers.get('cache-control'),/no-store/)
  const hidden={...value,media:{...value.media,active:false}},before=resolutions
  assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden})(request,mid)).status,404)
  assert.equal(resolutions,before,'hidden metadata must not resolve for a guest')
  assert.equal((await createMediaImageHandler({...deps,read:async()=>hidden,authenticate:async()=>user})(request,mid)).status,307)
  for(const invalid of [{...value,business:{...value.business,id:bid}},{...value,media:{...value.media,curated_src:'https://example.com/photo.webp'}},{...value,media:{...value.media,curated_src:'/businesses/vesi-studio/../other.webp'}}])assert.equal((await createMediaImageHandler({...deps,read:async()=>invalid})(request,mid)).status,404)
  assert.equal(downloads,0)
})
test('managed gallery appends uploaded photos without losing curated captions/crops or restoring hidden photos',()=>{
  const id='450c5c2f-db41-476b-a21e-98cf5ee29194'
  const first={id:'450c5c2f-db41-476b-a21e-98cf5ee29195',curated_src:'/businesses/vesi-studio/interior-20261026.webp',active:true,sort_order:0,width:1200,height:1600}
  const second={...first,id:'450c5c2f-db41-476b-a21e-98cf5ee29196',curated_src:'/businesses/vesi-studio/entrance-20261026.webp',sort_order:1}
  const uploaded={id:mid,active:true,sort_order:2,width:100,height:100,alt_text:'New photo'}
  const value={id,media_gallery_managed:true,media:[first,second,uploaded]},photos=getBusinessPhotos(value)
  assert.equal(photos.length,3);assert.equal(photos[0].position,'50% 68%');assert.equal(photos[0].caption.en,'Inside the studio');assert.match(photos[1].alt.bg,/входът/)
  assert.equal(photos[2].src,`/api/business-media/${mid}`)
  assert.equal(getBusinessPhotos({...value,media:[{...first,active:false},{...second,active:false},uploaded]}).length,1)
  assert.deepEqual(getBusinessPhotos({...value,id:bid,media:[first,second]}),[])
})
test('application multipart binds portraits by staff position, enforces rights and bounded JSON/files',async()=>{
  const form=new FormData();form.append('payload','{"test":true}');form.append('photoConsent','true');form.append('staff_0',new File(['bytes'],'private.png',{type:'image/png'}))
  const parsed=await readApplicationPhotos(new Request(url,{method:'POST',body:form}))
  assert.equal(parsed.files[0].staffIndex,0)
  const prepared=await prepareApplicationPhotos(parsed.files,1,async()=>({width:1,height:1,bytes:10}))
  assert.equal(prepared[0].staffIndex,0)
  await assert.rejects(prepareApplicationPhotos(parsed.files,0,async()=>({})),/INVALID_IMAGE/)
  form.delete('photoConsent')
  await assert.rejects(readApplicationPhotos(new Request(url,{method:'POST',body:form})),/VALIDATION_ERROR/)
})
test('photo failure after a committed application reports partial success without deleting or duplicating the account',async()=>{
  let accounts=0,deleted=0,saved=0
  const value={business:{name:'Offline photo QA',slug:'offline-photo-qa',phone:'+359888123456',contact_email:'owner@example.com',address:'Test 1',timezone:'Europe/Sofia',industry:'other',city_ekatte:'68134',neighborhood:'',default_duration_min:10,booking_slot_minutes:15},services:[{name:'Hair',price:10,duration_min:10}],staff:[{name:'Alex'}],schedule:Array.from({length:7},(_,i)=>({weekday:i+1,enabled:i<5,open:'09:00',close:'18:00',breakEnabled:false,breakStart:'12:00',breakEnd:'13:00'})),account:{email:'owner@example.com',password:'Offline-test-only-password'},locale:'bg',consent:true,company:''}
  const deps={allowAttempt:async()=>true,authenticate:async()=>null,reserved:()=>false,createAccount:async()=>{accounts++;return {id:user.id}},deleteAccount:async()=>{deleted++},notify:async()=>{},readSubmission:async()=>({value,files:[{file:{},staffIndex:null}]}),prepareImages:async()=>[{image:{},staffIndex:null}],save:async()=>{saved++;return {photosSaved:0}}}
  const response=await createBusinessApplicationHandler(deps)(new Request(url,{method:'POST',headers:{'content-type':'multipart/form-data; boundary=test'},body:'offline fixture'}))
  assert.equal(response.status,201);assert.deepEqual((await response.json()).photos,{requested:1,saved:0})
  assert.equal(accounts,1);assert.equal(saved,1);assert.equal(deleted,0)
})
test('cleanup only removes exact queued unregistered keys and preserves committed/hidden photos',async()=>{
  const gone=`${bid}/${mid}.webp`,kept=`${bid}/${other}.webp`,deletedKeys=[]
  const chain=rows=>({select(){return this},lte(){return this},order(){return this},limit:async()=>({data:rows}),in:async()=>({data:rows})})
  const db={from:table=>table==='business_media'?chain([{object_key:kept}]):{...chain([{object_key:gone},{object_key:kept}]),delete(){return {in:async(_column,keys)=>{deletedKeys.push(...keys);return {error:null}}}}},storage:{from:bucket=>({remove:async keys=>{assert.equal(bucket,'business-media');assert.deepEqual(keys,[gone]);return {error:null}}})}}
  assert.deepEqual(await cleanupBusinessMedia(db),{removed:1});assert.deepEqual(deletedKeys,[gone,kept])
  const failed={...db,storage:{from:()=>({remove:async()=>({error:new Error('storage outage')})})}}
  await assert.rejects(cleanupBusinessMedia(failed),/storage outage/)
  assert.equal(deletedKeys.length,2)
})
test('new UI removes only redundant account/legal notes, keeps policy sections and adds an accessible business CTA',async()=>{
  const account=await read('components/customer-account.js'),legal=await read('components/legal-page.js'),css=await read('app/solar.css')
  assert.doesNotMatch(account,/customer-account-hint|Един акаунт за клиенти/)
  assert.match(account,/<Link className="customer-owner-link"/);assert.match(account,/<Icon name="store"/)
  assert.doesNotMatch(legal,/className="legal-note"/);assert.match(legal,/copy.sections.map/);assert.match(legal,/Google Privacy Policy/)
  assert.match(css,/\.customer-auth \.customer-owner-link strong[^}]*font-size: 17px/)
  assert.match(css,/:root \.language-switch.language-switch-single.compact button/)
})
