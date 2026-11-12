// Provider-neutral, local parsing/matching only: no requests, autocomplete,
// fallback city centres or independently verified venue/entrance claims.
import { BULGARIAN_CITIES, NEIGHBOURHOODS, findCity, normalizeLocationQuery } from './business-location.mjs'

const clean = value => typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu,' ') : ''
const key = value => normalizeLocationQuery(clean(value))
const cityKey = value => key(value).replace(/^(?:gr|grad|city)\s+/u,'')
const quarterKey = value => key(value).replace(/^(?:kv|kvartal|zh k|zhk|neighbourhood|neighborhood)\s+/u,'')
const roadKey = value => key(value).replace(/^(?:ul|ulitsa|street|str|bul|bulevard|boulevard)\s+/u,'')
  .replace(/\bprof\b/gu,'profesor').replace(/\bakad\b/gu,'akademik').replace(/\bgen\b/gu,'general').replace(/\bd r\b/gu,'doktor')
  .replace(/\s/gu,'')
// Only A/А is unambiguous; B can mean Bulgarian Б or the look-alike В.
const houseKey = value => clean(value).toLocaleLowerCase('bg').replace(/a/gu,'а').replace(/\s/gu,'')
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
  const city=findCity(business?.city_ekatte)
  const address=business?.address, selected=clean(business?.neighborhood||'')
  if(!city||privateText(address)||privateText(business?.neighborhood||'')||selected.length>120)return null
  if(business.city!=null&&(!clean(business.city)||!cityAliases(city).has(cityKey(business.city))))return null
  if(/\d\s*[-–—/]\s*\d|\d\s*\.\s*\d/u.test(address))return null
  const text=clean(address)
  const marker=/(?:^|[,\s])(?:ул(?:ица)?|бул(?:евард)?|ulitsa|street|str|boulevard|bulevard|ul|bul)(?:\.\s*|\s+)/iu.exec(text)
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
  body=body.split(',')[0].trim()
  // NFKC normalizes the Bulgarian № sign to "No".
  const match=/^(.+?)[\s„“"']*(?:(?:№|No\.?)\s*)?(\d{1,4}(?:\s*[а-яa-z])?)\s*$/iu.exec(body)
  if(!match)return null
  const street=clean(match[1]).replace(/^[„“"']+|[„“"']+$/gu,'').trim(), house=clean(match[2]).replace(/\s+/gu,'')
  if(!/\p{L}/u.test(street)||!/^[\p{L}\p{N}\s.'’„“"()–—-]+$/u.test(street)||street.length>160
    || /^(?:бл(?:ок)?|ж\.?\s*к\.?|кв(?:артал)?|номер|вход|етаж|block|building|complex|floor)(?=\s|\.|$)/iu.test(street)
    || !/^[1-9]\d{0,3}[а-яa-z]?$/iu.test(houseKey(house))
    || /^No\.?$/iu.test(street)||cityAliases(city).has(cityKey(street))||quarterKey(street)===quarterKey(neighborhood)&&Boolean(neighborhood))return null
  return {street,house,city:city.name,query:[`${street} ${house}`,neighborhood,city.name,'България'].filter(Boolean).join(', ')}
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
const poiClasses = new Set(['building','amenity','shop','office','craft','leisure','tourism','healthcare'])
function candidatePoint(business, requested, candidate) {
  if(!candidate||typeof candidate!=='object'||!['node','way','relation'].includes(candidate.osm_type))return null
  const osmId=typeof candidate.osm_id==='number'&&Number.isSafeInteger(candidate.osm_id)?String(candidate.osm_id):candidate.osm_id
  if(typeof osmId!=='string'||!/^[1-9]\d{0,18}$/u.test(osmId))return null
  const a=candidate.address,city=findCity(business.city_ekatte)
  if(!a||typeof a!=='object'||a.country_code!=='bg'||!cityAliases(city).has(cityKey(a.town||a.city||''))
    ||!regionMatches(city,a)||!quarterMatches(business,a)
    ||roadKey(a.road||a.pedestrian||'')!==roadKey(requested.street)||houseKey(a.house_number)!==houseKey(requested.house))return null
  const category=clean(candidate.category||candidate.class).toLowerCase(), type=clean(candidate.type).toLowerCase(), addressType=clean(candidate.addresstype).toLowerCase()
  if(generic.has(type)||generic.has(addressType)||candidate.extratags?.['addr:interpolation']
    || candidate.osm_type==='way'&&category==='place'&&type==='house')return null
  if(!['building','house','residential','commercial'].includes(addressType)&&!poiClasses.has(category))return null
  for(const value of [candidate.place_rank,candidate.rank_address])if(value!=null){const rank=numeric(value);if(!Number.isInteger(rank)||rank<28||rank>30)return null}
  const latitude=numeric(candidate.lat),longitude=numeric(candidate.lon)
  if(latitude===null||longitude===null||latitude<41||latitude>44.5||longitude<22||longitude>29)return null
  if(!Array.isArray(candidate.boundingbox)||candidate.boundingbox.length!==4)return null
  const box=candidate.boundingbox.map(numeric)
  if(box.some(value=>value===null)||box[0]>box[1]||box[2]>box[3]||box[1]-box[0]>.003||box[3]-box[2]>.003
    ||latitude<box[0]-.0000001||latitude>box[1]+.0000001||longitude<box[2]-.0000001||longitude>box[3]+.0000001)return null
  return {latitude,longitude,source_url:`https://www.openstreetmap.org/${candidate.osm_type}/${osmId}`,licence:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}
}

export function matchRegistrationAddress(business, candidates) {
  const requested=registrationAddressQuery(business)
  if(!requested||!Array.isArray(candidates)||candidates.length>20)return null
  const matches=candidates.map(candidate=>candidatePoint(business,requested,candidate)).filter(Boolean)
  if(!matches.length)return null
  const first=matches[0]
  // Adjacent entrance/building points can describe the same address; conflicting
  // far-apart exact-address hits require review instead of picking a top result.
  if(matches.some(point=>Math.abs(point.latitude-first.latitude)>.0003||Math.abs(point.longitude-first.longitude)>.0004))return null
  return first
}
