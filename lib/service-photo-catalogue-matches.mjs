import { normalizeSearchText } from './discovery/categories.mjs'

// Reviewed semantic aliases for already-approved photographs. These rules do
// not use a business category as a substitute for the named activity, change
// catalogue data, or associate an illustrative frame with a business's work.
// Keep the precise, original photo rules ahead of this supplemental matcher.
const SALON = new Set(['beauty', 'hair', 'barber', 'nails'])
const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const CHILD = /детск|дете|деца|беб|юнош|младеж|тийнейдж|малолет|непълнолет|(?:от|над|под)\s*(?:[0-9]|1[0-7])\s*(?:г\.?|год)|\b(?:child|children|kids?|teen\w*|pa?ediatric|baby)\b/u
const REMOTE = /онлайн|дистанц|видео\s*(?:връз|срещ)|\b(?:online|remote|virtual|video)\b/u
const ANIMAL = /ветеринар|кучеш|куче|котеш|котка|гризач|заек|грум|\b(?:dogs?|cats?|pets?|veterinary|grooming|rabbit|rodent)\b/u
const NOT_CAR = /мотоцик|мотопед|велосип|скутер|камион|автобус|\bтир\b|караван|ремарке|трактор|лодк|яхт|\b(?:motorcycl\w*|mopeds?|bicycl\w*|bikes?|scooters?|trucks?|buses?|trailers?|caravans?|tractors?|boats?|yachts?)\b/u
const NAMED_MUSIC = /пиано|китар|барабан|ударн|перкуси|флейт|цигул|акордеон|саксофон|тромпет|тромбон|кларинет|обой|валдхорн|укулеле|виол|контрабас|солфеж|хармония|пеене|вокал|груп|\b(?:piano|guitar|drums?|percussion|flute|violin|accordion|saxophone|trumpet|trombone|clarinet|oboe|horn|ukulele|viola|cello|bass|solfege|harmony|vocal|singing|group)\b/u
const TWO_ACTIVITIES = /\s(?:и|\+|или)\s|\s\/\s|\b(?:and|with|or)\b/u
const PANEL_PAINT = /^(?:(?:пре)?боядисване на (?:(?:един|1) )?(?:автомобилен )?детайл|(?:(?:car|automotive|vehicle) )?panel (?:spray[ -]?)?(?:paint(?:ing)?|repaint(?:ing)?)|(?:spray[ -]?)?(?:paint(?:ing)?|repaint(?:ing)?) (?:of )?(?:(?:a|one) )?(?:(?:car|automotive|vehicle) )?panel)$/u
const OTHER_PANEL_ACTIVITY = /коса|корен|вежд|мигл|брад|нок[ът]|стен|таван|мебел|дърв|врат|спирач|апарат|джант|колел|фар|стъкло|фоли|керами|полир|прахов|електростатич|тенекедж|изчук|ремонт|подготов|цялостно|целия автомобил|цяла кола|без боя|без боядисване|\b(?:hair|roots?|brows?|lashes|beard|nails?|walls?|ceilings?|furniture|wood|doors?|brakes?|calipers?|wheels?|rims?|headlights?|glass|wrap|ppf|ceramic|polish\w*|powder|electrostatic|bodywork|repair|preparation|pdr|whole car|full respray|without paint)\b/u
const nonempty = value => typeof value === 'string' ? normalizeSearchText(value) : ''

