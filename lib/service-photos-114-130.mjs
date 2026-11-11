export const SERVICE_PHOTO_114_TO_130_IDS = Object.freeze([
  'dental-extraction', 'post-renovation-cleaning', 'armchair-cleaning', 'manual-therapy',
  'cupping-therapy', 'car-exterior-hand-wash', 'dog-full-grooming', 'kickboxing-training',
  'martial-arts-aikido', 'formal-event-hairstyle', 'hair-heat-styling', 'hair-perm',
  'hair-extension-row', 'gel-manicure-with-removal', 'oral-hygiene', 'deep-tissue-massage',
  'prenatal-massage',
])

const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const HAIR = new Set(['hair', 'barber', 'beauty'])
const PET_ART = new Set(['dog-grooming', 'pet-care'])
const ANIMALS = /ветеринар|куч[еа]|котк|груминг|\b(?:veterinar\w*|canine|feline|pets?|dogs?|cats?)\b/u
const CHILD = /детск|дете|деца|юнош|под\s+18|млечен зъб|временен зъб|\b(?:pa?ediatric|child|children|kids?|teens?|baby tooth|primary tooth|deciduous tooth)\b/u
const REMOTE = /онлайн|дистанц|видеовръз|\b(?:online|remote|virtual)\b/u
const HOME_VISIT = /на адрес|у дома|вкъщи|домашн\p{L}* посещен|\b(?:home visit|in[ -]home|at home)\b/u

const TOOTH_EXTRACTION = /^(?:(?:(?:затруднена|обикновена|рутинна) )?(?:екстракция|изваждане|вадене) на (?:\p{L}+[ -]){0,3}(?:зъб(?:а|и|ите)?|мъдрец)|(?:(?:adult|routine|simple|single[ -]root) )?(?:tooth|dental|wisdom tooth) extraction|extraction of (?:a |the )?(?:\p{L}+[ -]){0,3}(?:tooth|teeth))(?=$|[^\p{L}])/u
const ORAL_HYGIENE = /^(?:(?:професионална|клинична|кабинетна) орална хигиена|(?:(?:професионално|цялостно|клинично|ултразвуково) )?почистване на (?:зъбен камък|зъби(?:те)?)|(?:(?:professional|clinical|ultrasonic) )?(?:oral hygiene|dental scaling|teeth cleaning|tartar removal))(?=$|[^\p{L}])/u
const RENOVATION_CLEANING = /^(?:(?:(?:планирано|основно|цялостно) )?почистване(?: на (?:апартамент|жилище|дом|къща))? след (?:(?:строителен|основен) )?ремонт(?: на адрес)?|(?:post[ -](?:renovation|construction)|after[ -]renovation) (?:residential |home |apartment )?cleaning)$/u
const ARMCHAIR = /^(?:(?:пране|мокро почистване|екстракторно почистване)(?:\s*[·:]\s*| (?:на )?)(?:единичен |тапициран )?фотьойл(?:и)?|(?:upholstered )?armchair (?:washing|extraction cleaning|wet cleaning|cleaning)|(?:washing|wet cleaning|extraction cleaning) (?:an? |the )?(?:upholstered )?armchair)$/u
const MANUAL = /^(?:(?:(?:комплексна|профилактична|физиотерапевтична и) )?мануална терапия(?: и рехабилитация)?|(?:заключителен )?преглед и мануална манипулация|(?:individual |physiotherapy and )?manual therapy(?: and rehabilitation)?)$/u
const CUPPING = /^(?:(?:суха |вакуумна )?вендузотерапия|терапия с (?:вакуумни |сухи )?вендузи|(?:dry |vacuum )?cupping therapy)$/u
const HAND_WASH = /^(?:(?:ръчно (?:външно )?(?:измиване|миене)|външно (?:ръчно )?(?:измиване|миене) с (?:гъба|микрофибър(?:на ръкавица)?|ръкавица))(?: на (?:лек |тежък )?(?:автомобил|кола|джип|suv))?(?: на адрес)?|(?:car |vehicle )?(?:exterior )?hand wash(?:ing)?(?: (?:for|of) (?:a |the )?(?:car|vehicle|suv))?)$/u
const DOG_GROOMING = /^(?:(?:цялостен|пълен|комплексен) груминг(?: (?:на|за) куче(?:та)?|\s*[·:]\s*(?:(?:малко|средно|голямо) )?куче(?: (?:до|над) \d+(?:[.,]\d+)?\s*кг)?)|куче\s*[·:]\s*(?:цялостен|пълен|комплексен) груминг|(?:full|complete) (?:dog|canine) groom(?:ing)?|dog full groom(?:ing)?)(?=$|\s*·)/u
const NOT_DOG_ONLY = /котк|котеш|гризач|заек|морско свинче|ветеринар|\b(?:cats?|feline|rodents?|rabbits?|guinea pig|veterinar\w*)\b/u
const KICKBOXING = /^(?:(?:(?:индивидуалн(?:о|а)|персоналн(?:о|а)|групов(?:о|а)|пробн(?:о|а)) )?(?:(?:тренировка|занятие|урок) (?:по|за) )?кик[ -]?бокс|(?:(?:individual|group|introductory|trial) )?kick[ -]?boxing(?: (?:training|class|lesson|session))?)(?=$|\s*·)/u
const AIKIDO = /^(?:(?:(?:индивидуалн(?:о|а)|персоналн(?:о|а)|групов(?:о|а)|пробн(?:о|а)) )?(?:(?:тренировка|занятие|урок) по )?айкидо|занятие по бойни изкуства на основата на айкидо|aikido(?: (?:training|class|lesson|session))?)(?=$|\s*·)/u
const FORMAL_HAIR = /^(?:(?:пробна |вечерна |сватбена )?официална прическа|вечерна прическа|(?:special[ -]occasion|formal[ -]event|formal|evening) (?:hairstyle|hair styling))$/u
const HEAT_STYLING = /^(?:(?:(?:стайлинг|оформяне|стилизиране) с )?(?:преса\s*(?:или|\/)\s*маша|маша\s*(?:или|\/)\s*преса)(?: без измиване| с измиване)?|heat styling(?: with (?:a )?(?:flat iron or curling (?:iron|wand)|curling (?:iron|wand) or flat iron))?)$/u
const PERM = /^(?:(?:(?:мъжко|дамско|трайно|химическо|студено) )?къдрене(?: на коса)?|(?:chemical |cold |hair )?perm(?: for (?:men|women))?|permanent curl(?:ing)?)$/u
const CLIP_IN_ROW = /^(?:(?:поставяне|слагане|монтаж) на (?:един|1) ред екстеншън(?:и|а)? (?:с клипс(?:ове|и)?|с щипки|clip[ -]?in)|(?:single|one)[ -]row clip[ -]?in (?:hair )?extensions? (?:fitting|installation)|(?:fitting|installation) of (?:a )?(?:single|one)[ -]row clip[ -]?in (?:hair )?extensions?)$/u
const GEL = /гел[ -]*лак|шеллак|gel[ -]*polish|shellac/u
const MANICURE = /маникюр|\bmanicure\b/u
const REMOVAL = /свалян|отстраняван|премахван|\b(?:remove|removing|removal|soak[ -]off)\b/u
const DEEP_TISSUE = /^(?:дълбокотъкан+ен(?: лечебен)? масаж(?: (?:на|за) (?:гръб|рамене))?|(?:частичен )?дълбокотъкан+ен масаж|deep[ -]tissue massage(?: therapy)?(?: (?:for|on) (?:the )?(?:back|shoulders?))?)$/u
const PRENATAL = /^(?:масаж (?:при бременност|за бременни(?: жени)?)|(?:пренатален|предродилен) масаж|(?:prenatal|pregnancy|antenatal) massage(?: therapy)?)$/u

