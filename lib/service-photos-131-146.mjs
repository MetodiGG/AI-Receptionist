import { normalizeSearchText } from './discovery/categories.mjs'

export const SERVICE_PHOTO_131_TO_146_IDS = Object.freeze([
  'dog-ear-cleaning', 'water-heater-installation', 'brake-fluid-service', 'car-radiator-replacement',
  'dog-paw-trim', 'car-interior-detailing', 'endospheres-roller-massage', 'french-manicure-regular',
  'french-pedicure-regular', 'head-shave-beard-trim', 'brow-and-upper-lip-threading',
  'music-lesson-choice', 'car-glass-chip-repair', 'acupuncture', 'one-to-one-yoga', 'online-psychology-session',
])

const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const BEAUTY = new Set(['beauty', 'hair', 'nails', 'barber'])
const DOG = /(?:^|[^\p{L}])(?:куче(?:та|то)?|кучеш\p{L}*|dogs?|doggy|pupp(?:y|ies)|canine)(?=$|[^\p{L}])/u
const OTHER_ANIMAL = /(?:^|[^\p{L}])(?:котк\p{L}*|котеш\p{L}*|гризач\p{L}*|зайц\p{L}*|заек|морско свинче|cats?|feline|kittens?|rodents?|rabbits?|guinea pigs?)(?=$|[^\p{L}])/u
const PET_COMBO = /къпане|подрязване на нокти|нокторез|преглед|инфекц|лечение|ветеринарн|\b(?:bath|nail trim|infection|treatment|veterinary exam|consultation)\b/u
const EAR_CLEAN = /^(?:(?:почистване|хигиена) на (?:външните )?уши(?:те)?(?: (?:на|при) куче(?:та|то)?)?|кучешк[аи] уши(?:\s*[—–:-]\s*почистване)?|(?:dog |canine )?ear cleaning|ear cleaning (?:for|of) (?:a )?dogs?)$/u
const PAW_TRIM = /^(?:бръснене на лапи(?:те)?|(?:подстригване|оформяне|бръснене) на (?:кучешка )?козина (?:около|между|на) лапи(?:те)?|(?:dog |canine )?paw(?:[ -]pad)? (?:fur |hair )?(?:trim(?:ming)?|shav(?:e|ing)))(?: (?:на|за) куче(?:та|то)?)?$/u
const HEATER = /^(?:(?:оглед и )?(?:монтаж(?: и свързване)?|свързване) на (?:(?:домашен|електрически) )?бойлер(?: при съществуващи изводи)?|(?:electric |domestic )?(?:water heater|hot water tank) (?:installation|plumbing connection)|(?:installation|plumbing connection) (?:of )?(?:a )?(?:water heater|hot water tank))$/u
const HEATER_OTHER = /проточен|газов|слънчев|табло|окабеляване|източване|клапан|електрическо свързване|\b(?:tankless|gas|solar|rewir\w*|wiring|draining|valve)\b/u
const WATER_CONNECTION = /водопровод|водоснабдяв|(?:вход|извод|тръб\p{L}*)\s+за\s+вода|\b(?:plumbing|water supply)\b/u
const ELECTRIC_SERVICE = /електро(?:услуги|техник)|\b(?:electrician|electrical contractor)\b/u
const BRAKE_FLUID = /^(?:(?:смяна|подмяна|промивка) (?:на )?спирачна(?:та)? течност|(?:car )?brake fluid (?:change|replacement|flush)|(?:change|replace|flush) (?:the )?brake fluid)$/u
const RADIATOR = /^(?:(?:смяна|подмяна) (?:на )?(?:воден |охладителен |охлаждащ )(?:автомобилен )?радиатор(?: на (?:лек )?автомобил)?|(?:смяна|подмяна) на автомобилен радиатор|(?:car |vehicle |engine |cooling )radiator (?:replacement|change)|(?:replacement|change) (?:of )?(?:a |the )?(?:car |vehicle |engine |cooling )radiator)$/u
const INTERIOR_DETAIL = /^(?:(?:цялостен |пълен )?интериорен детайлинг(?: (?:на|за) (?:лек )?автомобил)?(?:\s*[—–-]\s*(?:голям джип|джип|лек автомобил|ван))?|детайлно почистване на (?:автомобилен интериор|интериора на (?:лек )?автомобил|салона на (?:лек )?автомобил)|(?:car |vehicle |automotive )?interior detail(?:ing)?)$/u
const ENDO = /^(?:(?:апаратен масаж|терапия) с )?(?:endospheres(?: therapy)?|ендосфер\p{L}*|ендосфера)(?=$|[^\p{L}])/u
const NAIL_EXCLUDES = /гел[ -]*лак|шеллак|акрил|ноктопласт|укреп|изграждан|вграден|омбре|свалян|отстраняван|без лак|\b(?:gel|shellac|acrylic|extension|overlay|ombre|removal)\b/u
const FRENCH_HAND = /^(?:френски маникюр с (?:(?:обикновен|класически|традиционен) )?лак|french manicure with (?:regular|traditional|conventional) (?:nail )?polish)$/u
const FRENCH_FOOT = /^(?:френски педикюр с (?:(?:обикновен|класически|традиционен) )?лак|french pedicure with (?:regular|traditional|conventional) (?:nail )?polish)$/u
const HEAD_SHAVE_AND_BEARD = /^(?:(?:гладко |класическо )?бръснене на (?:главата|глава|скалп)(?: с (?:бръснач|шейвър))?\s*(?:\+|&|и)\s*(?:оформяне|подстригване) на брада(?:та)?|(?:clean |bald |wet )?(?:head|scalp) shav(?:e|ing)\s*(?:\+|&|and)\s*beard (?:trim(?:ming)?|shap(?:e|ing)))$/u
const BROW_LIP = /^(?:(?:оформяне на |почистване на )?вежди(?:те)?\s*(?:\+|&|и)\s*(?:епилация на )?горна(?:та)? устна с (?:памучен )?конец|(?:eyebrow|brow)s?\s*(?:\+|&|and)\s*upper lip threading|threading (?:of )?(?:the )?(?:eyebrow|brow)s?\s*(?:\+|&|and)\s*(?:the )?upper lip)$/u
const MUSIC_CHOICE = /^(?:музикални уроци\s*[:·–—-]\s*)?(?:пеене\s*\/\s*пиано\s*\/\s*китара\s*\/\s*солфеж|пиано,\s*китара,\s*пеене\s*(?:,|или)\s*солфеж|piano,\s*guitar,\s*singing\s*(?:,|or)\s*(?:solf[eè]ge|solfege))$/u
const GLASS_REPAIR = /^(?:(?:ремонт|възстановяване|запълване) на (?:малка )?(?:пукнатин[аи]|шупл[аи]|точков удар) (?:в|на|по) (?:предно|челно|автомобилно) стъкло|(?:ремонт|поправка) на (?:предно|челно|автомобилно) стъкло (?:при|с) (?:пукнатина|точков удар)|(?:windshield|windscreen|auto glass) (?:chip|crack) repair|repair (?:of )?(?:a )?(?:chip|crack) in (?:a |the )?(?:windshield|windscreen|auto glass))$/u
const ACUPUNCTURE = /^(?:(?:класическа|традиционна) )?акупунктура(?: на предмишница)?$|^(?:traditional )?acupuncture(?: (?:on|for) (?:the )?forearm)?$/u
const INDIVIDUAL_YOGA = /^(?:(?:индивидуална|персонална|частна) йога(?: практика| сесия)?(?: за (?:един|1) човек)?|индивидуално (?:занимание|занятие) по йога|индивидуална тренировка по йога|(?:private|individual|one[ -]to[ -]one|1[ -]on[ -]1) yoga(?: class| session)?)$/u
const ONLINE_PSYCHOLOGY = /^(?:(?:онлайн|видео) (?:психологич(?:на|еска) консултация(?:\s*\/\s*психотерапия)?|психотерапия|консултация с психолог)|(?:психологич(?:на|еска) консултация|психотерапия) онлайн|(?:online|video) (?:psychology consultation|psychotherapy|psychological counselling|psychological counseling|psychology session)|online consultation with (?:a )?psychologist)$/u

