// #101 (brow threading) is already registered with the eyebrow rules.
export const SERVICE_PHOTO_95_TO_113_IDS = Object.freeze([
  'ipl-hair-removal', 'hair-toning', 'hair-straightening', 'hair-braiding',
  'dog-hand-stripping', 'nail-repair', 'foot-reflexology', 'tennis-court-rental',
  'table-tennis', 'carpet-cleaning', 'wheel-alignment', 'hair-camouflage',
  'one-guard-buzz-cut', 'father-and-son-haircuts', 'gel-natural-nail-overlay',
  'hand-hydration-treatment', 'foot-hydration-treatment', 'dental-crown',
])

const SALON = new Set(['hair', 'beauty', 'barber', 'nails'])
const HAIR = new Set(['hair', 'barber', 'beauty'])
const FOOT_CARE = new Set(['beauty', 'health', 'nails'])
const DENTAL = new Set(['health', 'other'])
const PET = /(?:^|[^\p{L}])(?:грум\p{L}*|куче\p{L}*|котк\p{L}*|ветеринар\p{L}*|dog|dogs|cat|cats|pet|pets|veterinary)(?=$|[^\p{L}])/u
const OTHER_PET = /котк|котеш|зай|гризач|\b(?:cats?|kittens?|rabbits?|rodents?)\b/u
const IPL = /^(?:фотоепилация(?:\s+с\s+ipl)?|ipl(?:\s+фото)?\s*(?:епилация|обезкосмяване|hair removal)|(?:epilation|hair removal)\s+(?:with\s+)?ipl)(?=$|[^\p{L}])/u
const IPL_ARM_OR_METADATA = /^(?:(?:(?:цяла|цели|половин)\s+)?ръц(?:е|ете|я|ята)|предмишниц[аи](?:те)?|(?:(?:fore|whole |half |full |lower )?arms?)|пълна цена|(?:за\s+)?(?:жени|мъже)|(?:wo)?men|female|male|\d+\s*(?:мин(?:ути)?\.?|min(?:utes)?))$/u
const TONER = /^(?:(?:тониране|матиране)(?:\s+на\s+коса(?:та)?)?|(?:hair (?:toning|toner)|(?:toning|toner) (?:for|of) (?:the )?hair))(?:\s*(?:и измиване|(?:без|с) сешоар|(?:inoa или illumina|shinefinity|dia или color touch)))?$/u
const FLAT_IRON = /^(?:(?:временно\s+)?изправяне(?:\s+на\s+коса(?:та)?)?\s+с\s+(?:плоска\s+)?преса|(?:стайлинг|оформяне)(?:\s+на\s+коса)?\s+с\s+преса|(?:hair )?straightening with (?:a )?(?:flat iron|straightener)|flat[ -]iron (?:styling|straightening))(?=$|[^\p{L}])/u
const BRAID = /^(?:плитк[аи]|сплитане на коса(?:та)?|(?:single |three[ -]strand |classic |hair )?braid(?:ing|s)?)(?=$|[^\p{L}])/u
const STRIPPING = /^(?:(?:ръчен\s+)?триминг(?:\s+на\s+(?:твърдокосместо\s+)?куче)?|(?:dog )?hand[ -]?stripping|(?:wire[ -]haired|wire coat) (?:dog )?stripping)(?=$|[^\p{L}])/u
const NAIL_REPAIR = /^(?:(?:поправка(?:\s*(?:\/|или)\s*лепене|\s+и\s+укрепване)?|ремонт|(?:за)?лепене|залепване|възстановяване)\s+(?:на\s+)?(?:(?:един|счупен|спукан)\s+)?нокът(?:я|ят)?|(?:broken|split|cracked) (?:finger)?nail repair|(?:finger)?nail repair)(?=$|[^\p{L}])/u
const FOOT_REFLEX = /^(?:(?:рефлексология|рефлексотерапия|рефлексен масаж)(?:\s+(?:на\s+)?(?:ходила(?:та)?|стъпала(?:та)?))?|масаж (?:на\s+)?(?:ходила(?:та)?|стъпала(?:та)?)|(?:foot|feet) (?:reflexology|massage)|reflexology (?:for|of) (?:the )?(?:feet|foot))$/u
const TENNIS_RENTAL = /^(?:(?:наем|резервация|резервиране)\s+на\s+(?:открит\s+)?тенис\s+корт(?:ове)?|(?:открит\s+)?тенис\s+корт\s+с\s+резервация|(?:outdoor )?tennis court (?:rental|booking|hire|reservation)|(?:hire|rent|book) (?:an? )?(?:outdoor )?tennis court)(?=$|[^\p{L}])/u
const TABLE_TENNIS = /^(?:(?:тренировк[аи]|уро[кц][и]?|игра|резервация)\s+(?:по|на|за)\s+)?(?:тенис на маса|пинг[ -]понг|table tennis|ping[ -]pong)(?=$|[^\p{L}])/u
const NON_TENNIS = /лакът|терапия|тенис и |тенис или |тенис\s*\/\s*|\b(?:elbow|therapy|tennis (?:and|or))\b/u
const RUG_WASH = /^(?:(?:машинно\s+)?пране\s+(?:на\s+)?(?:домашни\s+)?кили(?:м(?:и|а|ът)?|мчета)|(?:rug|carpet) (?:cleaning|washing|extraction)|(?:wet |steam )?cleaning (?:an? )?(?:area rug|carpet))(?=$|[^\p{L}])/u
const ALIGNMENT = /^(?:(?:регулиране|проверка|измерване)\s+(?:на\s+)?(?:геометрия(?:та)?\s+(?:на\s+)?(?:колела(?:та)?|автомобила)|сходимост(?:та)?(?:\s+на\s+(?:колела(?:та)?|предния мост))?)|реглаж\s+(?:на\s+)?(?:(?:преден и заден|предния и задния|преден|заден|предния|задния) мост|(?:и\s+)?(?:геометрия(?:та)?\s+на\s+)?колела(?:та)?)|(?:four[ -]wheel|front[ -]end(?: wheel)?|car wheel|wheel) alignment)(?=$|[^\p{L}])/u
const CAMOUFLAGE = /^(?:(?:камуфлиране|камуфлаж)(?:\s+(?:на\s+)?(?:побеляла|сива)\s+коса|\s+(?:на\s+)?коса(?:та)?)|(?:grey|gray) (?:hair )?(?:blending|camouflage)|(?:men'?s )?hair (?:grey|gray) blending)(?=$|[^\p{L}])/u
const BUZZ = /^(?:(?:мъжко\s+)?подстригване(?:\s+с\s+машинка)?(?:\s*[·—–-]\s*|\s+|\s+с\s+)(?:с\s+)?(?:един\s+номер|1\s*номер|№\s*1|една\s+приставка)|(?:single[ -]guard|one[ -]guard) (?:buzz cut|clipper haircut)|(?:buzz cut|clipper haircut) with (?:a )?(?:single|one) guard)(?=$|[^\p{L}])/u
const FATHER_SON = /^(?:(?:бръснарски пакет|подстригване|пакет)\s*(?:[·:–—-]\s*)?)?(?:баща и син|father (?:and|&) son)(?=$|[^\p{L}])/u
const OVERLAY = /^(?:(?:поставяне на |укрепване с )?(?:гел|изграждащ гел) върху естествен(?:и нокти| нокът)|(?:builder[ -]gel|gel) overlay (?:on|for) natural nails)(?=$|[^\p{L}])/u
const HYDRATION = /^(?:хидратиращ[аио]\s+(?:спа\s+)?(?:терапия|маска|грижа)|(?:hydrating|moisturi[sz]ing)\s+(?:(?:spa\s+)?(?:hand|foot|feet)\s+(?:treatment|mask|care)|(?:spa\s+)?(?:treatment|mask) for (?:hands|feet)))(?=$|[^\p{L}])/u
const HAND = /ръце(?:те)?|длани(?:те)?|\bhands?\b/u
const FEET = /крака(?:та)?|стъпала(?:та)?|ходила(?:та)?|\b(?:feet|foot)\b/u
const DENTAL_CROWN = /^(?:(?:поставяне на |изработка на |циментиране на )?(?:високо естетична\s+|изцяло\s+)?(?:зъбна|металокерамична|керамична|циркониева) корон(?:а|ка)|(?:поставяне на |изработка на |циментиране на )?корона\s+(?:на|върху)\s+зъб|(?:(?:ceramic|porcelain|zirconia) )?(?:dental|tooth) crown|(?:ceramic|porcelain|zirconia) crown (?:fitting|placement))(?=$|[^\p{L}])/u

function picturedIplArea(name) {
  if (!IPL.test(name)) return false
  // The IPL image shows a forearm. With another specified area or ambiguous
  // photo treatment (such as rejuvenation), do not imply a different service.
  return name.replace(IPL, '').split(/\s*[·:]\s*/u)
    .map(piece => piece.trim().replace(/^[-–—]\s*|^(?:на|for)\s+/u, ''))
    .filter(Boolean).every(piece => IPL_ARM_OR_METADATA.test(piece))
}

export function approvedServicePhoto95To113({ name, context, category, artKind } = {}) {
  if (typeof name !== 'string' || !name) return null
  const serviceCategory = category ?? context?.category
  const business = context?.business ?? context
  const primary = business?.businessCategory ?? business?.category ?? business?.industry
  const domain = serviceCategory && serviceCategory !== 'other' ? serviceCategory :
    primary ?? serviceCategory
  const core = name.split(/\s*·\s*/u, 1)[0]
  const pet = domain === 'pets' || business?.industry === 'pets' || ['pet-care', 'dog-grooming'].includes(artKind ?? context?.artKind) || PET.test(name)

  if (pet) {
    if ((domain === 'pets' || /куч|\bdog\b/u.test(name)) && STRIPPING.test(core) && !OTHER_PET.test(name) &&
      !/подстриг|машинк|ножиц|разрес|къпан|\b(?:clipper|scissor|bath|haircut|brushing)\w*\b/u.test(name)) return 'dog-hand-stripping'
    return null
  }

  if ((domain === 'beauty' || !domain || domain === 'other') && picturedIplArea(name)) return 'ipl-hair-removal'

  if (HAIR.has(domain) || (!domain && /коса|hair/u.test(core))) {
    if (TONER.test(core) && !/вежд|брад|мигл|балеаж|кичур|избел|изрус|перманент|матир\p{L}* лак|\b(?:brows?|beard|lashes|balayage|bleach)\b/u.test(name)) return 'hair-toning'
    if (FLAT_IRON.test(core) && !/маша|или|\/|кератин|химич|перманент|екстенш|бразил|пресотерап|\b(?:or|keratin|chemical|permanent|extensions?|curling)\b/u.test(name)) return 'hair-straightening'
    if (BRAID.test(core) && !/рибена кост|афро|сенегал|френск|холандск|опашка|екстенш|вграждан|канекалон|цялост|\b(?:fishtail|afro|senegalese|french|dutch|cornrows?|extensions?|ponytail)\b/u.test(name)) return 'hair-braiding'
    if (CAMOUFLAGE.test(core) && !/брад|вежд|подстриг|балеаж|\/|\b(?:brows?|beard|haircut|balayage)\b/u.test(name)) return 'hair-camouflage'
    if (BUZZ.test(name) && !/детск|дете|баща и син|брад|вежд|оформян|бръсн|фейд|\b(?:kids?|children|beard|brows?|shav\w*|fade)\b/u.test(name)) return 'one-guard-buzz-cut'
    if (FATHER_SON.test(name) && (domain === 'barber' || primary === 'barber' || /подстриг|haircuts?/u.test(name)) &&
      !/брад|брат|дъщер|майка|бръснен|бръснач|\b(?:beard|brother|daughter|mother|shav\w*)\b/u.test(name)) return 'father-and-son-haircuts'
  }

  if (SALON.has(domain) || (!domain && /нок[ът]|\bnail/u.test(core))) {
    if (NAIL_REPAIR.test(core) && !/педикюр|ноктопласт|изграждане|лечение|гъбич|фибростъкло|акрил|полигел|\b(?:toe\w*|pedicure|extension|fung\w*|fibreglass|fiberglass|acrylic|polygel)\b/u.test(name)) return 'nail-repair'
    if (OVERLAY.test(core) && !/педикюр|полигел|акрил|удължав|сваляне|премахване|чужд материал|\b(?:pedicure|polygel|acrylic|extensions?|removal)\b/u.test(name)) return 'gel-natural-nail-overlay'
  }

  if (FOOT_CARE.has(domain)) {
    if (FOOT_REFLEX.test(core) && !HAND.test(name) && !/глезен|подбедриц|педикюр|акупункт|\b(?:ankle|calves?|pedicure|acupuncture)\b/u.test(name)) return 'foot-reflexology'
    if (HYDRATION.test(core) && !/парафин|маникюр|педикюр|лазер|\b(?:paraffin|manicure|pedicure|laser)\b/u.test(name)) {
      const hand = HAND.test(core), foot = FEET.test(core)
      if (hand !== foot) return hand ? 'hand-hydration-treatment' : 'foot-hydration-treatment'
    }
  }

  if ((domain === 'fitness' || !domain) && !NON_TENNIS.test(name)) {
    if (TABLE_TENNIS.test(core)) return 'table-tennis'
    if (TENNIS_RENTAL.test(core) && !/маса|на закрито|зала|треньор|урок|трениров|\b(?:indoor|lesson|coaching|table)\b/u.test(name)) return 'tennis-court-rental'
  }
  if ((domain === 'home_services' || !domain) && RUG_WASH.test(core) &&
    !/автомобил|стелк|диван|матрак|мокет|сухо|ремонт|\b(?:car mats?|upholstery|sofas?|mattresses?|dry|repair)\b/u.test(name)) return 'carpet-cleaning'
  if ((domain === 'auto_repair' || domain === 'auto' || !domain) && ALIGNMENT.test(core) &&
    !/фар|мотоциклет|велосипед|камион|кормил|ремонт|смяна|\b(?:headlights?|motorcycle|bike|truck|steering|repair|replacement)\b/u.test(name)) return 'wheel-alignment'
  if ((DENTAL.has(domain) || !domain) && DENTAL_CROWN.test(core) &&
    !/детск|временна|имплант|мост|сваляне|премахване|поправка|\b(?:child\w*|temporary|implant|bridge|removal|repair)\b/u.test(name)) return 'dental-crown'
  return null
}
