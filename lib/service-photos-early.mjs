import { businessArtCategory } from './category-art.mjs'
import { normalizeSearchText } from './discovery/categories.mjs'

// Approved frames 16–23 plus the separately requested threading photo.
// Specific procedures win over the original, broader
// rules; a photo of a different technique or body area is not an illustration
// of the named variant.
export const EARLY_SERVICE_PHOTO_IDS = Object.freeze([
  'mens-haircut', 'hair-balayage', 'hair-blowdry', 'nail-extension', 'nail-gel-removal',
  'brow-shaping', 'lash-extensions', 'laser-hair-removal', 'brow-threading', 'barber-brow-threading',
])

const beautyCategories = new Set(['beauty', 'hair', 'barber', 'nails'])
const makeup = /грим|перманент|микроблейд|тату|make.?up|microblad|tattoo/u
const tint = /боядис|оцвет|къна|tint|henna|colour/u
const lamination = /ламинир|лифтинг|laminat|lash lift/u
const browShaping = /^(?:(?:оформяне|почистване|скубане)(?: и (?:оформяне|почистване))?(?: на)? вежд(?:и(?:те)?|а)|вежди(?:те)? с (?:памучен )?(?:конец|пинсета)|(?:eye ?)?brows? (?:shaping|threading|plucking|tweezing)|(?:shaping|threading|plucking|tweezing) (?:of )?(?:the )?(?:eye ?)?brows?)(?=$|[^\p{L}])/u
const thread = /(?:^|[^\p{L}])(?:с (?:памучен )?конец|с конци|threading|(?:with|using) (?:a )?(?:cotton )?thread)(?=$|[^\p{L}])/u
const tweezers = /пинсет|\btweez\w*\b/u
const otherBrowMethod = /восък|кола[ -]маска|шугаринг|захарна паста|лазер|бръсн|бръснач|ножич|\b(?:wax\w*|sugar(?:ing)?|laser|razor|scissors)\b/u
const noBrowMethod = /(?:без|не със?|without|not with)\s+(?:с\s+)?(?:конец|пинсет\p{L}*|(?:cotton )?thread(?:ing)?|tweez\w*)/u
const laserProcedure = /^(?:лазерн[ао]\s+(?:епилация|обезкосмяване)|laser (?:hair removal|epilation))(?=$|[^\p{L}])/u
const picturedLaserArea = /^(?:подбедриц[аи]|долна\s+част\s+(?:на\s+)?крака(?:та)?|(?:цели\s+)?крака|крака\s*[-–—]\s*бедра\s*,\s*подбедрици|(?:both |whole |full |lower )?legs?)$/u

// Retarget only the reviewed simple threading activity, not bundles or other
// methods. Keep the salon frame available and owner-provided photos untouched.
export function contextualBrowThreadingPhoto(photoId, { category, artKind, business, service } = {}) {
  if (photoId !== 'brow-threading') return photoId
  const name = normalizeSearchText(service?.name)
  if ((!browShaping.test(name) && !/^вежди(?:те)?$/u.test(name)) || makeup.test(name) || tint.test(name) || lamination.test(name) ||
    /мигл|подстриг|брада|устн|скул|лице|пакет|комбо|\b(?:lashes|haircut|beard|lips?|cheeks?|face|package|bundle|combo)\b/u.test(name) ||
    otherBrowMethod.test(name) || noBrowMethod.test(name) || tweezers.test(name) ||
    ['pet-care', 'dog-grooming'].includes(artKind) || category === 'pets' || business?.industry === 'pets') return photoId
  const declared = business?.businessCategory ?? business?.category
  const primary = declared || (businessArtCategory(business) === 'barber' ? 'barber' : category)
  return primary === 'barber' ? 'barber-brow-threading' : photoId
}

function representsLowerLegLaser(name) {
  if (!laserProcedure.test(name)) return false
  // Removing only known metadata keeps unrelated named body areas out.
  const details = name.replace(laserProcedure, '').replace(/^\s*(?:soprano titanium|сопрано титаниум)(?=$|[^\p{L}])/u, '')
    .split(/\s*[·:]\s*/u).map(part => part.trim().replace(/^[-–—]\s*|^(?:на|for)\s+/u, '').trim())
    .filter(part => part && !/^(?:(?:за\s+)?(?:жени|мъже)|(?:wo)?men|female|male)$/u.test(part))
  return details.length === 0 || (details.length === 1 && picturedLaserArea.test(details[0]))
}

