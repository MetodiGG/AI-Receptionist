// Pure, offline municipal address comparison. The dataset is supplied by the
// maintenance caller; never load the large source into a customer/API bundle.
// An official postal point is not proof of a business or its actual entrance.
import { distanceKm } from './distance.mjs'

export const OFFICIAL_SOFIA_CLOSE_METERS = 75
const text = value => typeof value === 'string' ? value.normalize('NFKC').toLocaleLowerCase('bg').replace(/[„“”"«»]/gu, '').replace(/[–—]/gu, '-').replace(/\s+/gu, ' ').trim() : ''
const words = value => text(value).replace(/\./gu, ' ').replace(/\s+/gu, ' ').trim()
const sofia = value => words(value).replace(/^(?:гр|град)\s+/u, '') === 'софия'
const pointInSofia = point => Boolean(point && Number.isFinite(point.latitude) && point.latitude >= 42.45 && point.latitude <= 42.9 && Number.isFinite(point.longitude) && point.longitude >= 23.1 && point.longitude <= 23.65)
const houseKey = value => {
  const key = text(value).replace(/a/gu, 'а').replace(/\s+/gu, '')
  return /^\d+[а-яa-z]?$/u.test(key) ? key : null
}
const entranceKey = value => {
  const key = text(value).replace(/a/gu, 'а').replace(/\s+/gu, '')
  return /^(?:\d+|[а-яa-z])$/u.test(key) ? key : null
}
const quarterKey = value => words(value).replace(/^(?:ж\s*к|жилищен комплекс|кв|квартал)\s+/u, '').trim()
const streetStart = /^(улица\s+|ул\.\s*|ул\s+|булевард\s+|бул\.\s*|бул\s+|площад\s+|пл\.\s*|пл\s+)/iu
const streetType = { ул: 'улица', улица: 'улица', бул: 'булевард', булевард: 'булевард', пл: 'площад', площад: 'площад' }
const honorifics = { ген: 'генерал', проф: 'професор', акад: 'академик', 'д-р': 'доктор', 'д р': 'доктор', св: 'свети', инж: 'инженер', арх: 'архитект', кап: 'капитан', полк: 'полковник', подп: 'подполковник', поручик: 'поручик' }

function roadParts(value, { bare = false } = {}) {
  const source = text(value), prefix = source.match(streetStart)
  if (!prefix && !bare) return null
  let name = (prefix ? source.slice(prefix[0].length) : source).replace(/\./gu, ' ').replace(/\s+/gu, ' ').trim()
  name = name.replace(/(?:^|\s)(д\s+р|д-р|ген|проф|акад|св|инж|арх|кап|полк|подп)(?=\s|$)/gu, (match, term) => `${match.startsWith(' ') ? ' ' : ''}${honorifics[term]}`)
  if (!name || !/[\p{L}]/u.test(name) || /[,;\/]|\d\s*[-/]\s*$/u.test(name)) return null
  const type = prefix ? streetType[words(prefix[1])] : null
  return { type, name, key: type ? `${type}|${name}` : null }
}

export function normalizeOfficialSofiaRoad(value) {
  return roadParts(value)?.key || null
}

function field(properties, name) {
  const value = properties[name]
  if (value !== undefined && typeof value !== 'string') throw new TypeError(`Invalid official address field: ${name}`)
  return value || ''
}

export function indexOfficialSofiaAddresses(collection) {
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features) || collection.crs) throw new TypeError('Expected WGS84 GeoJSON FeatureCollection without a projected CRS')
  const byRoadHouse = new Map(), byBareRoadHouse = new Map(), byBlockQuarter = new Map(), seen = new Set()
  const counts = { total: collection.features.length, sofia: 0, otherSettlement: 0, streetIndexed: 0, blockIndexed: 0 }
  const add = (map, key, candidate) => { const bucket = map.get(key); if (bucket) bucket.push(candidate); else map.set(key, [candidate]) }
  for (const feature of collection.features) {
    const p = feature?.properties, geometry = feature?.geometry
    if (feature?.type !== 'Feature' || !p || typeof p.rn !== 'string' || !/^[1-9]\d*$/u.test(p.rn) || seen.has(p.rn)) throw new TypeError('Official features require unique positive rn identifiers')
    seen.add(p.rn)
    if (typeof p.settlement !== 'string') throw new TypeError('Official settlement must be explicit')
    if (!sofia(p.settlement)) { counts.otherSettlement++; continue }
    const pair = geometry?.coordinates
    if (geometry?.type !== 'Point' || !Array.isArray(pair) || pair.length !== 2 || !pointInSofia({ latitude: pair[1], longitude: pair[0] })) throw new TypeError('Invalid Sofia WGS84 address point')
    const street = field(p, 'street'), house = field(p, 'streetnum'), block = field(p, 'block'), quarter = field(p, 'lareaunit'), entrance = field(p, 'entrance')
    const road = roadParts(street), number = houseKey(house), blockNumber = houseKey(block), quarterName = quarterKey(quarter)
    const candidate = Object.freeze({ rn: p.rn, region: field(p, 'region'), settlement: p.settlement, street, house, block, quarter, entrance,
      coordinates: Object.freeze({ latitude: pair[1], longitude: pair[0] }) })
    counts.sofia++
    if (road && number) { add(byRoadHouse, `${road.key}|${number}`, candidate); add(byBareRoadHouse, `${road.name}|${number}`, candidate); counts.streetIndexed++ }
    if (blockNumber && quarterName) { add(byBlockQuarter, `${quarterName}|${blockNumber}`, candidate); counts.blockIndexed++ }
  }
  // Keep distinct rn rows even when every address field or coordinate agrees.
  // Neither a nearest/first row nor a centroid may resolve duplicate metadata.
  return Object.freeze({ counts: Object.freeze(counts), byRoadHouse, byBareRoadHouse, byBlockQuarter })
}

