export const LATE_SERVICE_PHOTO_IDS = Object.freeze([
  'classic-manicure', 'classic-pedicure', 'classic-shave', 'kids-haircut', 'hair-color', 'waxing',
  'makeup', 'brake-service', 'veterinary-exam', 'yoga-class', 'electrical-repair', 'dental-exam',
])

const CLASSIC_NAILS = /^(?:(?:класически|мъжки|дамски|класически мъжки) )?(маникюр|педикюр)(?: (?:без (?:лак|гел(?:[ -]лак)?)|с (?:обикновен |класически )?лак))?$|^(?:(?:classic|traditional|regular|men['’]s|women['’]s) )?(manicure|pedicure)(?: (?:without (?:gel|polish)|with (?:regular |traditional )?polish))?$/u
const CLASSIC_NAIL_EXCLUSIONS = /ноктопласт|апарат|медицин|терапевт|детск|комбо|комбиниран|руска техник|декорац|свалян|отстраня|парафин|счупен|френск|шеллак|укрепва|акрил|(?:^|[^\p{L}])(?:спа|spa|med|gel|medical|therapeutic|kids|removal|acrylic|shellac|french)(?=$|[^\p{L}])/u
const BARE_NAILS = /^(?:маникюр|педикюр|manicure|pedicure)$/u
const SHAVE = /^(?:(?:класическо(?: мокро)?|кралско|мокро|гладко) бръснене(?: на (?:брада|лице))?|бръснене на (?:брада|лице)|classic shave|(?:straight[ -]razor|wet|hot[ -]towel|traditional) shave)$/u
const KIDS_HAIRCUT = /^(?:детско подстригване|подстригване (?:на|за) деца|(?:kids['’]?|children['’]s|child['’]s|child) hair\s?cut)(?=$|[^\p{L}])/u
const ROOT_COLOR = /^(?:(?:(?:farmavita|montibello[–-]keune) )?боядисване(?: с материал на салона)?\s*(?:·\s*)?(?:на\s+)?корен(?:и)?(?=$|[^\p{L}])|(?:hair )?root(?:s)? (?:colou?r(?:ing)?|touch[ -]?up)(?=$|[^\p{L}]))/u
const WAX = /^(?:(?:кола\s*маска|(?:восъчна депилация|депилация с (?:кола\s*маска|восък)))(?:\s*(?:·\s*)?(?:на\s+)?(?:(?:половин|цели)\s+)?крака(?:\s+(?:за\s+)?(?:жени|мъже))?)?|waxing|(?:(?:half|full|lower)[ -])?leg waxing|waxing (?:for |of (?:the )?)?legs)$/u
const MAKEUP = /^(?:(?:(?:професионален|пробен(?: и сватбен)?|вечерен|официален(?:\s*\/\s*вечерен)?|ежедневен|дневен|сватбен|абитуриентски|експресен) )?грим|бюти грим за фотосесия|(?:(?:professional|bridal|day|evening|occasion|trial) )?make[ -]?up)$/u
const BRAKE_PADS = /^(?:смяна (?:на )?(?:(?:предни|задни) )?(?:(?:спирачни )?дискове\s*(?:и|\+)\s*)?(?:спирачни )?накладки(?: (?:предни|задни|\(дискови\)|с електрическа ръчна спирачка))?|(?:(?:car|automotive|front|rear) )?brake (?:discs? and )?pads? (?:replacement|change)|(?:replace|change) (?:car |front |rear )?brake pads?)$/u
const VET_EXAM = /^(?:(?:(?:първичен|повторен|профилактичен|стандартен) )?ветеринарен преглед(?: (?:на|за) куче(?:та)?)?|преглед при ветеринар(?:ен лекар)?|(?:(?:routine|standard|initial|dog) )?(?:vet|veterinary) (?:exam(?:ination)?|check[ -]?up)(?: for dogs?)?)$/u
const YOGA = /^(?:йога(?: клас| практика)?(?: с резервация)?|групов(?:а)? йога(?: практика)?|(?:запазено )?групово заняти[ея] по йога|карта за йога|(?:group )?yoga(?: (?:class|practice|session|pass))?|group class in yoga)$/u
const ELECTRICAL = /^(?:електроуслуги за дома|електрически ремонт(?: (?:на адрес|у дома))?|(?:монтаж|смяна|ремонт|подмяна) на (?:електрически )?(?:ключове и )?(?:контакт(?:и)?|розетк[аи])|(?:изграждане на )?нова електрическа точка|откриване на електрически проблем|посещение, електродиагностика и ремонт до \d+ минути|(?:home|residential) electrical (?:repair|service)|(?:electrical )?(?:outlet|socket) (?:repair|replacement|installation))$/u
const DENTAL_EXAM = /^(?:(?:(?:първичен|профилактичен) )?(?:дентален|стоматологичен) преглед(?: (?:за възрастни|и (?:консултация|диагностика|план за лечение)))?|преглед при зъболекар|(?:(?:routine|initial|preventive|adult) )?dental (?:exam(?:ination)?|check[ -]?up))$/u

const AUTO_CATEGORIES = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const PET_ART = new Set(['pet-care', 'dog-grooming'])

export function lateServicePhotoKind(name, { category, artKind, business } = {}) {
  if (!name) return null
  // Catalogue entries often append a specialist, duration, or age after a
  // middle dot. Keep checking the full wording for conflicting qualifiers.
  const [core] = name.split(/\s*·\s*/u, 1)
  const auto = AUTO_CATEGORIES.has(category) || business?.industry === 'auto'
  const pet = category === 'pets' || business?.industry === 'pets' || PET_ART.has(artKind) ||
    /(?:^|[^\p{L}])(?:куч\p{L}*|кот\p{L}*|грум\p{L}*|pets?|dogs?|cats?|groom\p{L}*)(?=$|[^\p{L}])/u.test(name)

  if (VET_EXAM.test(core) && !/котк|котеш|котарак|заек|гризач|екзотич|птиц|ваксин|у дома|домашн\p{L}* посещен|на адрес|cats?|feline|rabbits?|exotic|vaccin|home visit/u.test(name)) return 'veterinary-exam'
  if (pet) return null

  // Natural filing is part of a standard manicure/pedicure, including a
  // conventional polish service before its polish goes on. Do not infer it
  // from a generic title with a modifier that may specify a different method.
  const nails = CLASSIC_NAILS.exec(core)
  const nailScope = name.replace(/без гел(?:[ -]лак)?|without gel/gu, '')
  if (nails && (!BARE_NAILS.test(core) || name === core) && !CLASSIC_NAIL_EXCLUSIONS.test(nailScope) &&
    !/маникюр.*педикюр|педикюр.*маникюр|manicure.*pedicure|pedicure.*manicure|гел/u.test(nailScope)) {
    return ['маникюр', 'manicure'].includes(nails[1] || nails[2]) ? 'classic-manicure' : 'classic-pedicure'
  }

  if ((SHAVE.test(core) || (core === 'бръснене' && category === 'barber')) &&
    !/глава|скалп|шейвър|машинк|електрич|подстриг|стайлинг|body|head|scalp|clippers?|haircut/u.test(name)) return 'classic-shave'
  if (KIDS_HAIRCUT.test(core) && !/машинк|бръсн|брад|боядис|възрастни|\+|clippers?|shav|beard|colo[u]?r|adult/u.test(name)) return 'kids-haircut'
  if (ROOT_COLOR.test(name) && !/\/|къса коса|цяла коса|цялост|избел|изрус|балеаж|кичур|подстриг|вежд|брад|bleach|balayage|highlight|haircut|brow|beard/u.test(name)) return 'hair-color'
  // The wax photo specifically shows an adult calf and a strip: keep face,
  // arms and other body-zone services distinct even when the method is wax.
  if (!auto && WAX.test(name)) return 'waxing'
  if (MAKEUP.test(core) && !/перманент|тату|микроблейд|свалян|премахван|мигли|специални ефекти|концептуал|детск|(?:^|[^\p{L}])арт(?=$|[^\p{L}])|permanent|tattoo|removal|lashes|special effects|child|sfx/u.test(name)) return 'makeup'

  if (BRAKE_PADS.test(core) && (auto || /\b(?:car|automotive)\b/u.test(name)) && !/барабан|мотоцик|велосипед|bicycl|motorcycl|drum/u.test(name)) return 'brake-service'
  if (YOGA.test(core) && !/индивидуал|частн|детск|деца|младеж|терапев|въздуш|горещ|стол|солна|пилатес|\b(?:sup|cardio|kids|child|teen|private|therapy|aerial|hot|chair|pilates)\b|\//u.test(name)) return 'yoga-class'
  if (!auto && ELECTRICAL.test(core) && !/табло|електромер|окабеляван|пералн|фурн|автоелектр|апарат|panel|meter|rewir|appliance/u.test(name)) return 'electrical-repair'
  if (DENTAL_EXAM.test(core) && !/детск|деца|педиатр|вадене|зъбен камък|зъбна плака|лечение на|избел|рентген|children|kids|pa?ediatric|extraction|scaling|whitening|x[ -]?ray/u.test(name)) return 'dental-exam'

  return null
}
