import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { homeCategories } from '../lib/discovery/home.mjs'
import { categoryArtSource } from '../lib/category-art.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from '../lib/partner-service-photos.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { discoveryServicePhotoIdentity, partnerServicePhotoIdentity, staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from './discovery-photo-fingerprint.mjs'
import coverManifest from '../docs/business-activity-cover-sources-2026-11-15.json' with { type:'json' }
import legacyCovers from '../docs/business-cover-photo-sources.json' with { type:'json' }
import serviceSources from '../docs/service-photo-generation-2026-11-12.json' with { type:'json' }
import detailedServiceSources from '../docs/specific-service-photo-generation-2026-11-12.json' with { type:'json' }
import homeSources from '../docs/homepage-category-photos-2026-11-04.json' with { type:'json' }
import refinedHomeSources from '../docs/category-photo-refinement-20261122.json' with { type:'json' }
import replacements from '../docs/discovery-photo-replacements-20261124.json' with { type:'json' }

const by = (a,b)=>a<b ? -1:a>b ? 1:0
const diskPublic = fileURLToPath(new URL('../public/',import.meta.url))
const photoAlias = file=>file?.replace(/^public/u,'')

function collectServiceChoices(service,business,{partner=false}={}) {
  const initial=serviceThumbnail(service,{business}), type=initial.source
  const entity=partner ? partnerServicePhotoIdentity(service,business):discoveryServicePhotoIdentity(service,business)
  const candidates=[], unavailableSources=[]
  let photo=initial
  while (photo?.src && photo.photoMatch!=='neutral' && !unavailableSources.includes(photo.src) && candidates.length<5) {
    const path=staticDiscoveryPhotoPath(photo.src)
    if (!path) break
    candidates.push({path,source:photo.source,match:photo.photoMatch})
    unavailableSources.push(photo.src)
    photo=serviceThumbnail(service,{business,unavailableSources})
  }
  return {entity,kind:partner?'partner-service':'service',label:service.name,businessId:business.id,
    ...(service.id?{serviceId:service.id}:{}), candidates,initial:staticDiscoveryPhotoPath(initial.src),initialSource:type}
}

export function discoveryPhotoInventory({now=Date.now(),records=PUBLIC_CATALOGUE,selectService=null,selectCover=null,baseline=false}={}) {
  const navigations=[], rows=[], covers=[], references=[]
  const add=(path,entity,kind,usage)=>{
    const clean=staticDiscoveryPhotoPath(path)
    if (clean&&entity) references.push({path:clean,entity,kind,usage})
  }
  for (const item of homeCategories('bg')) {
    const entity='category:'+item.id
    const paths=[item.photo,item.photo2x,item.photoLarge,categoryArtSource(item.id,true),categoryArtSource(item.id)].filter(Boolean)
    navigations.push({entity,paths})
    paths.forEach(path=>add(path,entity,'category','primary-or-responsive'))
  }
  const prior = new Map(replacements.assets.map(asset=>[asset.id,asset.before]))
  for (const choice of DISCOVERY_SUBCATEGORIES) {
    const entity='subcategory:'+choice.id
    const path=(baseline&&prior.get(choice.id)) || choice.photo
    navigations.push({entity,paths:[path]})
    add(path,entity,'subcategory','primary')
  }
  for (const record of records) {
    const business=approvedCatalogueRecord(record,now)
    if (!business) continue
    const details=catalogueDetailsWithServicePhotos(business,now)
    for (const service of details.services) {
      const row=collectServiceChoices(service,business)
      const selected=selectService?.(service,business)
      if (selectService) row.publicPhoto=staticDiscoveryPhotoPath(selected?.src)
      rows.push(row)
      if (selectService) add(row.publicPhoto,row.entity,row.kind,'primary')
      else for (const [index,photo] of row.candidates.entries()) add(photo.path,row.entity,row.kind,index?'legacy-fallback':'primary')
    }
    const coverSelection=selectCover || businessCoverPhoto
    const cover=coverSelection({...business,details})
    covers.push({entity:'business:'+business.id,businessId:business.id,src:cover.src,fallback:cover.fallbackSrc??null,
      activity:cover.activityPhotoKey??null})
    add(cover.src,'business:'+business.id,'business-cover','primary')
    add(cover.fallbackSrc,'business:'+business.id,'business-cover','same-image-derivative')
  }
  // Exact reviewed overrides checked into the repo only. This is not a dump
  // of live partner galleries or provider/DB authentication.
  for (const asset of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const service={id:asset.serviceId,name:asset.name,category:asset.category}
    const business={id:asset.businessId}
    const row=collectServiceChoices(service,business,{partner:true})
    const selected=selectService?.(service,business)
    if (selectService) row.publicPhoto=staticDiscoveryPhotoPath(selected?.src)
    rows.push(row)
    if (selectService) add(row.publicPhoto,row.entity,row.kind,'primary')
    else for (const [index,photo] of row.candidates.entries()) add(photo.path,row.entity,row.kind,index?'legacy-fallback':'primary')
  }
  return {navigations,rows,covers,references}
}

function groupPaths(paths,links) {
  const parent=new Map(paths.map(path=>[path,path]))
  const key=(path)=>{
    let root=parent.get(path)||path
    while (root!==parent.get(root) && parent.has(root)) root=parent.get(root)
    if (parent.has(path)) parent.set(path,root)
    return root
  }
  for (const [a,b] of links) if (parent.has(a)&&parent.has(b)) {
    const left=key(a),right=key(b)
    if (left!==right) parent.set(by(left,right)<0?right:left,by(left,right)<0?left:right)
  }
  return key
}

export async function auditDiscoveryPhotoAssets(inventory,{publicDirectory=diskPublic,near=true}={}) {
  const paths=[...new Set(inventory.references.map(x=>x.path))].sort(by)
  const byPath=new Map(paths.map(path=>[path,new Map()]))
  for (const ref of inventory.references) byPath.get(ref.path).set(ref.entity,ref)
  const physical=[],missing=[]
  for (let i=0;i<paths.length;i+=12) await Promise.all(paths.slice(i,i+12).map(async path=>{
    try {
      physical.push({path,fingerprint:await fingerprintDiscoveryPhoto(await readDiscoveryImage(publicDirectory,path))})
    } catch(error) {missing.push({path,error:error?.code||error?.message||'not readable'})}
  }))
  physical.sort((a,b)=>by(a.path,b.path))
  const verified=Object.fromEntries(physical.map(({path,fingerprint:{signatures,...properties}})=>[path,properties]))
  const exactLinks=[], nearCandidates=[], knownDerivatives=[]
  const sourceLinks=[
    ...coverManifest.assets.map(data=>[photoAlias(data.file),photoAlias(data.approvedServicePhoto)]),
    ...legacyCovers.covers.map(data=>[photoAlias(data.file),photoAlias(data.servicePhoto)]),
  ]
  const originals = new Map()
  for (const source of [...serviceSources.images,...detailedServiceSources.assets,...homeSources.assets,...refinedHomeSources.assets]) {
    const key=source.sourceSha256||source.source
    if (!key) continue
    for (const file of [source.file,source.retinaFile,...(source.files||[]).map(x=>x.file)].map(photoAlias).filter(Boolean)) {
      if (!byPath.has(file)) continue
      if (originals.has(key)&&originals.get(key)!==file) sourceLinks.push([originals.get(key),file])
      else originals.set(key,file)
    }
  }
  for (const [first,second] of sourceLinks) if (byPath.has(first)&&byPath.has(second)) knownDerivatives.push([first,second])
  const families=groupPaths(paths,knownDerivatives)
  for (let i=0;i<physical.length;i++) for (let j=i+1;j<physical.length;j++) {
    const a=physical[i], b=physical[j]
    if (a.fingerprint.sha256===b.fingerprint.sha256 || a.fingerprint.decoded===b.fingerprint.decoded) {
      exactLinks.push([a.path,b.path]); continue
    }
    if (!near || families(a.path)===families(b.path)) continue
    const aa=byPath.get(a.path),bb=byPath.get(b.path)
    if (aa.size===1 && bb.size===1 && aa.has(bb.keys().next().value)) continue // same-entity responsive derivative
    const finding=compareDiscoveryPhotos(a.fingerprint,b.fingerprint)
    if (finding) nearCandidates.push({...finding,paths:[a.path,b.path]})
  }
  const sharedReferenceConflicts=[...byPath].filter(([,refs])=>refs.size>1).map(([path,refs])=>({path,
    roles:[...new Set([...refs.values()].map(ref=>ref.kind))].sort(by), entities:[...refs.keys()].sort(by)}))
  return {verified,missing,exactLinks,knownDerivatives,nearCandidates:nearCandidates.sort((a,b)=>a.spatialError-b.spatialError),sharedReferenceConflicts}
}

export function allocateDiscoveryPhotoOwners(inventory,audit,{confirmed=[],retired=[]}={}) {
  const sources=Object.keys(audit.verified)
  const reserve=groupPaths(sources,[...audit.exactLinks,...audit.knownDerivatives,...confirmed])
  const taken=new Map(), owners=new Map(), labels=new Map()
  const reserveFor = (path,entity)=>{
    const family=reserve(path)
    if (!audit.verified[path]||retired.includes(path) || (taken.has(family)&&taken.get(family)!==entity)) return false
    taken.set(family,entity);owners.set(path,entity);return true
  }
  const conflicts=[]
  const preservedProvided=new Set()
  for (const row of inventory.rows) for (const choice of row.candidates) {
    if (choice.source==='provided' && reserveFor(choice.path,row.entity)) preservedProvided.add(row.entity)
  }
  for (const {entity,paths} of inventory.navigations) for (const path of paths) {
    if (!reserveFor(path,entity)) conflicts.push({path,entity,reason:'navigation source conflicts or is missing'})
  }
  const opportunities=new Map()
  for (const row of inventory.rows) {
    labels.set(row.entity,row.label)
    for (const [rank,choice] of row.candidates.entries()) {
      if (choice.source==='provided') continue // renderer deliberately preserves an already rights-cleared, exact partner image
      if (!audit.verified[choice.path]||retired.includes(choice.path)||taken.has(reserve(choice.path))) continue
      // Curated partner illustrations win their asset if not reserved for a
      // navigation facet. Otherwise prefer the best actual primary match;
      // frequency breaks ties without silently equating different names.
      const weight=(row.kind==='partner-service' ? 100000 : 0)+(rank===0 ? 10:1)+(choice.match==='exact'?3:0)
      const k=JSON.stringify([choice.path,row.entity])
      const event=opportunities.get(k)||{path:choice.path,entity:row.entity,weight:0}
      event.weight+=weight
      opportunities.set(k,event)
    }
  }
  const assetsOwned=new Map(), locked=new Set(preservedProvided)
  const offers=[...opportunities.values()].sort((a,b)=>b.weight-a.weight||by(a.entity,b.entity)||by(a.path,b.path))
  for (const offer of offers) {
    if (locked.has(offer.entity) || !reserveFor(offer.path,offer.entity)) continue
    assetsOwned.set(offer.path,offer.entity);locked.add(offer.entity)
  }
  const coversOwned=new Map()
  for (const cover of inventory.covers) {
    if (!cover.activity || !cover.src || !reserveFor(cover.src,cover.entity)) continue
    coversOwned.set(cover.src,cover.businessId)
    if (cover.fallback && reserveFor(cover.fallback,cover.entity)) coversOwned.set(cover.fallback,cover.businessId)
  }
  return {owners:Object.fromEntries([...assetsOwned].sort(([a],[b])=>by(a,b))),
    coverOwners:Object.fromEntries([...coversOwned].sort(([a],[b])=>by(a,b))),conflicts,
    unassigned:[...labels].filter(([entity])=>!locked.has(entity)).map(([entity,label])=>({entity,label}))}
}

export function discoveryPhotoGenerationQueue(inventory) {
  const names=new Map()
  for (const row of inventory.rows) {
    if (!row.entity) continue
    const item=names.get(row.entity)||{entity:row.entity,kind:row.kind,label:row.label,coveredRows:0,uncoveredRows:0}
    if (row.publicPhoto) item.coveredRows++
    else item.uncoveredRows++
    names.set(row.entity,item)
  }
  const entries=[...names.values()].filter(item=>item.uncoveredRows>0).sort((a,b)=>b.uncoveredRows-a.uncoveredRows||by(a.label,b.label))
  return {
    needsNewScene:entries.filter(item=>!item.coveredRows),
    mixedCoverageNeedsContextReview:entries.filter(item=>item.coveredRows>0),
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url) {
  const {values}=parseArgs({ options:{'as-of':{type:'string'},'no-perceptual':{type:'boolean'},'public':{type:'boolean'},'baseline':{type:'boolean'},allocation:{type:'boolean'},report:{type:'string'},'generation-queue':{type:'string'}} })
  const now=values['as-of']?Date.parse(values['as-of']+'T12:00:00.000Z'):Date.now()
  const presentation=values.public?await import('../lib/discovery-photo-presentation.mjs'):null
  const inventory=discoveryPhotoInventory({now,baseline:values.baseline,...(presentation&&{
    selectService:(service,business)=>presentation.publicServiceThumbnail(service,{business}),
    selectCover: business=>presentation.publicBusinessCoverPhoto(business),
  })})
  if (values['generation-queue']) {
    if (!values.public) throw Error('The queue needs the current public rendering mode')
    await writeFile(values['generation-queue'], JSON.stringify({asOf:new Date(now).toISOString(),
      source:'checked-in catalogue and curated partner services only; no production DB galleries read',
      ...discoveryPhotoGenerationQueue(inventory)})+'\n',{flag:'wx',mode:0o600})
  }
  const audit=await auditDiscoveryPhotoAssets(inventory,{near:!values['no-perceptual']})
  const allocation=allocateDiscoveryPhotoOwners(inventory,audit)
  if (values.allocation) console.log(JSON.stringify(allocation))
  else {
    const recordsBySource=new Map()
    for (const row of inventory.rows) {
      const src=(values.public?row.publicPhoto:row.initial)||'no-photo'
      recordsBySource.set(src,(recordsBySource.get(src)||0)+1)
    }
    const result={scope:'local checked-in public catalogue, taxonomy and curated service overrides; production uploads are not included',asOf:new Date(now).toISOString(),
      inventory,tally:{navigation:inventory.navigations.length, rows:inventory.rows.length,
        selectedServicePhotos:inventory.rows.length-(recordsBySource.get('no-photo')||0),
        distinctServiceIdentities:new Set(inventory.rows.map(r=>r.entity)).size,
        assignedServiceIdentities:Object.keys(allocation.owners).length,assetFiles:Object.keys(audit.verified).length,
        unreadable:audit.missing.length,exactPairs:audit.exactLinks.length,derivativePairs:audit.knownDerivatives.length,
        nearCandidates:audit.nearCandidates.length,sharedReferenceGroups:audit.sharedReferenceConflicts.length},audit,...(!values.public&&{allocation})}
    const output=JSON.stringify(result)
    if (values.report) await writeFile(values.report,output+'\n',{flag:'wx',mode:0o600})
    else console.log(output)
    console.error(JSON.stringify(result.tally))
  }
}