function browShapingPhoto(name, { category, business, service }) {
  if (!browShaping.test(name) || makeup.test(name) || tint.test(name) || lamination.test(name) ||
    /мигл|подстриг|брада|устн|скул|лице|пакет|комбо|\b(?:lashes|haircut|beard|lips?|cheeks?|face|package|bundle|combo)\b/u.test(name)) return null

  // Explicitly named methods always win. Category-based photos for unnamed
  // methods are illustrative only; they do not change the service description.
  const businessCategory = business?.businessCategory ?? business?.category
  const inferredCategory = beautyCategories.has(businessCategory) ? businessCategory : businessArtCategory(business)
  const salon = beautyCategories.has(businessCategory) || beautyCategories.has(category) || beautyCategories.has(inferredCategory)
  if (!salon) return null
  const methodText = `${name} ${normalizeSearchText(service?.description)}`
  if (otherBrowMethod.test(methodText) || noBrowMethod.test(methodText)) return null
  const threaded = thread.test(methodText), plucked = tweezers.test(methodText)
  if (threaded && plucked) return null
  if (threaded) return contextualBrowThreadingPhoto('brow-threading', { category, business, service: { ...service, name } })
  if (plucked) return 'brow-shaping'
  const primary = beautyCategories.has(businessCategory) ? businessCategory :
    (category === 'barber' || inferredCategory === 'barber') ? 'barber' : category
  return primary === 'barber' ? contextualBrowThreadingPhoto('brow-threading', { category, business, service: { ...service, name } }) : 'brow-shaping'
}

export function earlyServicePhotoKind(name, { category, artKind, business, service } = {}) {
  if (!name || ['pet-care', 'dog-grooming'].includes(artKind) || category === 'pets' || business?.industry === 'pets') return null
  const salon = beautyCategories.has(category) || business?.industry === 'beauty'
  const hairCut = /подстриг|haircut|hair cut|(?:^|[^\p{L}])фейд|\bfade\b/u
  const mens = /мъжк|за мъже|\bmen(?:'s|s)?\b|\bmale\b|(?:^|[^\p{L}])фейд|\bfade\b/u
  if (hairCut.test(name) && mens.test(name) && !/детск|деца|баща и син|child|kid|брада|брадата|beard|вежд|brow|боядис|colour|къдрен|бръсн|shav|един номер|1\s*номер|buzz cut|дамск|женск|\bwomen|\bladies|ножиц|scissors/u.test(name)) return 'mens-haircut'

  if (/(?:^|[^\p{L}])(?:балеаж|balayage)(?!\p{L})/u.test(name) && !/корен|roots?|кичур|highlights|(?:^|[^\p{L}])омбре|ombre|подстриг|haircut|тонер|toner|пакет|package/u.test(name)) return 'hair-balayage'
  if ((salon || /коса|hair/u.test(name)) && /сешоар|blow[ -]?dr(?:y|ying)|оформяне с четка/u.test(name) &&
    !/без\s+(?:сешоар|оформяне с четка)|without (?:a )?blow|подстриг|haircut|боядис|colou?r|балеаж|balayage|кичур|highlights|фолио|foil|екстенш|extension|маша|преса|curling|straighten|плитк|braid|лечение|терапия|ламинир|laminat|кератин|keratin|ампул|тонир|матиран|toner|гланц|gloss|essentials|regenerate|refilling/u.test(name)) return 'hair-blowdry'

  const gelPolish = /гел[ -]*лак|шеллак|shellac|gel[ -]*polish/u
  const nailExtension = /ноктопласт|изграждане\s+(?:на\s+)?(?:един\s+)?нок[ът]|изграждане\s+с\s+гел|nail extensions?|gel extensions?/u
  const removal = /свалян|отстраняван|remov/u
  if ((salon || gelPolish.test(name)) && gelPolish.test(name) && removal.test(name) && !/без\s+свалян|without removal|(?:и|\+)\s*(?:нов|маникюр|педикюр|гел)|ноктопласт|педикюр|pedicure|крака|стъпал|toenails?|\bfeet\b|направа|лакиране/u.test(name) &&
    !/(?:^|[^\p{L}])маникюр(?!\p{L})|\bmanicure\b/u.test(name)) return 'nail-gel-removal'
  if ((salon || nailExtension.test(name)) && nailExtension.test(name) &&
    !/свалян|remov|отстраня|поддръж|refill|корекц|укреп|естествен|natural nail overlay|счуп|repair|възстанов|педикюр|pedicure|медицин/u.test(name)) return 'nail-extension'

  const browPhoto = browShapingPhoto(name, { category, business, service })
  if (browPhoto) return browPhoto
  if (/(?:поставян|удължаван|изграждане).*мигл|мигл[аи].*(?:косъм|обем|\d\s*d)|lash extensions?|eyelash extensions?/u.test(name) &&
    !makeup.test(name) && !tint.test(name) && !lamination.test(name) &&
    !/поддръж|refill|remov|свалян|вежд|brow|лента|strip lashes|долен|долни|\blower\b/u.test(name)) return 'lash-extensions'

  if (representsLowerLegLaser(name)) return 'laser-hair-removal'
  return null
}