function parseRoadSegment(segment, bare) {
  const main = segment.replace(/\s+(?=(?:вх\.?|вход|ет\.?|етаж|ап\.?|апартамент|офис|магазин|бл\.?|блок)\s)/iu, ',').split(',')[0].trim()
  if (/\d+\s*[а-яa-z]?\s*[-–—/]\s*\d+\s*[а-яa-z]?\s*$/iu.test(main)) return null
  const match = main.match(/^(.+?)\s*№?\s*(\d+\s*[а-яa-z]?)\s*$/iu)
  if (!match) return null
  const road = roadParts(match[1].trim(), { bare }), house = houseKey(match[2])
  return road && house ? { road: match[1].trim(), roadKey: road.key, roadName: road.name, house, bare: !road.type } : null
}

export function officialSofiaAddressRequest(row) {
  if (!row || (row.locationKind && row.locationKind !== 'premises') || typeof row.address !== 'string') return null
  if ([row.cityCode, row.city_ekatte].some(value => value && value !== '68134')) return null
  const cityCode = row.cityCode || row.city_ekatte
  if (cityCode ? cityCode !== '68134' : !sofia(row.city)) return null
  if (row.city && !sofia(row.city)) return null
  const address = row.address.normalize('NFKC'), parts = address.split(',').map(value => value.trim()).filter(Boolean)
  // A landmark is not the venue's postal address. In particular, a workshop
  // "opposite block 353" must never inherit that residential block's point.
  if (/(?:^|[,\s])(?:срещу|до|зад|пред|между|в близост до)\s+(?:блок|бл\.?|улица|ул\.?|булевард|бул\.?|площад|пл\.?)\s/iu.test(address)) return null
  const citySegment = parts.find(value => /^(?:гр\.|гр\s+|град\s+)/iu.test(value))
  if (citySegment && !sofia(citySegment)) return null
  if (parts.length > 1 && !sofia(parts[0]) && !streetStart.test(parts[0]) &&
    !/^(?:ж\s*\.?\s*к\.?|кв\.?|квартал|бл\.?|блок)\s*/iu.test(parts[0]) && quarterKey(parts[0]) !== quarterKey(row.neighborhood)) return null
  const entrances = [...address.matchAll(/(?:^|[,\s])(?:вход(?:\s*:\s*|\s+|$)|вх\.\s*|вх\s*:\s*|вх(?:\s+|$))/giu)].map(match => {
    const token = address.slice(match.index + match[0].length).match(/^([\p{L}\d]+)(?=\s*(?:[,.;)]|ет\.|етаж|ап\.|офис|$))/iu)?.[1]
    return entranceKey(token)
  })
  if (entrances.some(value => !value) || new Set(entrances).size > 1) return null
  const entrance = entrances[0] || null, streets = parts.filter(value => streetStart.test(value))
  if (streets.length > 1) return null
  if (streets.length === 1) {
    // Do not silently discard an unlabelled trailing locality such as a
    // different city. No guessed city list: an unexplained bare word is held,
    // while normal labelled floors/entrances and named buildings stay intact.
    const unexplainedTail = parts.slice(parts.indexOf(streets[0]) + 1).some(value => /^[\p{L}]+$/u.test(text(value)) &&
      !sofia(value) && text(value) !== 'българия' && quarterKey(value) !== quarterKey(row.neighborhood) &&
      !/^(?:партер|сутерен|мансарда|мазе|НСА|БИНАП)$/iu.test(value))
    if (unexplainedTail) return null
    const road = parseRoadSegment(streets[0], false)
    return road ? { kind: 'street_house', ...road, entrance, sourceAddress: row.address } : null
  }
  const quarter = quarterKey(row.neighborhood)
  const quarterExplicit = Boolean(quarter && parts.some(value => quarterKey(value) === quarter))
  const blocks = [...address.matchAll(/(?:^|[,\s])(?:бл\.?|блок)\s*(\d+\s*[а-яa-z]?)(?=\s*(?:[,.;)]|вх\.?|вход|ет\.?|$))/giu)].map(match => houseKey(match[1]))
  if (blocks.length) {
    return blocks.length === 1 && blocks[0] && quarterExplicit ? { kind: 'block_quarter', block: blocks[0], quarter: row.neighborhood, quarterKey: quarter, entrance, sourceAddress: row.address } : null
  }
  // A bare road is permitted only for a native venue with separately known
  // Sofia and quarter, both explicitly present in this three-part address.
  if (row.source !== 'gorez' || parts.length !== 3 || !sofia(parts[0]) || !quarterExplicit || quarterKey(parts[1]) !== quarter) return null
  const road = parseRoadSegment(parts[2], true)
  return road && road.bare ? { kind: 'street_house', ...road, entrance, sourceAddress: row.address } : null
}

