// Provider-neutral, local parsing/matching only: no requests, autocomplete,
// fallback city centres or independently verified venue/entrance claims.
import { BULGARIAN_CITIES, NEIGHBOURHOODS, findCity, normalizeLocationQuery } from './business-location.mjs'
import { sofiaSettlementPointConflict } from './sofia-settlement-boundaries.mjs'
import { noPublicVisit } from './sofia-location-scope.mjs'

export const SOFIA_ADDRESS_LOOKUP_VERSION = 2
export const SOFIA_CITY_CODE = '68134'
// Country + locality and address components are required independently; this
// bounding box only rejects impossible/swapped points and preferences requests.
export const SOFIA_ADDRESS_LOOKUP_BOX = Object.freeze({ west: 23.1, north: 42.9, east: 23.65, south: 42.45 })

const clean = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu,' ') : ''
const key = value => normalizeLocationQuery(clean(value))
const cityKey = value => key(value).replace(/^(?:gr|grad|city)\s+/u,'')
const quarterKey = value => key(value).replace(/^(?:kv|kvartal|zh k|zhk|neighbourhood|neighborhood)\s+/u,'')
const roadKey = value => key(value).replace(/^(?:ul|ulitsa|street|str|bul|bulevard|boulevard)\s+/u,'')
  .replace(/\bprof\b/gu,'profesor').replace(/\bakad\b/gu,'akademik').replace(/\bgen\b/gu,'general').replace(/\bd r\b/gu,'doktor')
  .replace(/\s/gu,'')
// Cyrillic and Latin letters remain distinct. Their visual resemblance is
// only an audit hint, not proof that two postal buildings are equivalent.
export const preciseHouseKey = value => clean(value).toLocaleLowerCase('bg').replace(/\s/gu,'')
const roadPrefix = /^(ул(?:ица)?|бул(?:евард)?|ulitsa|street|str|boulevard|bulevard|ul|bul)(?:\.\s*|\s+)/iu
const roadMarker = /(?:^|[,\s])(ул(?:ица)?|бул(?:евард)?|ulitsa|street|str|boulevard|bulevard|ul|bul)(?:\.\s*|\s+)/iu
const roadType = value => /^(?:бул|bul)/iu.test(value || '') ? 'boulevard' : value ? 'street' : null
const allowedUnit = /^(?:ет(?:аж)?|вх(?:од)?|офис|магазин|партер|floor|entrance|office|shop|unit|ground floor)(?:\.\s*|\s+|$)[\p{L}\p{N}.\s-]*$/iu
const cityAliases = city => new Set([cityKey(city.name),cityKey(city.nameEn)])
const privateText = value => typeof value !== 'string' || value.length > 300
  || /[\u0000-\u001f\u007f@<>]|https?:|www\./iu.test(value)
  || /(?:^|[^\p{L}])(?:телефон|тел\.?|phone|email|e-mail|имейл|егн|лнч|iban|апартамент|ап\.|apartment|p\.?\s*o\.?\s*box|пощенска\s+кутия|п\.\s*к\.)(?:[^\p{L}]|$)/iu.test(value)
  || /\+?\d[\d\s().-]{6,}\d/u.test(value)

function prefixQuarter(prefix, city, selected) {
  const aliases=cityAliases(city), known=(NEIGHBOURHOODS[city.code]||[]).map(value=>({value,k:quarterKey(value)}))
  if(selected&&!known.some(row=>row.k===quarterKey(selected)))known.push({value:selected,k:quarterKey(selected)})
  let result=selected
  for(const part of prefix.split(',').map(clean).filter(Boolean)) {
    const value=cityKey(part), q=quarterKey(part)
    if(aliases.has(value)||['bulgariya','bulgaria'].includes(value))continue
    const match=known.find(row=>row.k===q||[...aliases].some(c=>value===`${c} ${row.k}`||value===`${c} kv ${row.k}`||value===`${c} zh k ${row.k}`))
    if(!match || selected&&match.k!==quarterKey(selected))return null
    result=result||match.value
  }
  return result
}

