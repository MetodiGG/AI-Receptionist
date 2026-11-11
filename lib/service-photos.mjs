import { normalizeSearchText } from './discovery/categories.mjs'
import { EARLY_SERVICE_PHOTO_IDS, earlyServicePhotoKind } from './service-photos-early.mjs'
import { MID_SERVICE_PHOTO_IDS, midServicePhotoKind } from './service-photos-mid.mjs'
import { LATE_SERVICE_PHOTO_IDS, lateServicePhotoKind } from './service-photos-late.mjs'
import { SERVICE_PHOTO_46_TO_60_IDS, approvedServicePhoto46To60 } from './service-photos-46-60.mjs'
import { SERVICE_PHOTO_61_TO_75_IDS, approvedServicePhoto61To75 } from './service-photos-61-75.mjs'
import { SERVICE_PHOTO_76_TO_94_IDS, approvedServicePhoto76To94 } from './service-photos-76-94.mjs'
import { SERVICE_PHOTO_95_TO_113_IDS, approvedServicePhoto95To113 } from './service-photos-95-113.mjs'
import { SERVICE_PHOTO_114_TO_130_IDS, approvedServicePhoto114To130 } from './service-photos-114-130.mjs'
import { SERVICE_PHOTO_131_TO_146_IDS, approvedServicePhoto131To146 } from './service-photos-131-146.mjs'

const DOG_HAIRCUT = /подстригване.*куч|куч.*подстригване|dog (?:haircut|hair cut|coat trim)|(?:haircut|hair cut).*dog/u

// Only reviewed photos belong in this manifest. Each match describes the
// activity pictured, not the business's category or the name of its salon.
const APPROVED = Object.freeze([
  ['womens-haircut', /(?:дамск|женск)\p{L}*[\s–—-]+подстриг|women'?s? (?:haircut|hair cut)|ladies'? (?:haircut|hair cut)/u, 'haircut'],
  ['gel-manicure', /маникюр.*(?:гел[ -]*лак|шеллак)|(?:гел[ -]*лак|шеллак).*маникюр|gel (?:polish )?manicure|manicure.*gel polish/u, 'manicure'],
  ['gel-pedicure', /педикюр.*(?:гел[ -]*лак|шеллак)|(?:гел[ -]*лак|шеллак).*педикюр|gel (?:polish )?pedicure|pedicure.*gel polish/u, 'pedicure'],
  ['facial-cleansing', /почистване\s+(?:на\s+)?лице|facial cleans(?:ing|e)|deep cleans(?:ing|e) facial/u, 'beauty'],
  ['beard-trim', /(?:оформяне|подстригване)\s+(?:на\s+)?брад|beard trim|beard shap/u, 'beard-trim'],
  ['tyre-change', /(?:смяна|монтаж|демонтаж|баланс(?:иране)?)\s+(?:на\s+)?(?:автомобилни\s+)?гуми|(?:смяна|монтаж|демонтаж)\s+(?:и\s+)?баланс|(?:tyre|tire|wheel) (?:change|balanc|mount)/u, 'auto-repair'],
  ['touchless-car-wash', /безконтактно.*(?:измив|миене)|(?:измив|миене).*безконтактно|(?:touchless|contactless) (?:exterior |car )?wash/u, 'car-wash'],
  ['reformer-pilates', /(?:пилатес|заняти[ея]|тренировк[аи]).*реформ[ъе]р|реформ[ъе]р.*пилатес|reformer pilates|pilates.*reformer/u, 'fitness'],
  ['piano-lesson', /(?:уро[кц]|обучение|курс).*пиано|пиано.*(?:уро[кц]|обучение|курс)|piano (?:lesson|tuition|class)/u, 'education'],
  ['dog-haircut', DOG_HAIRCUT, 'dog-grooming'],
  ['sofa-cleaning', /пране.*(?:диван|канапе)|(?:диван|канапе).*пране|(?:sofa|couch).*(?:clean|wash)/u, 'home-services'],
  ['physiotherapy', /индивидуал\p{L}*\s+кинезитерап|кинезитерап\p{L}*\s+индивидуал|(?:individual|one.to.one) (?:physical therapy|physiotherapy|kinesiotherapy)/u, 'health'],
  ['accounting-consultation', /счетовод\p{L}*(?:\s+и\s+данъч\p{L}*)?\s+консултац|консултац.*счетовод|(?:accounting|accountant) consultation/u, 'consulting'],
  ['machine-car-polishing', /машинно\s+полиране|полиране\s+с\s+машина|machine polish|(?:едно|дву|три)стъпково\s+полиране|полиране\s+на\s+(?:лек\s+)?автомобил/u, 'detailing'],
  ['lab-tests', /лаборатор\p{L}*\s+изследван|кръвни\s+изследван|изследван\p{L}*\s+на\s+кръв|вземане\s+на\s+кръв|(?:blood|laboratory|lab) (?:test|work)/u, 'other'],
])

