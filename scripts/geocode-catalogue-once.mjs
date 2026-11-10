// OWNER-APPROVED ONE-TIME OFFLINE JOB ONLY, 2026-11-06.
// Not an app geocoder, CI job, autocomplete, POI harvest or periodic task.
// https://operations.osmfoundation.org/policies/nominatim/ : one machine/thread,
// <=1 request/sec, identifying UA, durable cache, attribution. No user locations.
import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueStreetAddress, matchCatalogueGeocode } from '../lib/discovery/catalogue-geocoding.mjs'

const {values}=parseArgs({options:{'approved-one-time':{type:'boolean'},cache:{type:'string'},output:{type:'string'},'max-requests':{type:'string',default:'240'},'ids-file':{type:'string'},structured:{type:'boolean'},named:{type:'boolean'},'dry-run':{type:'boolean'}}})
if (!values['approved-one-time'] || !values.cache?.startsWith('/') || !values.output?.startsWith('/')) throw Error('Explicit one-time owner approval and absolute cache/output paths required')
const maximum=Number(values['max-requests'])
if (!Number.isInteger(maximum)||maximum<1||maximum>300) throw Error('Bound this single one-time batch to 1–300 requests')
if ((values.structured||values.named) && (!values['ids-file'] || maximum>25)) throw Error('Targeted follow-up requires an explicit allowlist and at most 25 requests')
if (values.structured&&values.named) throw Error('Choose one address request format')
let selectedIds
if (values['ids-file']) {
  if (!values['ids-file'].startsWith('/')) throw Error('Absolute allowlist path required')
  selectedIds=JSON.parse(await readFile(values['ids-file'],'utf8'))
  if (!Array.isArray(selectedIds)||selectedIds.length<1||selectedIds.length>25||new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>typeof id!=='string'||!SOFIA_CATALOGUE.some(row=>row.id===id))) throw Error('Allowlist must contain 1–25 unique existing catalogue identifiers')
}
let cache={}
try { cache=JSON.parse(await readFile(values.cache,'utf8')) } catch(error) { if(error.code!=='ENOENT')throw error }
const candidates=SOFIA_CATALOGUE.filter(row=>(!selectedIds||selectedIds.includes(row.id))&&catalogueStreetAddress(row))
if (selectedIds && candidates.length!==selectedIds.length) throw Error('Every allowed record needs an unresolved, unambiguous street/house address')
const requestFor = (row,address) => values.structured
  ? {street:`${address.house} ${address.road}`,city:'София',country:'България'}
  : {q:values.named?`${row.name}, ${address.query}`:address.query}
const keyFor = (row,address) => values.structured ? JSON.stringify(requestFor(row,address)) : requestFor(row,address).q
if (values['dry-run']) {
  console.log(JSON.stringify({dryRun:true,maximumRequests:maximum,selected:candidates.map(row=>{const address=catalogueStreetAddress(row);return{id:row.id,address:row.address,request:requestFor(row,address),cached:Object.hasOwn(cache,keyFor(row,address))}})},null,2))
  process.exit(0)
}
const updates=[];let requests=0,lastStart=0
for(const row of candidates) {
  const address=catalogueStreetAddress(row), key=keyFor(row,address)
  if (!Object.hasOwn(cache,key)) {
    if(requests>=maximum)break
    await delay(Math.max(0,1100-(Date.now()-lastStart)))
    const url=new URL('https://nominatim.openstreetmap.org/search')
    for(const [k,v]of Object.entries({...requestFor(row,address),format:'jsonv2',addressdetails:'1',limit:'3',countrycodes:'bg','accept-language':'bg',viewbox:'23.1,42.9,23.65,42.45',bounded:'1'}))url.searchParams.set(k,v)
    lastStart=Date.now();requests++
    const response=await fetch(url,{headers:{'User-Agent':'GoRezCatalogueReview/1.0 (https://www.gorez.co; info@gorez.co)','Accept':'application/json'},signal:AbortSignal.timeout(15000)})
    if(!response.ok)throw Error(`Nominatim HTTP ${response.status}; stopped without retries`)
    const result=await response.json()
    if(!Array.isArray(result))throw Error('Unexpected geocoding response; stopped')
    cache[key]=result
    await writeFile(values.cache,JSON.stringify(cache,null,2)+'\n')
  }
  const update=matchCatalogueGeocode(row,cache[key],'2026-11-06')
  if(update)updates.push(update)
  await writeFile(values.output,JSON.stringify(updates,null,2)+'\n')
  if(requests%20===0)console.log(JSON.stringify({reviewed:requests,accepted:updates.length,remaining:candidates.length-requests}))
}
console.log(JSON.stringify({finished:true,requests,accepted:updates.length,candidates:candidates.length,cache:values.cache,output:values.output}))
