import { normalizeSearchText } from './discovery/categories.mjs'

// Illustrative activity families, never assertions about a business's actual
// work, staff, equipment, qualifications, tariffs or bookable availability.
export const GENERATED_CATALOGUE_SERVICE_PHOTO_IDS = Object.freeze([
  'language-lesson', 'violin-lesson', 'drums-lesson', 'music-theory-lesson', 'driving-lesson',
  'dance-lesson', 'karate-training', 'bjj-training', 'strength-training',
  'dental-filling', 'dental-root-canal', 'dental-implant-consultation', 'orthodontic-consultation', 'child-dental-exam',
  'couples-counselling', 'family-counselling', 'child-psychology', 'photography-session',
  'vehicle-technical-inspection', 'motorcycle-inspection', 'vehicle-lpg-inspection',
  'car-air-filter-service', 'car-fuel-filter-service', 'suspension-repair',
  'lash-removal', 'microdermabrasion', 'facial-massage', 'paraffin-hand-treatment',
  'household-appliance-installation', 'wall-painting', 'home-aircon-service', 'pressotherapy',
  'small-pet-grooming', 'hot-stone-massage', 'facial-ultrasound',
])

const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const SALON = new Set(['beauty', 'hair', 'barber', 'nails'])
const CHILD = /детск|дете|деца|беб|юнош|младеж|тийн|предучилищ|\b(?:child\w*|kids?|teen\w*|bab(?:y|ies)|pediatric|paediatric)\b|(?:^|[^\d])(?:\d|1[0-7])\s*(?:[–—-]\s*(?:\d|1[0-7]))?\s*[-– ]*\s*(?:годиш|год\.?(?=$|[^\p{L}])|г\.(?=$|[^\p{L}])|years? old)/u
const REMOTE = /онлайн|дистанц|видео\s*(?:връз|срещ)|по телефон|по имейл|по чат|\b(?:online|remote|virtual|video call|telephone|email|chat)\b/u
const GROUP = /груп|двама|двойк|две лица|двама души|\b(?:group\w*|couples?|two (?:people|students)|classroom)\b/u
const PET = /куч|котк|котеш|гризач|морско свинче|зай[цч]|заек|ветеринар|\b(?:dogs?|cats?|pets?|rodents?|rabbits?|guinea pigs?|veterinary)\b/u
const NOT_CAR = /мотоцик|велосип|скутер|автобус|камион|товарен.*(?:n2|n3)|\b(?:motorcycles?|bicycles?|scooters?|buses?|trucks?|lorr(?:y|ies))\b/u
const text = value => typeof value === 'string' ? normalizeSearchText(value) : ''

