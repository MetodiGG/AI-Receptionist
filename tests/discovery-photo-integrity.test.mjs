import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fingerprintDiscoveryPhoto, compareDiscoveryPhotos } from '../scripts/discovery-photo-fingerprint.mjs'
import { discoveryPhotoInventory, auditDiscoveryPhotoAssets, discoveryPhotoGenerationQueue } from '../scripts/audit-discovery-photo-integrity.mjs'
import { publicServiceThumbnail, publicBusinessCoverPhoto } from '../lib/discovery-photo-presentation.mjs'
import { discoveryServicePhotoIdentity, staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'
import { SUBCATEGORY_REPLACEMENTS } from '../lib/discovery/subcategory-illustrations.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from '../lib/partner-service-photos.mjs'
import manifest from '../docs/discovery-photo-replacements-20261124.json' with { type:'json' }
import assignments from '../lib/discovery-photo-ownership.json' with { type:'json' }

const sha = input => createHash('sha256').update(input).digest('hex')
const asset = path => readFile(new URL('../public'+path, import.meta.url))
const asOf = Date.parse('2026-11-24T12:00:00Z')

test('the same local source behind a responsive query and Next optimizer resolves to the same photo; no external/unsafe path', () => {
  const src='/service-photos/kids-haircut-v1.webp'
  assert.equal(staticDiscoveryPhotoPath(src+'?w=320#image'),src)
  assert.equal(staticDiscoveryPhotoPath('/_next/image?url='+encodeURIComponent(src)+'&w=640&q=80'),src)
  for (const value of ['https://gorez.co'+src,'//gorez.co'+src,'/service-photos/../logo.webp','/service-photos/%2e%2e/logo.webp','/api/business-media/id','/_next/image?url=https%3A%2F%2Felsewhere.test%2Fimg.webp']) {
    assert.equal(staticDiscoveryPhotoPath(value),null,value)
  }
})

test('source matching recognizes a different container, a resized flipped rendition and a tinted crop; distinct work stays distinct', async () => {
  const input=await asset('/service-photos/kids-haircut-v1.webp')
  const png=await sharp(input).png().toBuffer()
  const flip=await sharp(input).flop().resize(140,140).jpeg({quality:72}).toBuffer()
  const crop=await sharp(input).extract({left:25,top:25,width:206,height:206}).modulate({brightness:1.12,saturation:.72}).jpeg({quality:80}).toBuffer()
  const unrelated=await asset('/service-photos/go-subcategory-health-rehabilitation-v1.webp')
  const [base,same,reflected,tinted,different]=await Promise.all([input,png,flip,crop,unrelated].map(fingerprintDiscoveryPhoto))
  assert.equal(compareDiscoveryPhotos(base,same).kind,'identical-decoded')
  const reflectedReport=compareDiscoveryPhotos(base,reflected),croppedReport=compareDiscoveryPhotos(base,tinted)
  assert.equal(reflectedReport?.kind,'visual-review-candidate')
  assert.equal(reflectedReport?.flip,true)
  assert.equal(croppedReport?.kind,'visual-review-candidate')
  assert.ok(croppedReport?.crops.some(name=>name!=='full'))
  assert.equal(compareDiscoveryPhotos(base,different),null)
})

test('one reviewed activity source is consistent across contexts/locales, never used for a separate service or as a stock retry', () => {
  const service={ name:'Педикюр с гел лак',category:'nails' }, original='/service-photos/gel-pedicure-v1.webp'
  const similar={name:'Педикюр · нанасяне на гел лак',category:'nails'}
  assert.equal(discoveryServicePhotoIdentity({...service,name:'  ПЕДИКЮР  С ГЕЛ ЛАК  '}),discoveryServicePhotoIdentity(service))
  assert.notEqual(discoveryServicePhotoIdentity(service),discoveryServicePhotoIdentity(similar))
  for (const locale of ['bg','en']) {
    const src=publicServiceThumbnail(service,{business:{id:'x',category:'nails'},locale})
    assert.equal(src.src,original); assert.equal(src.source,'illustrative')
    assert.equal(publicServiceThumbnail(similar,{locale}).src,null)
    assert.equal(publicServiceThumbnail(service,{locale,unavailableSources:[original]}).src,null)
  }
  const child={name:'Детско подстригване',category:'hair',illustrativePhotoKey:'kids-haircut'}
  assert.notEqual(publicServiceThumbnail(child).src,'/service-photos/kids-haircut-v1.webp','the haircut photo belongs to the navigation facet')
  assert.equal(publicBusinessCoverPhoto({id:'unrelated',category:'beauty',illustrativeCoverPhotoKey:'makeup'}).src,null)
  assert.equal(publicBusinessCoverPhoto({id:'unknown',category:'barber'}).src,null)
})

test('the rights-checked genuine photo remains exact and unlabelled as AI; another branch does not acquire it', () => {
  const row=REVIEWED_PARTNER_SERVICE_PHOTOS.find(a=>a.photoId==='partner-megan-supplied')
  const service={id:row.serviceId,name:row.name,category:row.category}
  const legitimate=publicServiceThumbnail(service,{business:{id:row.businessId}})
  assert.equal(legitimate.source,'provided')
  assert.equal(legitimate.src,'/service-photos/partner-megan-supplied-v1.webp')
  assert.doesNotMatch(legitimate.alt,/AI|Примерна|Illustrative/u)
  assert.notEqual(publicServiceThumbnail(service,{business:{id:'different-branch'}}).src,legitimate.src)
  assert.equal(Object.hasOwn(assignments.owners,legitimate.src),false)
})

test('the reported cards receive four distinct illustrations bound to their branch and exact service', async () => {
  const scenes=[]
  for (const [id,name,cover,thumbSrc,old] of [
    ['sofia-nosia-todor-alexandrov17','Български народни танци · група за начинаещи','/business-cover-photos/go-nosia-todor-alexandrov-20261125-v1.webp','/service-photos/go-nosia-folk-dance-beginners-20261125-v1.webp','sx-bulgarian-folk-group'],
    ['sofia-latin-force-centre','Индивидуален урок по танци','/business-cover-photos/go-latin-force-centre-20261125-v1.webp','/service-photos/go-latin-force-individual-dance-20261125-v1.webp','dance-lesson'],
  ]) {
    const service={name,category:'fitness',illustrativePhotoKey:old}
    const row={id,source:'catalogue',businessCategory:'fitness',services:[service],illustrativeCoverPhotoKey:old}
    const art=publicBusinessCoverPhoto(row)
    assert.equal(art.src,cover)
    assert.equal(publicBusinessCoverPhoto(row,{unavailableSources:[cover]}).src,null)
    assert.notEqual(publicBusinessCoverPhoto({...row,id:'another-branch'}).src,cover)
    const thumb=publicServiceThumbnail(service,{business:row})
    assert.equal(thumb.src,thumbSrc)
    assert.equal(thumb.source,'illustrative')
    assert.notEqual(publicServiceThumbnail(service,{business:{...row,id:'other-branch'}}).src,thumbSrc)
    assert.notEqual(publicServiceThumbnail({...service,name:'Непозната дейност'},{business:row}).src,thumbSrc)
    assert.notEqual(publicServiceThumbnail(service,{business:row,unavailableSources:[thumbSrc]}).src,thumbSrc)
    const [coverImage,thumbImage,oldImage]=await Promise.all([cover,thumbSrc,`/service-photos/${old}-v1.webp`]
      .map(async path=>fingerprintDiscoveryPhoto(await asset(path))))
    assert.deepEqual([coverImage.width,coverImage.height],[720,540])
    assert.deepEqual([thumbImage.width,thumbImage.height],[320,320])
    assert.equal(compareDiscoveryPhotos(coverImage,oldImage),null)
    assert.equal(compareDiscoveryPhotos(thumbImage,oldImage),null)
    scenes.push(coverImage,thumbImage)
  }
  for (let i=0;i<scenes.length;i++) for (let j=i+1;j<scenes.length;j++) {
    assert.equal(compareDiscoveryPhotos(scenes[i],scenes[j]),null)
  }
  assert.equal(publicBusinessCoverPhoto({id:'unknown',source:'catalogue',category:'fitness',
    services:[{name:'Непозната дейност'}]}).src,null)
})

test('new subcategory assets are independently labelled, source-reviewed and not resized copies of the old image', async () => {
  assert.equal(new Set(DISCOVERY_SUBCATEGORIES.map(row=>row.photo)).size,DISCOVERY_SUBCATEGORIES.length)
  assert.equal(manifest.assets.length,5)
  for (const replacement of manifest.assets) {
    const row=DISCOVERY_SUBCATEGORIES.find(a=>a.id===replacement.id)
    assert.equal(row.photo,SUBCATEGORY_REPLACEMENTS[replacement.id])
    assert.equal(row.generatedPhoto,true)
    assert.equal(row.photo,replacement.after)
    const [old,next]=await Promise.all([asset(replacement.before),asset(replacement.after)])
    assert.equal(sha(next),replacement.sha256)
    const fingerprint=await fingerprintDiscoveryPhoto(next)
    assert.deepEqual([fingerprint.width,fingerprint.height,fingerprint.format],[400,400,'webp'])
    assert.ok(next.byteLength<50000)
    assert.equal(compareDiscoveryPhotos(await fingerprintDiscoveryPhoto(old),fingerprint),null)
    assert.equal(Object.hasOwn(assignments.owners,row.photo),false)
  }
})

test('serving inventory cannot attach any local physical family to distinct entities and records unresolved artwork rather than borrowing', {timeout:45000}, async () => {
  const rows=discoveryPhotoInventory({now:asOf,selectService:(service,business)=>publicServiceThumbnail(service,{business}),selectCover:publicBusinessCoverPhoto})
  const report=await auditDiscoveryPhotoAssets(rows,{near:false})
  assert.equal(report.missing.length,0)
  assert.equal(report.sharedReferenceConflicts.length,0)
  const owner=new Map(rows.references.map(a=>[a.path,a.entity]))
  for (const [a,b] of [...report.exactLinks,...report.knownDerivatives]) assert.equal(owner.get(a),owner.get(b),a+' and '+b)
  const queue=discoveryPhotoGenerationQueue(rows)
  assert.ok(queue.needsNewScene.length>4000,'remaining unassigned labels stay explicit')
  assert.ok(queue.needsNewScene.every(item=>item.coveredRows===0 && item.uncoveredRows>0))
})
