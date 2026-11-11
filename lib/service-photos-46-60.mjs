export const SERVICE_PHOTO_46_TO_60_IDS = Object.freeze([
  'full-hair-color', 'formal-updo', 'hair-curling', 'hair-washing', 'hair-highlights',
  'male-manicure', 'medical-pedicure', 'nail-art', 'nail-refill', 'lash-lift',
  'brow-lamination', 'brow-tint', 'microblading', 'hydrafacial', 'chemical-peel',
])

const BEAUTY_CATEGORIES = new Set(['beauty', 'hair', 'barber', 'nails'])
const OTHER_DOMAINS = new Set(['pets', 'auto', 'auto_repair', 'car_wash', 'detailing', 'education', 'fitness', 'home_services', 'consulting'])
const HAIR_COLOR = /^(?:(?:майстор\s*·\s*)?(?:цялостно\s+)?боядисване(?:\s+с\s+balmain)?(?:\s*(?:·|[-–—])\s*|\s+)(?:на\s+)?(?:(?:цяла(?:та)?|цялата дължина на|къса|средна|дълга)\s+)?коса(?:та)?|боядисване(?:\s+с\s+balmain)?\s*(?:·|[-–—])\s*средна дължина|(?:full(?:[ -]head|[ -]length)?|all[ -]over|single[ -]process) (?:hair )?colou?r(?:ing)?)(?=$|[^\p{L}])/u
const OTHER_COLOR = /корен|изрус|избел|обезцвет|кичур|балеаж|омбре|тонира|матира|вежд|мигл|брад|мъжк|за мъже|(?:^|[^\p{L}])(?:roots?|bleach|highlights?|balayage|ombre|toner|brows?|lashes|beard|men['’]?s|male)(?=$|[^\p{L}])/u
const UPDO = /(?:^|[^\p{L}])(?:(?:прибрана|вдигната) прическа|прическа (?:на|с) кок|кок|(?:formal |bridal )?up[ -]?do|hair bun)(?=$|[^\p{L}])/u
const CURLING_IRON = /^(?:(?:стайлинг|оформяне|прическа|къдрене|къдрици|вълни)(?: на коса)? с маша|(?:hair )?curling(?: with (?:a )?curling iron)?|curling[ -]iron (?:styling|curls)|(?:styling|curls) with (?:a )?curling iron)(?=$|[^\p{L}])/u
const WASH = /^(?:измиване на коса(?:та)?|(?:салонно |масажно )?измиване|(?:salon )?(?:hair wash(?:ing)?|hair shampoo|shampoo wash))$/u
const FOIL_HIGHLIGHTS = /^(?:кичури (?:на|с) фолио|(?:hair )?(?:foil highlights?|highlights? (?:using|with) foils?))(?=$|[^\p{L}])/u
const OTHER_HIGHLIGHTS = /шапк|балеаж|омбре|кератин|екстенш|\b(?:cap|balayage|ombre|keratin|extensions?)\b/u

const MEN_MANICURE = /^(?:(?:класически )?мъжки маникюр|маникюр за мъже|(?:(?:classic|natural) )?(?:men['’]?s|male) manicure)(?=$|[^\p{L}])/u
const MEDICAL_PEDICURE = /^(?:(?:медицински|мед|med|терапевтичен|подологичен) педикюр|(?:medical|therapeutic|podiatry) pedicure)(?=$|[^\p{L}])/u
const NAIL_ART = /^(?:(?:ръчно )?рисуван[аи] декораци[яи]|декораци[яи](?: на (?:(?:\d+|всички) )?(?:нокът|нокътя|нокти(?:те)?))?|(?:hand[ -]painted )?nail art)$/u
const REFILL = /^(?:поддръжка на (?:ноктопластика|изграждане|изградени нокти|гел(?: и гел[ -]лак)?)|поддръжка с (?:твърд |изграждащ )?гел|ноктопластика\s*[·:–—-]\s*поддръжка|поддръжка(?:\s+\(корекция\))?\s*[·:–—-]\s*(?:(?:къси|(?:средно )?дълги) нокти)|(?:gel|builder[ -]gel|nail|nail[ -]extension) (?:infill|refill|fill))(?=$|[^\p{L}])/u
const OTHER_REFILL = /педикюр|естествени нокти|укрепва|ремонт|счупен|сваляне|отстраняван|премахван|акрил|акригел|полигел|френски|омбре|мигли|вежди|\b(?:pedicure|natural nails|overlay|repair|broken|removal|acrylic|polygel|french|ombre|lashes|brows?)\b/u

const LASH_LIFT = /^(?:(?:корейско )?(?:ламиниране|лифтинг)(?: и боядисване)? на мигли|лаш лифт|(?:(?:korean )?lash lift|(?:eye)?lash lamination))(?=$|[^\p{L}])/u
const BROW_LAMINATION = /^(?:(?:оформяне, боядисване и |оформяне и )?ламиниране на вежди|ламиниране, оформяне и боядисване на вежди|лифтинг на вежди|(?:eye)?brow lamination|brow lift)(?=$|[^\p{L}])/u
const BROW_TINT = /^(?:(?:оформяне и )?(?:боядисване|оцветяване) на вежди|(?:eye)?brow tint(?:ing)?)(?=$|[^\p{L}])/u
const MICROBLADING = /^(?:микроблейдинг(?: на вежди)?|(?:(?:eye)?brow )?microblading)(?=$|[^\p{L}])/u
const HYDRAFACIAL = /^(?:hydra[ -]?facial|хидра[ -]?фейшъл|(?:аква[ -]?пилинг|хидропилинг)(?: на лице)?|(?:хидратиращо )?водно почистване на лице|aqua[ -]?peel facial|hydrodermabrasion(?: facial)?)(?=$|[^\p{L}])/u
const CHEMICAL_PEEL = /^(?:химичен пилинг(?: на лице)?|(?:facial )?chemical peel(?: on face)?|(?:пилинг\s+)?(?:biorepeel(?:cl3)?|mesopeel(?:\s+(?:jessner pro|blemiskin|melanostop tran3x))?|enerpeel|pq[ -]age)|почистване с biorepeel(?:cl3)?)(?=$|[^\p{L}])/u
const OTHER_PEEL = /околооч|около оч|eyecon|\b(?:eyes?|eye[ -]area)\b|игл|микронидлинг|дермапен|лазер|карбонов|въглерод|ултразвук|механич|ензим|тяло|гръб|устни|шия|деколте|ръце|\b(?:needl\w*|carbon|laser|ultrasound|mechanical|enzyme|body|back|lips?|neck|décolletage|hands?)\b/u

export function approvedServicePhoto46To60({ name, context, category, artKind } = {}) {
  if (typeof name !== 'string' || !name) return null
  const business = context?.business ?? context
  const domains = [category, business?.category, business?.businessCategory, business?.industry]
  if (domains.some(value => OTHER_DOMAINS.has(value)) || ['pet-care', 'dog-grooming'].includes(artKind) ||
    /ветеринар|кучеш|куче|котеш|котка|грум|\b(?:veterinary|dogs?|cats?|pupp(?:y|ies)|pets?|grooming)\b/u.test(name)) return null

  const [core] = name.split(/\s*·\s*/u, 1)
  const hair = domains.some(value => BEAUTY_CATEGORIES.has(value)) || ['haircut', 'hair-colour'].includes(artKind) || /коса|прическа|\bhair\b/u.test(name)
  if (hair && HAIR_COLOR.test(name) && !OTHER_COLOR.test(name) && !/подстриг|haircut|\//u.test(name)) return 'full-hair-color'
  // An event alone does not specify an updo, and unqualified highlights may
  // use a cap. Only illustrate the pictured technique when the title says it.
  if (hair && UPDO.test(name) && !/плитк|разпуснат|къдрици|маша|преса|перук|екстенш|\/|(?:^|[^\p{L}])(?:braids?|loose|curls?|extensions?|or|или)(?=$|[^\p{L}])/u.test(name)) return 'formal-updo'
  if (hair && CURLING_IRON.test(core) && !/преса|изправя|химич|студено къдрене|екстенш|\b(?:perms?|flat[ -]?iron|straighten\w*|extensions?)\b|\//u.test(name) &&
    (!/^(?:hair )?curling$/u.test(core) || /curling iron/u.test(name))) return 'hair-curling'
  if (hair && WASH.test(core) && (category === 'hair' || /коса|\bhair\b|\bshampoo\b/u.test(name)) &&
    !/сешоар|терапия|кератин|подстриг|боядис|стайлинг|балеаж|\b(?:blowdry|blow dry|blowout|treatment|haircut|colou?r|balayage)\b/u.test(name)) return 'hair-washing'
  if (hair && FOIL_HIGHLIGHTS.test(core) && !OTHER_HIGHLIGHTS.test(name)) return 'hair-highlights'

  // “Без лак” is consistent with the photo; polish application, specialist
  // treatment, and combined hand/foot services are separate activities.
  const polishScope = name.replace(/без (?:гел[ -]?лак|лак|гел)|without (?:gel polish|polish|gel)/gu, '')
  if (MEN_MANICURE.test(core) && !/педикюр|медицин|укрепва|гел|лак|ноктопласт|парафин|(?:^|[^\p{L}])спа(?=$|[^\p{L}])|\b(?:pedicure|gel|polish|medical|spa|acrylic|paraffin|extensions?)\b/u.test(polishScope)) return 'male-manicure'
  if (MEDICAL_PEDICURE.test(core) && !/маникюр|операц|впит|гъбич|обработка само|(?:^|[^\p{L}])лазер|\b(?:manicure|surger\w*|ingrown|fung\w*|laser)\b/u.test(name)) return 'medical-pedicure'
  if ((category === 'nails' || /нок[ът]|\bnail\b/u.test(core)) && NAIL_ART.test(core) &&
    !/стикер|печат|фолио|брокат|сухи цветя|френски|омбре|педикюр|\b(?:stickers?|stamping|foil|glitter|dried flowers|french|ombre|pedicure)\b/u.test(name)) return 'nail-art'
  if (REFILL.test(name) && !OTHER_REFILL.test(name)) return 'nail-refill'

  if (LASH_LIFT.test(core) && !/вежд|свалян|отстраняван|екстенш|\b(?:brows?|removal|extensions?)\b/u.test(name)) return 'lash-lift'
  if (BROW_LAMINATION.test(core) && !/мигл|конец|восък|микроблейд|премахван|ретуш|\b(?:lashes|threading|wax|microblading|removal|touch[ -]?up)\b/u.test(name)) return 'brow-lamination'
  if (BROW_TINT.test(core) && !/ламинир|лифтинг|мигл|конец|къна|перманент|микроблейд|свалян|\b(?:lamination|lift|lashes|threading|henna|permanent|microblading|removal)\b/u.test(name)) return 'brow-tint'
  if (MICROBLADING.test(core) && !/премахван|отстраняван|корекция|ретуш|лазер|устни|вежди и|\b(?:removal|correction|retouch|touch[ -]?up|laser|lips?)\b/u.test(name)) return 'microblading'
  if (HYDRAFACIAL.test(core) && !/лазер|микронидл|околооч|тяло|гръб|\b(?:laser|microneedl\w*|eye[ -]area|body|back)\b/u.test(name)) return 'hydrafacial'
  if (CHEMICAL_PEEL.test(core) && !OTHER_PEEL.test(name)) return 'chemical-peel'
  return null
}