export function generatedCatalogueServicePhotoKind(service, business = {}) {
  const name = text(service?.name)
  if (!name || name.length > 1000) return null
  business ||= {}
  const category = service?.category || business.businessCategory || business.category || business.industry || 'other'
  const primary = business.businessCategory || business.category || business.industry || 'other'
  const context = `${text(business.name)} ${text(business.description)} ${text(business.public_profile?.description?.bg)}`
  const [core] = name.split(/\s*·\s*/u, 1)
  const auto = AUTO.has(category) || AUTO.has(primary)
  const salon = SALON.has(category) || SALON.has(primary)
  const home = category === 'home_services' || primary === 'home_services'
  const education = category === 'education' || primary === 'education'
  const sport = category === 'fitness' || primary === 'fitness'
  const adult = !CHILD.test(name), onsite = !REMOTE.test(name), solo = !GROUP.test(name)

  // A guinea-pig grooming frame is not a dog/cat/rabbit picture or a photo of
  // nail clipping, bathing or veterinary treatment. An unnamed pet is unknown.
  if (category === 'pets' || primary === 'pets' || PET.test(name)) {
    if (/морско свинче|гризач|\b(?:guinea pig|small rodent|rodent)\b/u.test(name) &&
      /груминг|разресване|\b(?:grooming|brushing)\b/u.test(name) &&
      !/куч|кот|заек|зай[цч]|хамстер|плъх|мишка|нокт|уши|къп|бръс|ветеринар|лечение|\b(?:dog|cat|rabbit|hamster|rat|mouse|nail|ear|bath|shav\w*|veterinary|treatment)\b/u.test(name)) return 'small-pet-grooming'
    return null
  }

  // One picture must not silently stand in for a second named activity. These
  // optional additions do not need to resolve a compound service: the neutral
  // fallback preserves its complete wording without making a visual claim.
  if (/(?:^|\s)(?:и|\+|&|and|plus)(?:\s|$)/u.test(name)) return null

  // Operator/camera only: this frame deliberately shows no newborn, bride or
  // portrait subject. It can illustrate photographic subtypes without claiming
  // a depicted client's age/event; photopolymer dental work is unrelated.
  if (/фотосес|фотозаснем|фотограф(?:ия|иране|ски услуги)|\b(?:photoshoot|photo shoot|photo session|photography|portrait session)\b/u.test(name) &&
    !/фотополимер|фототерап|фотоепил|видеозаснем|консултац|\b(?:photopolymer|phototherapy|photoepilation|video|consultation)\b|уро[кц]|курс|обучение|\b(?:lesson|course|training)\b/u.test(name) &&
    !/^(?:ретуш|обработка|печат|принтиране|сканиране|дигитализация|реставрация|възстановяване|retouch|editing|printing|scanning|restoration)(?=$|[^\p{L}])/u.test(core)) return 'photography-session'

  if (education && adult && onsite && solo) {
    const lesson = /уро[кц]|индивидуал|частен|частни|\b(?:lesson|tuition|individual|private|one.to.one)\b/u.test(name)
    const language = /англий|немски|френски|испански|италиански|гръцки|турски|руски|български език|езиков|\b(?:english|german|french|spanish|italian|greek|turkish|russian|language)\b/u.test(name)
    if (lesson && language && !/пиано|китар|цигул|барабан|пеене|солфеж|математ|програмиран|\b(?:piano|guitar|violin|drum|singing|math|programming)\b/u.test(name)) return 'language-lesson'
    if (lesson && /цигул|\bviolin\b/u.test(name) && !/китар|пиано|барабан|флейт|виолончел|виола|\b(?:guitar|piano|drum|flute|cello|viola)\b/u.test(name)) return 'violin-lesson'
    if (lesson && /барабан|ударни инструменти|\b(?:drums?|percussion)\b/u.test(name) && !/китар|пиано|цигул|флейт|джембе|дарбука|конга|бонго|тимпан|маримба|кахон|\b(?:guitar|piano|violin|flute|djembe|darbuka|conga|bongo|timpani|marimba|cajon|tabla)\b/u.test(name)) return 'drums-lesson'
    if (lesson && /солфеж|музикална теория|\b(?:solf[eè]ge|music theory)\b/u.test(name) && !/пеене|пиано|китар|цигул|\b(?:singing|piano|guitar|violin)\b/u.test(name)) return 'music-theory-lesson'
    if (/шофьорск|кормуван|\b(?:driving lesson|driving course|refresher driving)\b/u.test(name) &&
      !/мотоцик|камион|автобус|ремарке|теория|\b(?:motorcycle|truck|bus|trailer|theory)\b|категория\s*(?:a|а|c|с|d|д|e|е)(?=$|[^\p{L}])/u.test(name)) return 'driving-lesson'
  }

  if (sport && adult && onsite && solo && !/консултац|оценка|изготвяне|програма|\b(?:consultation|assessment|plan preparation)\b/u.test(name)) {
    if (/карате|\bkarate\b/u.test(name) && !/кикбокс|джу|жиу|джудо|бокс|кунг|\b(?:kickbox\w*|bjj|judo|boxing|kung)\b/u.test(name)) return 'karate-training'
    if (/бразилск\p{L}* (?:джу|джиу|жиу|джи)\s*[- ]?\s*(?:джицу|жицу|джитсу)|\bbjj\b|\bbrazilian jiu[ -]?jitsu\b/u.test(name) &&
      !/джудо|бокс|карате|кикбокс|\b(?:judo|boxing|karate|kickboxing)\b/u.test(name)) return 'bjj-training'
    if (/силова тренировка|силови тренировки|тренировка с тежести|\b(?:strength training|weight training)\b/u.test(name) &&
      !/кардио|бокс|карате|йога|пилатес|кросфит|\b(?:cardio|boxing|karate|yoga|pilates|crossfit)\b/u.test(name)) return 'strength-training'
    if (/^(?:индивидуален урок по танци(?: за възрастни)?|урок по танци(?: за възрастни)?|(?:individual |private )?dance lesson)(?=$|[^\p{L}])/u.test(core) &&
      !/народн|гръц|балет|салса|бачата|хип.?хоп|пилон|\b(?:folk|greek|ballet|salsa|bachata|hip.?hop|pole)\b/u.test(name)) return 'dance-lesson'
  }

  if (auto) {
    if (/консултац|оферта|оценка|обучение|продажба|\b(?:consultation|quotation|estimate|training|sale)\b/u.test(name)) return null
    if (/газов\p{L}*|метанов\p{L}*|\b(?:lpg|cng)\b/u.test(name) && /проверка|преглед|\b(?:check|inspection)\b/u.test(name) &&
      !/монтаж|ремонт|смяна|бутилк|\b(?:installation|repair|replacement|cylinder)\b/u.test(name) && !NOT_CAR.test(name)) return 'vehicle-lpg-inspection'
    const technical = /технически преглед|(?:^|[^\p{L}])гтп(?=$|[^\p{L}])|\b(?:technical inspection|mot inspection)\b/u.test(name)
    if (technical && /мотоцик|категория\s*l\b|\bmotorcycle\b/u.test(name) && !/автомобил|ремарке|камион|\b(?:car|trailer|truck)\b/u.test(name)) return 'motorcycle-inspection'
    if (technical && !NOT_CAR.test(name) && !/ремарке|каравана|трактор|\b(?:trailer|caravan|tractor)\b/u.test(name)) return 'vehicle-technical-inspection'
    const replace = /смяна|подмяна|монтаж|\b(?:change|replacement|replace|installation)\b/u.test(name)
    if (replace && !NOT_CAR.test(name) && /въздуш\p{L}* филт[ъа]р|\b(?:engine )?air filter\b/u.test(name) &&
      !/купе|полен|салон|горив|маслен|масло|\b(?:cabin|pollen|fuel|oil)\b/u.test(name)) return 'car-air-filter-service'
    if (replace && !NOT_CAR.test(name) && /горив\p{L}* филт[ъа]р|\bfuel filter\b/u.test(name) &&
      !/въздуш|купе|полен|маслен|масло|\b(?:air|cabin|pollen|oil)\b/u.test(name)) return 'car-fuel-filter-service'
    if (/ремонт|смяна|подмяна|\b(?:repair|replacement)\b/u.test(name) && /ходова част|окачване|носач|шарнир|биалет|\b(?:suspension|control arm|ball joint|anti.roll link)\b/u.test(name) &&
      !NOT_CAR.test(name) && !/спирач|двигател|скорост|кормил|\b(?:brake|engine|gearbox|steering)\b/u.test(name)) return 'suspension-repair'
    return null
  }

  const dental = /дентал|зъболек|стоматол|\b(?:dental|dentist)\b/u.test(context) || business.primaryType === 'dentist' ||
    /зъб|стоматол|дентал|фотополимер|кариес|коренов\p{L}* (?:лечение|канал)|ортодонт|\b(?:dental|tooth|teeth|root canal|orthodont)\b/u.test(name)
  if (dental && !AUTO.has(category) && !home && onsite) {
    if (CHILD.test(name) && /преглед|зъболекар|\b(?:exam|check.up|dentist)\b/u.test(name) &&
      !/възрастни|пломб|лечение|вадене|изваждане|почистване|\b(?:adult|filling|treatment|extraction|cleaning)\b/u.test(name)) return 'child-dental-exam'
    if (adult && /консултац|\bconsultation\b/u.test(name) && /имплант|\bimplant\b/u.test(name) &&
      !/постав|операц|хирург|изважд|вадене|синус|\b(?:placement|surgery|surgical|extraction|sinus)\b/u.test(name)) return 'dental-implant-consultation'
    if (adult && /ортодонт|\borthodont/u.test(name) && /консултац|първичен преглед|\b(?:consultation|initial examination)\b/u.test(name) &&
      !/постав|корекц|активира|лечение|\b(?:fitting|adjustment|activation|treatment)\b/u.test(name)) return 'orthodontic-consultation'
    if (adult && /коренов\p{L}* лечение|лечение на коренов\p{L}* канал|ендодонтско лечение|\broot canal treatment\b/u.test(name) &&
      !/консултац|преглед|пломб|корон|хирург|млечен|\b(?:consultation|examination|filling|crown|surgery|baby tooth)\b/u.test(name)) return 'dental-root-canal'
    if (adult && /пломб|обтурац|лечение на кариес|\b(?:dental filling|cavity filling)\b/u.test(name) &&
      !/корен|канал|ендодонт|инлей|онлей|фасет|корон|протез|млечен|консултац|преглед|оценка|\b(?:root|canal|inlay|onlay|veneer|crown|denture|baby tooth|consultation|exam|assessment)\b/u.test(name)) return 'dental-filling'
    return null
  }

  const psychology = /психолог|психотерап|\bpsycholog|\bpsychotherap/u.test(`${name} ${context}`)
  if (psychology && onsite && !/emdr|хипно|арт.?терап|игров|пясъч|логопед|психиатр|диагност|тест|оценка|\b(?:hypnos|art therapy|play therapy|sand|speech|psychiatr|assessment|test)\b/u.test(name)) {
    const counselling = /консултац|терапия|сесия|среща|\b(?:counselling|counseling|therapy|session|appointment)\b/u.test(name)
    if (counselling && /двойк|\bcouples?\b/u.test(name) && adult && !/семей|родител|груп|\b(?:family|parent|group)\b/u.test(name)) return 'couples-counselling'
    if (counselling && /семейн|\bfamily\b/u.test(name) && !/двойк|родителск|за родители|груп|без деца|само възрастни|\b(?:couples?|parent.only|group|without children|adult.only)\b/u.test(name)) return 'family-counselling'
    if (counselling && CHILD.test(name) && !/родител|семей|двойк|груп|беб|кърмач|\b(?:parent|family|couple|group|baby|infant)\b/u.test(name)) return 'child-psychology'
    return null
  }

  if ((salon || category === 'health' || primary === 'health') && !/консултац|обучение|курс|продажба|\b(?:consultation|training|course|sale)\b/u.test(name)) {
    if (adult && /сваляне|премахване|отстраняване|\bremoval\b/u.test(name) && /мигл|\blash/u.test(name) &&
      !/вежд|грим|маникюр|нови мигли|поставяне|\b(?:brow|makeup|manicure|new lashes|application)\b/u.test(name)) return 'lash-removal'
    if (adult && /микродермабраз|диамантено дермабраз|\bmicrodermabrasion\b/u.test(name) &&
      !/водно|хидра|гръб|тяло|лазер|игл|пилинг|\b(?:aqua|hydra|back|body|laser|needl|peel)\b/u.test(name)) return 'microdermabrasion'
    if (adult && /масаж на лице|масаж на лицето|\bfacial massage\b/u.test(name) &&
      !/букал|скалп|глава|стъпал|крака|тяло|почистване|пилинг|апарат|вендуз|камън|\b(?:buccal|scalp|head|feet|body|cleansing|peel|machine|cupping|stones?)\b/u.test(name)) return 'facial-massage'
    if (adult && /парафин|\bparaffin\b/u.test(name) && /ръце|длани|\bhands?\b/u.test(name) &&
      !/крака|стъпал|маникюр|педикюр|\b(?:feet|foot|manicure|pedicure)\b/u.test(name)) return 'paraffin-hand-treatment'
    if (adult && /пресотерап|\bpressotherapy\b/u.test(name) && !/ръце|лице|глава|корем|торс|\b(?:arms?|hands?|face|head|abdomen|torso)\b/u.test(name)) return 'pressotherapy'
    if (adult && solo && /масаж.*(?:горещи|топли|вулканични) камъни|\bhot stone massage\b/u.test(name) &&
      !/лице|скалп|глава|стъпал|крака|крак|ръце|бедра|шия|бремен|\b(?:face|scalp|head|foot|feet|legs?|arms?|neck|pregnan)\b/u.test(name)) return 'hot-stone-massage'
    if (adult && /ултразвук|ултразвуков|\bultrasonic\b/u.test(name) && /лице|шпатула|пилинг|\b(?:facial|spatula|peeling)\b/u.test(name) &&
      !/hifu|хи.?фу|кавитац|диагност|изследван|тяло|корем|гръб|\b(?:cavitation|diagnostic|scan|body|abdomen|back)\b/u.test(name)) return 'facial-ultrasound'
  }

  if (home) {
    if (/консултац|оглед|оферта|диагност|обучение|курс|продажба|\b(?:consultation|inspection|estimate|diagnostic|training|course|sale)\b/u.test(name)) return null
    if (/монтаж|инсталиране|свързване|\b(?:installation|connection)\b/u.test(name) && /пералн|съдомиял|\b(?:washing machine|dishwasher)\b/u.test(name) &&
      !/ремонт|диагност|изграждане|фурн|газов|индустриал|промишлен|\b(?:repair|diagnostic|rewiring|oven|gas|industrial)\b/u.test(name)) return 'household-appliance-installation'
    if (/боядисване|\bpainting\b/u.test(name) && /стен|латекс|\b(?:walls?|emulsion)\b/u.test(name) &&
      !/таван|покрив|врат|мебел|фасад|кола|авто|\b(?:ceiling|roof|door|furniture|facade|car|vehicle)\b/u.test(name)) return 'wall-painting'
    if (/климатик|\b(?:air conditioner|split ac|aircon)\b/u.test(name) && /почистване|профилактика|\b(?:cleaning|maintenance)\b/u.test(name) &&
      !/авто|монтаж|ремонт|демонтаж|зарежд|индустриал|промишлен|касет|канален|колонен|чилър|външно тяло|\b(?:car|installation|repair|removal|recharge|industrial|cassette|ducted|chiller|outdoor unit)\b/u.test(name)) return 'home-aircon-service'
  }
  // Unrecognized techniques and mixed activity bundles use the caller's
  // neutral photo, never an invented exact service or a category emoji.
  return null
}