export function approvedServicePhoto114To130({ name, context = {}, category = context.category, artKind = context.artKind } = {}) {
  if (!name) return null
  const { business, service } = context
  const [core] = name.split(/\s*·\s*/u, 1)
  const auto = AUTO.has(category) || business?.industry === 'auto'
  const home = category === 'home_services' || artKind === 'home-services' || business?.industry === 'home_services'
  const pet = category === 'pets' || PET_ART.has(artKind) || business?.industry === 'pets'
  if (pet) {
    // Do not imply a species from an unspecified full-grooming menu or a
    // different pictured coat/breed from a breed-specific service label.
    if (DOG_GROOMING.test(name) && !NOT_DOG_ONLY.test(name) &&
      !/\s*(?:и|\+)\s*(?:изрязване|вадене|почистване на зъб|ваксина|обезпаразит)|без (?:къпане|подстригване)|само (?:къпане|подстригване)|\b(?:without a? ?bath|without a? ?haircut|dental cleaning|vaccin\w*)\b/u.test(name)) return 'dog-full-grooming'
    return null
  }
  if (auto) {
    if (HAND_WASH.test(core) && !/безконтакт|самообслуж|автоматич|под налягане|водоструй|пара|безводно|вътрешн|джант|двигател|полир|покрити|\b(?:touchless|contactless|self[ -]service|pressure|steam|waterless|interior|wheels?|engine|polish\w*|coating)\b/u.test(name)) return 'car-exterior-hand-wash'
    return null
  }
  if (home) {
    if (RENOVATION_CLEANING.test(core) && !/оглед|офис|заведение|търгов|индустриал|фасад|прозорц|извозване|\b(?:inspection|office|restaurant|commercial|industrial|facade|windows?|hauling)\b/u.test(name)) return 'post-renovation-cleaning'
    if ((ARMCHAIR.test(core) || ARMCHAIR.test(name)) && !/сухо|пара|кожа|кожен|диван|канапе|килим|матрак|\b(?:dry|steam|leather|sofa|couch|carpet|mattress)\b/u.test(name)) return 'armchair-cleaning'
    return null
  }
  if (category === 'fitness' || artKind === 'fitness' || business?.industry === 'fitness') {
    if (CHILD.test(name) || REMOTE.test(name)) return null
    if (KICKBOXING.test(name) && !/\b(?:sparring|fitness|cardio|equipment)\b|спаринг|състез|кардио|под наем/u.test(name)) return 'kickboxing-training'
    if (AIKIDO.test(name) && !/\b(?:weapons?|swords?|competition)\b|оръж|меч|състез/u.test(name)) return 'martial-arts-aikido'
    return null
  }
  if (HAIR.has(category) || artKind === 'haircut' || artKind === 'hair-colour') {
    if (CHILD.test(name) || REMOTE.test(name)) return null
    // Keep narrower updos, braids, and the single-tool services separate.
    if (FORMAL_HAIR.test(core) && !/кок|прибрана|плитк|маша|преса|перук|аксесоар|\b(?:updo|braids?|curling|flat iron|wig)\b/u.test(name)) return 'formal-event-hairstyle'
    if (HEAT_STYLING.test(core) && !/екстенш|кератин|ламинир|къдрене|сешоар|\b(?:extensions?|keratin|laminat\w*|perm|blow[ -]?dry)\b/u.test(name)) return 'hair-heat-styling'
    // Plain Bulgarian “къдрене” does not establish a chemical perm.
    if (PERM.test(core) && /трайно|химическо|студено|\b(?:perm|permanent)\b/u.test(core) &&
      !/маша|преса|мигл|вежд|терапия|без химия|\b(?:curling iron|flat iron|lashes|brows?|chemical[ -]free)\b/u.test(name)) return 'hair-perm'
    if (CLIP_IN_ROW.test(core) && !/свалян|поддръж|капси|кератин|лент|\b(?:removal|maintenance|keratin|tape[ -]in|micro[ -]rings?)\b/u.test(name)) return 'hair-extension-row'
  }
  if ((category === 'nails' || artKind === 'manicure') && GEL.test(core) && MANICURE.test(core) && REMOVAL.test(core) &&
    /маникюр с (?:гел[ -]*лак|шеллак)|gel(?:[ -]polish)? manicure|(?:нов|повторен) (?:гел[ -]*лак|шеллак)|new gel[ -]polish/u.test(core) &&
    !/без\s+(?:свалян|отстраняван|премахван|маникюр|лак|гел)|педикюр|ноктопласт|акрил|сухо|\b(?:without|no)\s+(?:removal|manicure|gel|polish)|\b(?:pedicure|acrylic|dry|extensions?)\b/u.test(name)) return 'gel-manicure-with-removal'

  if (ANIMALS.test(name) || REMOTE.test(name) || HOME_VISIT.test(name) || CHILD.test(name)) return null
  if (category === 'other' || category === 'health' || !category) {
    if (TOOTH_EXTRACTION.test(core) && !/ретиниран|хирург|фрактур|коренов фрагмент|зъбен фрагмент|консултац|\b(?:surgical|impacted|fractur\w*|fragment|consult\w*)\b/u.test(name)) return 'dental-extraction'
    if (ORAL_HYGIENE.test(core) && !/кухин|кариес|избелв|лечение|кюретаж|лазер|air\s*flow|дълбок|\b(?:cavit\w*|caries|whitening|curettage|laser|deep cleaning)\b/u.test(name)) return 'oral-hygiene'
  }
  if (category === 'health' || artKind === 'health' || category === 'beauty' || artKind === 'beauty' || category === 'other' || !category) {
    if (MANUAL.test(core) && !/игл|вендуз|лазер|лице|глава|гръбнак|шиен отдел|стъпал|\b(?:needl\w*|cupping|laser|face|head|spine|cervical|foot|feet)\b/u.test(name)) return 'manual-therapy'
    if (CUPPING.test(core) && !/мокри|кървав|огън|мокса|масаж и|с игл|акупунктур|\b(?:wet|fire|moxa|hijama|needl\w*|acupuncture)\b/u.test(name)) return 'cupping-therapy'
    if (DEEP_TISSUE.test(core) && !/лице|глава|ръце|крака|стъпал|апарат|ролер|вендуз|\b(?:face|head|arms?|legs?|foot|feet|machine|roller|cupping)\b/u.test(name)) return 'deep-tissue-massage'
    if (PRENATAL.test(core) && !/корем|след раждане|бебе|апарат|лимфен|\b(?:abdominal|postpartum|postnatal|baby|machine|lymphatic)\b/u.test(name)) return 'prenatal-massage'
  }
  return null
}