export function registrationAddressQuery(business) {
  if (noPublicVisit(business)) return null
  const city=findCity(business?.city_ekatte)
  const address=business?.address, selected=clean(business?.neighborhood||'')
  if(!city||privateText(address)||privateText(business?.neighborhood||'')||selected.length>120)return null
  if(business.city!=null&&(!clean(business.city)||!cityAliases(city).has(cityKey(business.city))))return null
  if(/\d\s*[-–—/]\s*\d|\d\s*\.\s*\d/u.test(address))return null
  const text=clean(address)
  const marker=roadMarker.exec(text)
  const streetType=roadType(marker?.[1])
  let body=text, neighborhood=selected
  if(marker) {
    const prefix=text.slice(0,marker.index).replace(/[,\s]+$/u,'')
    neighborhood=prefixQuarter(prefix,city,selected)
    if(neighborhood===null)return null
    body=text.slice(marker.index+marker[0].length)
  } else {
    const parts=text.split(',').map(clean).filter(Boolean)
    while(parts.length>1) {
      const inferred=prefixQuarter(parts[0],city,neighborhood)
      if(inferred===null)break
      neighborhood=inferred;parts.shift()
    }
    body=parts.join(', ')
  }
  const parts=body.split(',').map(clean).filter(Boolean)
  body=parts.shift() || ''
  let unitSpecified=false
  // Validate trailing locality too: a city after the road is not noise. A
  // building/unit modifier stays in the original address and is not sent to
  // the public provider (nor treated as proof of an exact entrance).
  for (const suffix of parts) {
    if (allowedUnit.test(suffix)) { unitSpecified=true; continue }
    const inferred=prefixQuarter(suffix,city,neighborhood)
    if (inferred===null) return null
    neighborhood=inferred
  }
  const match=/^(.+?)[\s„“"']*(?:(?:№|No\.?)\s*)?(\d{1,4}(?:\s*[а-яa-z])?)\s*$/iu.exec(body)
  if(!match)return null
  const street=clean(match[1]).replace(/^[„“"']+|[„“"']+$/gu,'').trim(), house=clean(match[2]).replace(/\s+/gu,'')
  if(!/\p{L}/u.test(street)||!/^[\p{L}\p{N}\s.'’„“"()–—-]+$/u.test(street)||street.length>160
    || /^(?:бл(?:ок)?|ж\.?\s*к\.?|кв(?:артал)?|номер|вход|етаж|block|building|complex|floor)(?=\s|\.|$)/iu.test(street)
    || !/^[1-9]\d{0,3}[а-яa-z]?$/iu.test(preciseHouseKey(house))
    || /^No\.?$/iu.test(street)||cityAliases(city).has(cityKey(street))||quarterKey(street)===quarterKey(neighborhood)&&Boolean(neighborhood))return null
  const road=[streetType==='boulevard'?'бул.':streetType==='street'?'ул.':null,street,house].filter(Boolean).join(' ')
  return {street,streetType,house,city:city.name,unitSpecified,query:[road,neighborhood,city.name,'България'].filter(Boolean).join(', ')}
}

function numeric(value) {
  if(typeof value==='number')return Number.isFinite(value)?value:null
  if(typeof value!=='string'||!/^[-+]?\d+(?:\.\d+)?$/u.test(value.trim()))return null
  const result=Number(value);return Number.isFinite(result)?result:null
}
const regionKey = value => key(value).replace(/^(?:oblast|obl|province)\s+/u,'').replace(/\s+(?:oblast|province)$/u,'')
function regionMatches(city, address) {
  const duplicate=BULGARIAN_CITIES.filter(row=>cityKey(row.name)===cityKey(city.name)).length>1
  if(!duplicate)return true
  const state=clean(address.state||address.state_district||'')
  return Boolean(state&&regionKey(state)===regionKey(city.region))
}
function quarterMatches(business, address) {
  const selected=quarterKey(business.neighborhood||'')
  if(!selected)return true
  const known=(NEIGHBOURHOODS[business.city_ekatte]||[]).map(quarterKey)
  // Administrative city_district labels are intentionally not neighbourhoods.
  // Only contradict two known neighbourhood labels; finer/local POI labels do
  // not override the exact street/house or get mistaken for city districts.
  const reported=[address.quarter,address.neighbourhood,address.neighborhood,address.suburb].filter(value=>typeof value==='string').map(quarterKey)
  return !known.includes(selected)||!reported.some(value=>known.includes(value)&&value!==selected)
}
const generic = new Set(['road','highway','suburb','city','county','state','village','town','neighbourhood','neighborhood','quarter','postcode','administrative','interpolation','houses'])
const SofiaRegion = new Set(['sofia city','sofiya city','sofiya grad','sofia grad','grad sofiya','grad sofia','sofiya stolitsa','sofia capital','stolichna obshtina'])
const pointWithinSofiaPreference = ({latitude,longitude}) => latitude>=SOFIA_ADDRESS_LOOKUP_BOX.south && latitude<=SOFIA_ADDRESS_LOOKUP_BOX.north
  && longitude>=SOFIA_ADDRESS_LOOKUP_BOX.west && longitude<=SOFIA_ADDRESS_LOOKUP_BOX.east

function matchingLocality(city, address) {
  const aliases=cityAliases(city)
  const reported=[address.city,address.town,address.village,address.hamlet].filter(Boolean)
  if (!(address.city || address.town) || !reported.every(value=>aliases.has(cityKey(value)))) return false
  if (city.code===SOFIA_CITY_CODE) {
    const region=regionKey(address.state||address.state_district||'')
    // The named city and province are different. When supplied, reject an
    // incompatible province rather than accepting a city-like search label.
    if (region && !SofiaRegion.has(region)) return false
  }
  return regionMatches(city,address)
}

function candidatePoint(business, requested, candidate) {
  if(!candidate||typeof candidate!=='object'||!['node','way','relation'].includes(candidate.osm_type))return null
  const osmId=typeof candidate.osm_id==='number'&&Number.isSafeInteger(candidate.osm_id)?String(candidate.osm_id):candidate.osm_id
  if(typeof osmId!=='string'||!/^[1-9]\d{0,18}$/u.test(osmId))return null
  const a=candidate.address,city=findCity(business.city_ekatte)
  if(!a||typeof a!=='object'||a.country_code!=='bg'||!matchingLocality(city,a)||!quarterMatches(business,a))return null
  const road=a.road||a.pedestrian||''
  if(roadKey(road)!==roadKey(requested.street)||preciseHouseKey(a.house_number)!==preciseHouseKey(requested.house)
    ||requested.streetType&&roadType(roadPrefix.exec(clean(road))?.[1])!==requested.streetType) return null
  const category=clean(candidate.category||candidate.class).toLowerCase(), type=clean(candidate.type).toLowerCase(), addressType=clean(candidate.addresstype).toLowerCase()
  if(generic.has(type)||generic.has(addressType)||candidate.extratags?.['addr:interpolation']
    || candidate.osm_type==='way'&&category==='place'&&type==='house')return null
  // An unrelated shop at an otherwise correct postal address is not an
  // independently verified match. The automatic path accepts address objects
  // only; named business points need separate branch review.
  if(!['building','house','residential','commercial'].includes(addressType)
    ||(category&&!['building','place'].includes(category)))return null
  for(const value of [candidate.place_rank,candidate.rank_address])if(value!=null){const rank=numeric(value);if(!Number.isInteger(rank)||rank<28||rank>30)return null}
  const latitude=numeric(candidate.lat),longitude=numeric(candidate.lon)
  if(latitude===null||longitude===null||latitude<41||latitude>44.5||longitude<22||longitude>29
    ||city.code===SOFIA_CITY_CODE&&(!pointWithinSofiaPreference({latitude,longitude})
      ||sofiaSettlementPointConflict({latitude,longitude})))return null
  if(!Array.isArray(candidate.boundingbox)||candidate.boundingbox.length!==4)return null
  const box=candidate.boundingbox.map(numeric)
  if(box.some(value=>value===null)||box[0]>box[1]||box[2]>box[3]||box[1]-box[0]>.0012||box[3]-box[2]>.0016
    ||latitude<box[0]-.0000001||latitude>box[1]+.0000001||longitude<box[2]-.0000001||longitude>box[3]+.0000001)return null
  return {latitude,longitude,source_url:`https://www.openstreetmap.org/${candidate.osm_type}/${osmId}`,licence:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}
}

export function matchRegistrationAddress(business, candidates) {
  const requested=registrationAddressQuery(business)
  if(!requested||requested.unitSpecified||!Array.isArray(candidates)||candidates.length>20)return null
  const matches=candidates.map(candidate=>candidatePoint(business,requested,candidate)).filter(Boolean)
  if(!matches.length)return null
  const first=matches[0]
  // Do not choose an entrance just because it ranked above another one.
  // Equivalent duplicates of the same source can be discarded, not conflicts.
  if(matches.some(point=>point.source_url!==first.source_url||point.latitude!==first.latitude||point.longitude!==first.longitude))return null
  return first
}

export function validCachedRegistrationAddressPoint(result) {
  return Boolean(result && typeof result.latitude==='number' && Number.isFinite(result.latitude)
    && typeof result.longitude==='number' && Number.isFinite(result.longitude)
    && pointWithinSofiaPreference(result)
    && !sofiaSettlementPointConflict(result)
    && typeof result.source_url==='string' && /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d{0,19}$/u.test(result.source_url)
    && result.licence==='ODbL-1.0' && result.attribution==='© OpenStreetMap contributors')
}