const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])

export function approvedServicePhotoKind(service, business, category, artKind) {
  const name = normalizeSearchText(service?.name)
  if (!name) return null
  const context = { category, artKind, business, service }
  const input = { name, context, category, artKind }
  const specific = approvedServicePhoto131To146(input) || approvedServicePhoto114To130(input) ||
    approvedServicePhoto95To113(input) || approvedServicePhoto76To94(input) ||
    approvedServicePhoto46To60(input) || approvedServicePhoto61To75(input) ||
    earlyServicePhotoKind(name, context) || midServicePhotoKind(name, context) || lateServicePhotoKind(name, context)
  if (specific) return specific
  if (artKind === 'pet-care' || artKind === 'dog-grooming') {
    return DOG_HAIRCUT.test(name) && !/(?:котк|котеш|\bcat\b|къпане|\bbath\b)/u.test(name) ? 'dog-haircut' : null
  }
  // A montage or an image of just the other half would mislabel these bundles.
  if (artKind === 'nails' || (/подстриг|haircut/u.test(name) && /брада|брадата|beard|детск|kids|children/u.test(name))) return null
  const picturedActivity = name.replace(/без\s+(?:свалян\p{L}*|отстраняван\p{L}*)|without\s+removal/gu, '')
  if (/свалян|отстраня|removal|ноктопласт|(?:медицински|\bmed\b) педикюр|medical pedicure|терапевтичен педикюр|без (?:гел|лак)|without (?:gel|polish)/u.test(picturedActivity)) return null
  for (const [id, pattern, expectedArt] of APPROVED) {
    if (id === 'dog-haircut' || !pattern.test(name)) continue
    if (id === 'tyre-change' || id === 'touchless-car-wash' || id === 'machine-car-polishing') {
      if (!AUTO.has(category) && business?.industry !== 'auto' && !/автомобил|(?:\bcar\b|\bvehicle\b)|(?:смяна|монтаж|баланс)\s+(?:на\s+)?гуми/u.test(name)) continue
      if (id === 'machine-car-polishing' && /фар|headlight|стъкло|glass|джант|wheel/u.test(name)) continue
    }
    if (id === 'facial-cleansing' && /пилинг|peel|лазер|laser|конец|thread|ултразвук|ultrasound/u.test(name)) continue
    if (id === 'beard-trim' && /бръснене|shav|подстригване на глава/u.test(name)) continue
    if (id === 'piano-lesson' && /флейт|китар|цигул|барабан|пеене|солфеж|flute|guitar|violin|drums|singing|solfege/u.test(name)) continue
    if (id === 'lab-tests' && /ветеринар|куч|котк|veterinar|генетич|genetic|днк|\bdna\b|\bnifty\b|урина|urine|хранител|вода|food|water/u.test(name)) continue
    if (expectedArt === 'haircut' && artKind !== 'haircut') continue
    return id
  }
  return null
}

export const APPROVED_SERVICE_PHOTO_IDS = Object.freeze([
  ...APPROVED.map(([id]) => id), ...EARLY_SERVICE_PHOTO_IDS, ...MID_SERVICE_PHOTO_IDS, ...LATE_SERVICE_PHOTO_IDS,
  ...SERVICE_PHOTO_46_TO_60_IDS, ...SERVICE_PHOTO_61_TO_75_IDS, ...SERVICE_PHOTO_76_TO_94_IDS,
  ...SERVICE_PHOTO_95_TO_113_IDS, ...SERVICE_PHOTO_114_TO_130_IDS, ...SERVICE_PHOTO_131_TO_146_IDS,
])