export function approvedServicePhoto131To146({ name, context = {}, category = context.category, artKind = context.artKind } = {}) {
  const title = normalizeSearchText(name)
  if (!title) return null
  const description = normalizeSearchText(context.service?.description)
  const [core] = title.split(/\s*·\s*/u, 1)
  const details = `${title} ${description}`
  const industry = context.business?.industry
  const businessCategory = context.business?.businessCategory ?? context.business?.category
  const auto = AUTO.has(category) || AUTO.has(businessCategory) || industry === 'auto' || /автомобил|\b(?:car|vehicle|automotive|windshield|windscreen)\b/u.test(title)
  const salon = BEAUTY.has(category) || BEAUTY.has(businessCategory) || industry === 'beauty'
  const pet = category === 'pets' || businessCategory === 'pets' || industry === 'pets' || artKind === 'pet-care' || artKind === 'dog-grooming'
  const dog = DOG.test(details)

  if (pet || dog || OTHER_ANIMAL.test(details)) {
    // Ear and paw care may also be offered for cats or other pets; the
    // procedure itself, not the groomer's portfolio, must identify a dog.
    if (!dog || OTHER_ANIMAL.test(details) || PET_COMBO.test(details)) return null
    const [petCore] = title.replace(/^(?:куче|dog)\s*·\s*/u, '').split(/\s*·\s*/u, 1)
    if (EAR_CLEAN.test(petCore)) return 'dog-ear-cleaning'
    if (PAW_TRIM.test(petCore) && !/нокт|уши|котк|педикюр|\b(?:nail|ears?|cat|pedicure)\b/u.test(details)) return 'dog-paw-trim'
    return null
  }

  if ((category === 'home_services' || businessCategory === 'home_services' || industry === 'home_services') &&
    HEATER.test(core) && !HEATER_OTHER.test(details) &&
    (!/^свързване на/u.test(core) || !ELECTRIC_SERVICE.test(normalizeSearchText(context.business?.name)) || WATER_CONNECTION.test(details))) return 'water-heater-installation'
  if (auto && BRAKE_FLUID.test(core) && !/проверка|доливане|тест|съединител|накладки|\b(?:check|top[ -]up|test|clutch|pads)\b/u.test(title)) return 'brake-fluid-service'
  if (auto && RADIATOR.test(core) && !/парно|климатик|интеркулер|маслен|почистване|промивка|\b(?:heater|air conditioning|intercooler|oil cooler|cleaning|flush)\b/u.test(title)) return 'car-radiator-replacement'
  if (auto && (INTERIOR_DETAIL.test(core) || /^cabin refresh\s*·\s*интериорен детайлинг$/u.test(title)) &&
    !/наводнен|разглобяване|озон|външн|екстериор|полиране на боя|\b(?:flood|disassembl\w*|ozone|exterior|paint correction)\b/u.test(details)) return 'car-interior-detailing'
  if (auto && GLASS_REPAIR.test(core) && !/подмяна|смяна|затъмняване|покритие|полиране|\b(?:replacement|tint|coating|polish)\b/u.test(title)) return 'car-glass-chip-repair'
  if ((salon || category === 'health') && ENDO.test(core) &&
    !/консултация|обучение|продажба|лизинг|\b(?:consultation|training|sale|lease)\b/u.test(title)) return 'endospheres-roller-massage'

  if (salon && !NAIL_EXCLUDES.test(title)) {
    if (FRENCH_HAND.test(core) && !/педикюр|стъпал|pedicure|toenails?/u.test(title)) return 'french-manicure-regular'
    if (FRENCH_FOOT.test(core) && !/маникюр|manicure|fingernails?/u.test(title)) return 'french-pedicure-regular'
  }
  if (salon && HEAD_SHAVE_AND_BEARD.test(core) &&
    !/вежд|боядис|подстригване на коса|детск|депилац|\b(?:brows?|colou?r|haircut|kids?|waxing)\b/u.test(title)) return 'head-shave-beard-trim'
  if (salon && BROW_LIP.test(core) &&
    !/восък|кола маска|пинсет|лазер|боядис|ламинир|цяло лице|\b(?:wax|tweezers|laser|tint|lamination|full face)\b/u.test(details)) return 'brow-and-upper-lip-threading'
  if ((category === 'education' || businessCategory === 'education' || industry === 'education') && MUSIC_CHOICE.test(core) &&
    !/барабан|театър|актьор|\b(?:drums|theatre|theater|acting)\b/u.test(title)) return 'music-lesson-choice'

  if (ACUPUNCTURE.test(core) &&
    !/сухо игло|електроакупунктур|електрическ|лазер|лице|аурикуло|на ухо|вендуз|детск|\b(?:dry needling|electroacupuncture|electric|laser|facial|auricular|ear|cupping|kids?)\b/u.test(title)) return 'acupuncture'
  if (INDIVIDUAL_YOGA.test(core) &&
    !/двама|двойк|две лица|2 (?:души|човека|лица)|груп|детск|пренатал|бремен|горещ|въздушн|\b(?:group|couples?|two|kids?|prenatal|hot yoga|aerial)\b/u.test(title)) return 'one-to-one-yoga'
  if (ONLINE_PSYCHOLOGY.test(core) &&
    !/детск|с деца|двойк|семей|груп|по телефон|телефонн|по чат|по имейл|\b(?:children|child|kids?|couples?|family|group|phone|chat|email)\b/u.test(details)) return 'online-psychology-session'
  return null
}
