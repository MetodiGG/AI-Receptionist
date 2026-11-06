// OWNER-APPROVED ONE-TIME OFFLINE JOB ONLY, 2026-11-06.
// Not an app geocoder, CI job, autocomplete, POI harvest or periodic task.
// https://operations.osmfoundation.org/policies/nominatim/ : one machine/thread,
// <=1 request/sec, identifying UA, durable cache, attribution. No user locations.
import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueStreetAddress, matchCatalogueGeocode } from '../lib/discovery/catalogue-geocoding.mjs'

const {values}=parseArgs({options:{'approved-one-time':{type:'boolean'},cache:{type:'string'},output:{type:'string'},'max-requests':{type:'string',default:'240'}}})
if (!values['approved-one-time'] || !values.cache?.startsWith('/') || !values.output?.startsWith('/')) throw Error('Explicit one-time owner approval and absolute cache/output paths required')
const maximum=Number(values['max-requests'])
if (!Number.isInteger(maximum)||maximum<1||maximum>300) throw Error('Bound this single one-time batch to 1–300 requests')
let cache={}
try { cache=JSON.parse(await readFile(values.cache,'utf8')) } catch(error) { if(error.code!=='ENOENT')throw error }
const candidates=SOFIA_CATALOGUE.filter(row=>catalogueStreetAddress(row))
const updates=[];let requests=0,lastStart=0
for(const row of candidates) {
  const address=catalogueStreetAddress(row), key=address.query
  if (!Object.hasOwn(cache,key)) {
    if(requests>=maximum)break
    await delay(Math.max(0,1100-(Date.now()-lastStart)))
    const url=new URL('https://nominatim.openstreetmap.org/search')
    for(const [k,v]of Object.entries({q:key,format:'jsonv2',addressdetails:'1',limit:'3',countrycodes:'bg','accept-language':'bg',viewbox:'23.1,42.9,23.65,42.45',bounded:'1'}))url.searchParams.set(k,v)
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