export function matchOfficialSofiaAddress(index, row) {
  if (!(index?.byRoadHouse instanceof Map) || !(index.byBareRoadHouse instanceof Map) || !(index.byBlockQuarter instanceof Map)) throw new TypeError('Expected an official Sofia address index')
  const request = officialSofiaAddressRequest(row)
  const result = { id: typeof row?.id === 'string' ? row.id : null, sourceAddress: typeof row?.address === 'string' ? row.address : null,
    request, candidates: [], unique: null, status: 'unresolved', reason: 'explicit_exact_address_required', separationMeters: null, corroboration: 'not_compared',
    automaticReplacement: false, semantics: 'official_postal_address_point_not_verified_business_or_entrance' }
  if (!request) return result
  const bucket = request.kind === 'block_quarter' ? index.byBlockQuarter.get(`${request.quarterKey}|${request.block}`)
    : request.bare ? index.byBareRoadHouse.get(`${request.roadName}|${request.house}`) : index.byRoadHouse.get(`${request.roadKey}|${request.house}`)
  result.candidates = (bucket || []).filter(candidate => !request.entrance || entranceKey(candidate.entrance) === request.entrance)
  if (!result.candidates.length) return { ...result, reason: 'no_exact_address_candidate' }
  if (result.candidates.length !== 1) return { ...result, status: 'ambiguous', reason: 'multiple_exact_address_candidates' }
  result.unique = result.candidates[0]
  result.status = 'unique'; result.reason = 'one_exact_address_candidate'
  const distance = pointInSofia(row.coordinates) ? distanceKm(row.coordinates, result.unique.coordinates) : null
  result.separationMeters = distance === null ? null : distance * 1000
  if (result.separationMeters !== null) result.corroboration = result.separationMeters <= OFFICIAL_SOFIA_CLOSE_METERS ? 'within_75m' : 'more_than_75m'
  return result
}
