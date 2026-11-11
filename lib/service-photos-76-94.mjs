import { normalizeSearchText } from './discovery/categories.mjs'

export const SERVICE_PHOTO_76_TO_94_IDS = Object.freeze([
  'laser-face', 'laser-arms', 'laser-underarms', 'laser-torso', 'laser-back',
  'laser-equipment', 'laser-neck', 'laser-thighs', 'haircut-beard-combo', 'head-shave',
  'regular-nail-polish', 'regular-toenail-polish', 'microneedling', 'therapeutic-massage',
  'car-interior-vacuum', 'vehicle-window-tint', 'legal-consultation', 'shockwave-therapy', 'vehicle-dpf-clean',
])

const words = pattern => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${pattern})(?=$|[^\\p{L}\\p{N}])`, 'u')
const LASER_HAIR_REMOVAL = /лазерн[ао]\s+(?:епилац\p{L}*|обезкосм\p{L}*)|(?:епилац\p{L}*|обезкосм\p{L}*)\s+с\s+лазер|\blaser(?:[ -]assisted)?[ -](?:hair[ -]removal|epilation|depilation)\b/u
const LASER_SHORTHAND = /^(?:лазер|laser)\s*[·:–—-]/u
const NON_LASER_COSMETIC_HAIR_REMOVAL = /фотоепилац|интензивна пулсова светлина|иглена епилац|електроепилац|пилонидал|киста|фистул|татуиров|белези|лазертерап|лазерна терап|пилинг|дентал|пигмент|купероза|кола маска|\b(?:ipl|intense pulsed light|electrolysis|shaving|waxing|pilonidal|cyst|fistula|tattoo\w*|resurfac\w*|genesis|carbon peel|pigment\w*|dental|scar\w*)\b/u
const CHILD_SERVICE = /детск|за деца|тинейдж|тийнейдж|\b(?:child(?:ren)?|kids?|teen(?:age\w*)?|minors?)\b/u
const LASER_UNPICTURED = /(?:консултац|обучени|тестов импулс|пробен импулс)|\b(?:consultation|training|test shot|patch test)\b/u

const SENSITIVE = /интим|бикини|ареол|седалищ|перианал|перине|слабини|генитал|\b(?:bikini|brazilian|hollywood|intimate|areol\w*|buttocks?|glutes?|perianal|perine\w*|groin|genital\w*|nipples?)\b/u
const CHEST = words('гърди|гърдите|гръден кош|деколте|chest|bust|décolletage|decolletage|breasts?')
const FULL_BODY = words('цяло тяло|цялото тяло|цялостн[ао] тяло|whole body|full[ -]body')
const SLIP = words('слип')
const NEGATED_ZONE = /(?:без|without|excluding)\s+(?:(?:the|на)\s+)?(?:шия(?:та)?|врат(?:а)?|neck|интим(?:на зона)?|intimate(?: area)?|бикини|bikini(?: area)?)(?=$|[^\p{L}])/gu
const NAMED_MULTI_ZONE = words('[2-9]\\s+(?:зони|zones)|комбинация от зони|multi[ -]zone|multiple zones')

const FACE = words('лице(?:то)?|брадичк[аеи]|челюст(?:та)?|face|chin|jawline|lower jaw')
const OTHER_FACE_AREAS = [
  words('горна устна|upper lip'), words('бакенбард[аи]|sideburns?'), words('скул[аи]|буз[аи]|cheeks?|cheekbones?'),
  words('вежд[аи]|веждите|brows?|eyebrows?'), words('чело(?:то)?|forehead'), words('нос(?:а)?|nose'), words('уш[ие]|ears?'),
]
const ARMS = words('ръце(?:те)?|предмишниц[аеи]|предмишниците|arms?|forearms?')
const OTHER_ARM = /(?:половин(?:[аи])?|1\s*\/\s*2|горна част на)\s+ръце|ръце\s+от\s+лакът\s+до\s+рамо|\b(?:half arms?|upper arms?)\b/u
const HAND_AREA = words('пръст(?:и|ите)?|длан(?:и|ите|та)?|fingers?|palms?|hands?')
const HANDS_WITH_ARM_LOCATOR = /пръст\p{L}* (?:на|от) ръц\p{L}*|\b(?:fingers|palms|hands) of (?:the )?arms?\b/gu
const FEET_WITH_LEG_LOCATOR = /пръст\p{L}* (?:на|от) крак\p{L}*|\btoes of (?:the )?(?:feet|legs?)\b/gu
const FOREARMS = /предмишниц|китка до лакът|\bforearms?\b|wrist to elbow/u
const UNDERARMS = words('(?:под)?мишниц[аеи]|(?:под)?мишниците|underarms?|armpits?|axillae?')
const TORSO = words('корем(?:а|ът)?|abdomen|abdominal area|stomach|belly')
const BELLY_STRIP = /корем(?:на|а)?\s*[–—-]?\s*лент|корем(?:на|а)?\s+линия|\b(?:abdominal|stomach|belly) (?:strip|line)\b|\blinea alba\b/u
const BACK = words('гръб|гърба|лопатки|back|upper back|shoulder blades')
const LOWER_BACK = words('кръст|кръста|lower back|lumbar(?: area)?')
const SHOULDERS = words('рамо|рамене|раменете|shoulders?')
const NECK = words('шия(?:та)?|neck')
const NAPE = words('врат(?:а)?|тил(?:а)?|nape|back of (?:the )?neck')
const PARTIAL_NECK = /половин(?:а)?\s+шия|1\s*\/\s*2\s+шия|\bhalf(?: of)? (?:the )?neck\b/u
const THIGHS = words('бедр(?:о|а|ата)|горна част на краката|thighs?|upper legs?')
const LOWER_LEGS = words('подбедриц[аи]|подбедриците|крак(?:а|ът)?|краката|прасец|прасци|lower legs?|full legs?|legs?|calf|calves')
const FEET_AREA = words('стъпал[оа]|стъпалата|foot|feet|toes?')
const ANOTHER_ZONE = words('глава|скалп|брад[аеи]|челюстна линия|тяло|торс|зона|зони|head|scalp|beard|jaw|body|torso|area|areas|zone|zones')

function laserZonePhoto(name, description) {
  if (CHILD_SERVICE.test(name) || NON_LASER_COSMETIC_HAIR_REMOVAL.test(name) || LASER_UNPICTURED.test(name)) return null
  // A bare "laser" can be many procedures. Accept a shorthand label only
  // when the public description of that same service establishes its use.
  if (!LASER_HAIR_REMOVAL.test(name) && !(LASER_SHORTHAND.test(name) && LASER_HAIR_REMOVAL.test(description) && !NON_LASER_COSMETIC_HAIR_REMOVAL.test(description))) return null

  const area = name.replace(NEGATED_ZONE, '')
  if (SENSITIVE.test(area) || CHEST.test(area) || SLIP.test(area) || FULL_BODY.test(area)) return 'laser-equipment'
  const zones = new Set()
  const add = (test, kind) => { if (test) zones.add(kind) }
  add(FACE.test(area), 'laser-face')
  OTHER_FACE_AREAS.forEach((test, i) => add(test.test(area), `other-face-${i}`))
  const armArea = area.replace(HANDS_WITH_ARM_LOCATOR, '').replace(FEET_WITH_LEG_LOCATOR, '')
  add(ARMS.test(armArea) && (!OTHER_ARM.test(armArea) || FOREARMS.test(armArea)), 'laser-arms')
  add(OTHER_ARM.test(armArea) && !FOREARMS.test(armArea), 'other-arm')
  add(HAND_AREA.test(area.replace(FEET_WITH_LEG_LOCATOR, '')), 'hand')
  add(UNDERARMS.test(area), 'laser-underarms')
  add(TORSO.test(area) && !BELLY_STRIP.test(area), 'laser-torso')
  add(BELLY_STRIP.test(area), 'belly-strip')
  add(BACK.test(area) && !/\blower back\b|\bback of (?:the )?neck\b/u.test(area), 'laser-back')
  add(LOWER_BACK.test(area), 'lower-back')
  add(SHOULDERS.test(area.replace(/shoulder blades|от лакът до рамо|from elbow to shoulder/gu, '')), 'shoulders')
  add(NECK.test(area) && !NAPE.test(area) && !PARTIAL_NECK.test(area), 'laser-neck')
  add(NAPE.test(area) || PARTIAL_NECK.test(area), 'other-neck')
  add(THIGHS.test(area), 'laser-thighs')
  add(LOWER_LEGS.test(area.replace(FEET_WITH_LEG_LOCATOR, '').replace(/горна част на краката|\bupper legs?\b/gu, '')), 'lower-legs')
  add(FEET_AREA.test(area) || area.search(FEET_WITH_LEG_LOCATOR) >= 0, 'feet')
  // Listing upper and lower legs together is the full leg area: retain the
  // already approved representative leg photo, not the upper-leg crop.
  if (zones.size === 2 && zones.has('laser-thighs') && zones.has('lower-legs') && /крака\s*[-–—]|\bfull legs\b/u.test(area)) return null
  if (zones.size > 1 || (NAMED_MULTI_ZONE.test(area) && !(zones.size === 1 && zones.has('laser-face') && /цяло лице.*без шия/u.test(name)))) return 'laser-equipment'
  // A recognized zone with a conjunction and another unpictured area is
  // still a combination. Do not silently show just the matched zone.
  if (zones.size === 1 && /(?:\+|,|\/|\sи\s|\sand\s)/u.test(area) && ANOTHER_ZONE.test(area.replace(/4 зони|lower jaw|abdominal area/gu, ''))) return 'laser-equipment'
  const [zone] = zones
  if (SERVICE_PHOTO_76_TO_94_IDS.slice(0, 8).includes(zone)) return zone
  // For a confirmed procedure on a recognized but unpictured area (e.g.
  // upper lip, nape, fingers), use the approved patient-free equipment shot.
  // This never overrides the existing lower-leg or unzoned representative photo.
  return zone && zone !== 'lower-legs' ? 'laser-equipment' : null
}

const AUTO_CATEGORIES = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const PET_ART = new Set(['pet-care', 'dog-grooming'])
const PET_TERMS = words('куч\\p{L}*|котк\\p{L}*|котеш\\p{L}*|грум\\p{L}*|dogs?|cats?|pets?|groom\\p{L}*')

const BARBER_BUNDLE = /^(?:(?:комбо\s*\(\s*)?(?:мъжко )?подстригване(?: на коса)?(?:\s*[,–—-]\s*комбо с\s*|\s*(?:,|\+|&|и|с)\s+)(?:(?:оформяне|подстригване) (?:на )?)?брада(?: с измиване)?\s*\)?|(?:men['’]s )?hair\s?cut\s*(?:\+|&|and|with)\s*(?:a )?beard (?:trim(?:ming)?|shap(?:e|ing)))$/u
const HEAD_SHAVE = /^(?:(?:гладко |класическо )?бръснене на (?:главата|глава|скалп)(?: с (?:шейвър|електрическ[аи] самобръсначк[аи]))?|(?:electric |foil |bald )?(?:head|scalp) shave|(?:foil )?shaving (?:the )?(?:head|scalp))$/u
const NAIL_EXCLUSIONS = /френск|свалян|отстраня|без лак|без гел|гел[ -]?лак|ноктопласт|градиент|укреп|изграждан|медицин|терапев|детск|парафин|декорац|\b(?:gel|shellac|french|removal|medical|spa|kids|treatment|decoration|acrylic)\b/u
const HAND_POLISH = /^(?:(?:(?:класически|основен) )?маникюр с (?:(?:обикновен|класически|традиционен) )?лак|(?:classic |regular )?manicure with (?:regular |traditional |conventional )?polish|(?:regular|traditional|conventional) polish manicure)$/u
const FOOT_POLISH = /^(?:(?:(?:класически|частичен|основен) )?педикюр с (?:(?:обикновен|класически|традиционен) )?лак|(?:classic |regular )?pedicure with (?:regular |traditional |conventional )?polish|(?:regular|traditional|conventional) polish pedicure)$/u
const MICRONEEDLING = /^(?:микронидлинг(?: на (?:(?:горна част на |долна част на |цяло )?лице))?|дермапен(?: на лице)?|микронидлинг dermapen(?:world)?(?: 4)?|(?:facial )?micro[ -]?needling(?: (?:for|of) (?:the )?face)?|dermapen(?: facial)?)(?:\s*[-–—:]\s*(?:цяло лице|full face))?$/u
const MASSAGE = /^(?:(?:класически |частичен )?(?:лечебен|терапевтичен|физиотерапевтичен) масаж(?: на (?:рамене|гръб))?|(?:therapeutic|physiotherapy) massage(?: (?:for|of) (?:the )?(?:shoulders?|upper back))?)$/u
const VACUUM = /^(?:вътрешно почистване(?: на (?:лек )?автомобил)?|(?:сухо )?почистване с прахосмукачка(?: на (?:салона|купето|автомобила))?|прахосмукачка(?: на (?:салона|купето|автомобила))?|(?:car|vehicle) interior (?:cleaning|vacuum(?:ing)?)|vacuum(?:ing)? (?:the )?(?:car|vehicle) interior)$/u
const WINDOW_TINT = /^(?:(?:затъмняване|тониране|фолиране) на (?:(?:задните|страничните|автомобилните|автомобилни) )?стъкла(?: на (?:лек )?автомобил)?|(?:car |vehicle |automotive )?window tint(?:ing)?|tint(?:ing)? (?:the )?(?:car|vehicle) windows)$/u
const LEGAL = /^(?:(?:присъствена )?правна консултация|адвокатска консултация)(?=$|[^\p{L}])|^(?:(?:in[ -]person )?legal consultation|consultation with (?:a|an) (?:lawyer|attorney))\b/u
const SHOCKWAVE = /^(?:ударно[ -]?вълнова терапия|терапия с ударни вълни|шокуейв(?: терапия)?|(?:радиален и фокусиращ )?шокуейв|(?:radial |focused )?shock[ -]?wave therapy|shock[ -]?wave)(?:\s*[-–—:]\s*(?:рамо|рамене|shoulders?))?$/u
const DPF_CLEAN = /^(?:(?:машинно |професионално )?почистване на (?:(?:dpf|fap)(?:\s*\/\s*(?:dpf|fap))?(?: филтър| филтри)?|филтър за твърди частици)|(?:machine |professional )?(?:dpf|fap|diesel particulate filter) cleaning|cleaning (?:of )?(?:the )?(?:dpf|fap|diesel particulate filter))$/u

export function approvedServicePhoto76To94({ name, context = {}, category = context.category, artKind = context.artKind } = {}) {
  const title = normalizeSearchText(name)
  if (!title || category === 'pets' || context.business?.industry === 'pets' || PET_ART.has(artKind) || PET_TERMS.test(title)) return null
  const description = normalizeSearchText(context.service?.description)
  const photo = laserZonePhoto(title, description)
  if (photo) return photo

  const [core] = title.split(/\s*·\s*/u, 1)
  const auto = AUTO_CATEGORIES.has(category) || context.business?.industry === 'auto' || /автомобил|\b(?:car|vehicle|automotive)\b/u.test(title)

  if (BARBER_BUNDLE.test(core) && !CHILD_SERVICE.test(title) && !/вежд|боядис|бръсн|маск|епилац|brows?|colo[u]?r|shav|mask|wax/u.test(title)) return 'haircut-beard-combo'
  if (HEAD_SHAVE.test(core) && !CHILD_SERVICE.test(title) && !/брада|коса|подстриг|бръснач|мокро|ножч|beard|haircut|razor|\bwet\b/u.test(title)) return 'head-shave'

  if (!NAIL_EXCLUSIONS.test(title)) {
    if (HAND_POLISH.test(core) && !/педикюр|крак|стъпал|pedicure|toes?|feet/u.test(title)) return 'regular-nail-polish'
    if (FOOT_POLISH.test(core) && !/маникюр|ръце|manicure|hands?/u.test(title)) return 'regular-toenail-polish'
  }

  if (MICRONEEDLING.test(core) && !/rf|радиочест|биомикро|био микро|пилинг|peel|скалп|устни|шия|деколте|гръб|scalp|lips?|neck|body|back/u.test(title)) return 'microneedling'
  if ((MASSAGE.test(core) || /^(?:лечебен|терапевтичен) масаж [–—-] една зона$/u.test(core)) &&
    !/цяло тяло|стъпал|ръце|бремен|детск|спортна|рефлекс|у дома|вендуз|лазер|игл|whole body|full body|foot|feet|hand|pregnan|\bkids?\b|sport|reflex|home|cupping|laser|needle/u.test(title)) return 'therapeutic-massage'

  if (auto && VACUUM.test(core) && !/пране|екстрактор|мокро|пар[ао]|озон|кожа|багажник|дезинфек|външно|steam|ozone|leather|trunk|disinfect|exterior|wet|extract/u.test(`${title} ${description}`)) return 'car-interior-vacuum'
  if (auto && WINDOW_TINT.test(core) && !/дом|сград|витрин|челно|предно|свалян|отстраня|премахва|сгъваем|прозрач|house|building|storefront|windscreen|windshield|remov|clear film/u.test(title)) return 'vehicle-window-tint'
  if (LEGAL.test(core) && !/онлайн|видео|телефон|чат|писмен|имейл|дистанцион|online|video|phone|chat|written|e[ -]?mail|remote/u.test(`${title} ${description}`)) return 'legal-consultation'
  if (SHOCKWAVE.test(core) && !/бедр|брич|дупе|корем|прасц|ръце|лакът|колян|пет[аи]|крак|целулит|thigh|glute|belly|calf|elbow|knee|heel|foot|legs?|cellulite/u.test(title)) return 'shockwave-therapy'
  if (DPF_CLEAN.test(core) && !/без демонтаж|на място|химич|регенерац|софтуер|смяна|изключ|премах|without removal|in[ -]situ|chemical|regenerat|replac|delete/u.test(`${title} ${description}`)) return 'vehicle-dpf-clean'

  return null
}