export function catalogueServicePhotoKind(service, business = {}) {
  const name = nonempty(service?.name)
  if (!name) return null
  const category = service?.category || business?.businessCategory || business?.category || business?.industry || 'other'
  const primary = business?.businessCategory || business?.category || business?.industry || 'other'
  const context = `${nonempty(business?.name)} ${nonempty(business?.description)} ${nonempty(business?.public_profile?.description?.bg)}`
  const [core] = name.split(/\s*·\s*/u, 1)
  // Quantity, appointment length and provider qualifiers may follow a middle
  // dot; all exclusion checks still inspect the full, unshortened name.
  const salon = SALON.has(category) || SALON.has(primary)
  const auto = AUTO.has(category) || AUTO.has(primary) || business?.industry === 'auto'
  const home = category === 'home_services' || primary === 'home_services'
  const education = category === 'education' || primary === 'education'
  const barber = category === 'barber' || primary === 'barber'
  // Existing species-specific photos are intentionally not generalized to all
  // pets, breeds or unspecified animal menus.
  if (category === 'pets' || primary === 'pets' || business?.industry === 'pets' || ANIMAL.test(name)) return null

  // A generic native service needs vehicle evidence as well as this named
  // activity. The reviewed frame depicts painting a car body panel, not dent
  // repair, calipers, a wrap, household painting or an unspecified bundle.
  const panelDetails = `${name} ${nonempty(service?.description)}`
  if (PANEL_PAINT.test(core) && (auto || /автомобилен|\b(?:car|automotive|vehicle)\b/u.test(core)) &&
    ![category, primary, business?.industry].some(value => SALON.has(value) || ['home_services', 'education', 'fitness', 'consulting', 'health'].includes(value)) &&
    !NOT_CAR.test(panelDetails) && !ANIMAL.test(panelDetails) && !OTHER_PANEL_ACTIVITY.test(panelDetails) && !TWO_ACTIVITIES.test(name)) return 'sx-auto-panel-spray-paint'

  if (salon) {
    const hair = ['hair', 'barber'].includes(category) || ['hair', 'barber'].includes(primary) || /коса|причес|\bhair\b/u.test(name)
    const hairConflict = /вежд|мигл|брад|балеаж|омбре|изрус|избел|обезцвет|кичур|\b(?:brows?|lashes|beard|balayage|ombre|bleach|highlights?)\b/u
    if (!CHILD.test(name)) {
      if (/^(?:боядисване\s+(?:с\s+)?(?:dia|illumina|inoa|koleston|color touch)|боя q10)(?=$|[^\p{L}])/u.test(core) &&
        !hairConflict.test(name) && !/корен|мъж|подстриг|\b(?:roots?|men|male|haircut)\b/u.test(name)) return 'full-hair-color'
      if (/^(?:гланциране|тониране|матиране)(?: на коса)?$/u.test(core) && !hairConflict.test(name) && !/подстриг|корен|\b(?:haircut|roots?)\b/u.test(name)) return 'hair-toning'
      if (hair && /^(?:(?:специална|пробна|официална|вечерна|абитуриентска|сватбена) прическа|(?:trial|formal|evening|special occasion|wedding) hairstyle)$/u.test(core) &&
        !/екстенш|плитк|перук|маша|преса|кок|\b(?:extension|braid|wig|curling iron|flat iron|updo)\b/u.test(name)) return 'formal-event-hairstyle'
      if (barber && /^(?:(?:мъжко )?подстригване(?: с машинка)?\s*\(?\s*(?:с\s*)?(?:един|1)\s*номер\s*\)?|one[ -]guard buzz cut)$/u.test(core) &&
        !/брада|вежд|ножиц|бръсн|\b(?:beard|brow|scissors|shave)\b/u.test(name)) return 'one-guard-buzz-cut'
      if (barber && /^(?:подстригване|освежаване на подстригване|класическо мъжко подстригване)$/u.test(core) &&
        !/брада|вежд|ножиц|бръсн|боядис|един номер|\b(?:beard|brow|scissors|shave|colour|one guard)\b/u.test(name)) return 'mens-haircut'
      if (barber && /^(?:(?:комбо(?: пакет)?|пакет)\s*[·:–—-]?\s*)?(?:коса и брада|подстригване на коса и брада)$/u.test(core) &&
        !/вежд|нос|уши|бръсн|боядис|\b(?:brow|nose|ears?|shav|colour)\b/u.test(name)) return 'haircut-beard-combo'
      if (barber && /^(?:бръснене на глава(?:та)? с бръснач|head shave with (?:a )?razor)$/u.test(core) && !/брада|шейвър|\b(?:beard|shaver)\b/u.test(name)) return 'head-shave'
      if (barber && /^(?:(?:оформяне|контуриране)(?: или контуриране)? на (?:дълга |къса )?брада|(?:long |short )?beard shaping)$/u.test(core) &&
        !/боядис|бръсн|коса|вежд|\b(?:colour|tint|shav|haircut|brow)\b/u.test(name)) return 'beard-trim'
    }
    // Natural nail filing can illustrate an express conventional manicure,
    // not an unspecified luxury/brand procedure or a gel/extension service.
    if (!CHILD.test(name) && /^(?:(?:speedy|бърз|експресен) маникюр(?:\s*[–—-]\s*класически)?|express (?:classic )?manicure)$/u.test(core) &&
      !/гел|лак|свалян|апарат|френск|спа|\b(?:gel|polish|removal|machine|french|spa)\b/u.test(name)) return 'classic-manicure'
    if (!CHILD.test(name) && /^(?:бърз педикюр\s*[–—-]\s*класически|express classic pedicure)$/u.test(core) &&
      !/гел|лак|апарат|медицин|\b(?:gel|polish|machine|medical)\b/u.test(name)) return 'classic-pedicure'
    if (/^(?:гел лак|гел[ -]лак без сваляне|gel polish)$/u.test(core) &&
      !/крака|педикюр|свалян|ноктопласт|френск|декор|укреп|израв|\b(?:toes?|feet|pedicure|removal|extension|french|art|overlay)\b/u.test(name.replace(/без сваляне|without removal/gu, ''))) return 'gel-manicure'
    if (/^(?:гел лак на крака|гел лак на краката|toenail gel polish)$/u.test(core) && !/свалян|френск|декор|\b(?:removal|french|art)\b/u.test(name)) return 'gel-pedicure'
    if (/^(?:сваляне на гел лак(?: без оформяне)?|gel polish removal)$/u.test(core) &&
      !/ноктопласт|акрил|твърд гел|педикюр|\b(?:extension|acrylic|hard gel|pedicure)\b/u.test(name)) return 'nail-gel-removal'
    if (/^(?:водно ?дермабразио|воднодермабразио|aqua dermabrasion)(?=$|[^\p{L}])/u.test(core) &&
      !/диамант|микро|тяло|гръб|\b(?:diamond|micro|body|back)\b/u.test(name)) return 'hydrafacial'
  }

  if (auto) {
    if (NOT_CAR.test(name)) return null
    if (/^(?:баланс(?:иране)? на гум[аи]|баланс(?:иране)? на автомобилни гуми|(?:tyre|tire) balancing)(?=$|[^\p{L}])/u.test(core) &&
      !/реглаж|мотоцик|камион|\b(?:alignment|motorcycle|truck)\b/u.test(name)) return 'tyre-change'
    if (/^(?:(?:вип )?външно (?:измиване|почистване)(?: на (?:(?:лек )?автомобил|кола|джип))?|exterior (?:car )?wash)$/u.test(core) &&
      !/безконтакт|безвод|водостру|пара|автомат|самообслуж|вътреш|камион|тир|rinseless|\b(?:touchless|waterless|pressure|steam|automatic|interior|truck)\b/u.test(name)) return 'car-exterior-hand-wash'
    if (/^(?:(?:интериорно почистване|почистване на интериор|интериорно освежаване|мобилно вътрешно почистване)(?: на автомобил|\s*[–—-]\s*експрес)?|interior (?:car )?cleaning)$/u.test(core) &&
      !/външн|екстериор|пране|дезинф|озон|кожа|импрег|вакса|\b(?:exterior|shampoo|ozone|disinfect|leather|coating|wax)\b/u.test(name)) return 'car-interior-detailing'
    if (/^(?:керамика(?:\s*[–—-]\s*\d+\s*годин[аи])?|керамичн[ао] (?:защита|покритие)(?: (?:на|за) (?:лек )?автомобил)?|ceramic coating(?: for (?:a )?car)?)$/u.test(core) &&
      !/салон|стъкл|джант|фар|кожа|пластмас|врат|седалк|полир|ауспух|двигател|\b(?:interior|glass|wheel|headlight|leather|plastic|door|seat|polish|exhaust|engine)\b/u.test(name)) return 'ceramic-car-coating'
    return null
  }

  if (home) {
    if (/^(?:(?:еднократно |абонаментно |стандартно |основно |поддържащо )+почистване)(?: на (?:дома|жилище|гарсониера|(?:едностаен|двустаен|тристаен|многостаен) апартамент|апартамент|къща))?$/u.test(core) &&
      !/ремонт|офис|фасад|прозор|стъкл|диван|матрак|стол|килим|мебел|дезинф|климат|фурн|печк|\b(?:renovation|office|commercial|window|sofa|mattress|chair|carpet|furniture|disinfect|aircon|oven)\b/u.test(name)) return 'home-deep-clean'
    if (/^(?:почистване|измиване|миене) на (?:стъкла|прозорци)(?=$|[^\p{L}])/u.test(core) &&
      !/авто|височин|след ремонт|фасад|дограма|щор|витрин|външн|\b(?:car|high rise|renovation|facade|frame|blind|exterior)\b/u.test(name)) return 'window-cleaning'
    if (/^(?:двустранно )?пране на матрак(?=$|[^\p{L}])/u.test(core) && !/дезинф|антиакар|пара|ензим|\b(?:disinfect|steam|enzyme)\b/u.test(name)) return 'mattress-cleaning'
    return null
  }

  if (education) {
    if (/^(?:музикален урок|урок по музика|music lesson)(?=$|[^\p{L}])/u.test(core) && !CHILD.test(name) && !REMOTE.test(name) &&
      !NAMED_MUSIC.test(name)) return 'music-lesson-choice'
    return null
  }

  const psychologyContext = /психолог|психотерап|psycholog|psychotherap/u.test(`${name} ${context}`)
  if (psychologyContext && !CHILD.test(name) && !/семей|двойк|родител|груп|констелац|emdr|хипноз|психиатр|психодиагност|тест|арт[ -]?терап|игро[ -]?терап|пясъч|пясък|психодрам|неврофийд|биофийд|\b(?:family|couples?|parents?|group|hypnos|psychiatr|testing|art therapy|play therapy|sand ?play|psychodrama|neurofeedback|biofeedback)\b/u.test(name)) {
    const session = /^(?:(?:индивидуалн[ао]|първ[ао]|последващ[ао]|първоначалн[ао]) )?(?:психотерапевтична сесия|психологическа сесия|психологична сесия|психотерапия(?: за възрастни)?|сесия|терапия|консултация|психологическо консултиране|психологично консултиране)(?=$|[^\p{L}])|^(?:individual |adult )?(?:psychotherapy|psychological (?:session|counselling|consultation))(?=$|[^\p{L}])/u.test(core)
    if (session && !TWO_ACTIVITIES.test(core) && !/на адрес|у дома|\bhome visit\b/u.test(name)) return REMOTE.test(name) ? 'online-psychology-session' : 'psychology-consultation'
  }
  if (category === 'health' || primary === 'health' || SALON.has(category)) {
    if (!CHILD.test(name) && !REMOTE.test(name) && /^(?:(?:индивидуалн[ао] |пакет \d+ )?кинезитерап(?:ия|евтични процедури|евтична процедура))$/u.test(core) &&
      !/апарат|ток|лазер|игл|оператив|гръб|кръст|врат|крак|\b(?:machine|electro|laser|needl|postoperative|back|neck|leg)\b/u.test(name)) return 'physiotherapy'
    if (!CHILD.test(name) && !REMOTE.test(name) && /^(?:(?:антистрес|релакс|релаксиращ|класически|цялостен|частичен) (?:и релакс )?масаж|аромамасаж(?: с масла)?)(?=$|[^\p{L}])/u.test(core) &&
      !/лице|скалп|глава|крака|ръце|стъпал|ходил|бремен|апарат|ролер|вендуз|камън|лимф|антицелул|лечеб|\b(?:face|scalp|head|legs?|arms?|feet|foot|pregnan|machine|roller|cupping|stone|lymph)\b/u.test(name)) return 'massage'
    if (/^(?:иглотерапия|акупунктурна терапия|acupuncture therapy)$/u.test(core) && !/електро|мокса|вендуз|\b(?:electro|moxa|cupping)\b/u.test(name)) return 'acupuncture'
  }
  return null
}
