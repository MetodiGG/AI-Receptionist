export const MID_SERVICE_PHOTO_IDS = Object.freeze([
  'massage', 'auto-diagnostics', 'oil-change', 'interior-car-clean', 'math-lesson',
  'pet-bath', 'plumbing', 'dental-cleaning', 'boxing', 'tennis',
])

const whole = pattern => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${pattern})(?=$|[^\\p{L}\\p{N}])`, 'u')
const AUTO = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const CAR = /автомобил|автодиагност|автодетайл|\b(?:car|cars|vehicle|automotive)\b/u
const ANIMAL = /ветеринар|куче|кучет|кучеш|котк|котеш|гризач|домашен любимец|\b(?:dogs?|canine|pupp(?:y|ies)|cats?|feline|pets?|rodents?|veterinary)\b/u
const DOG = /куче|кучет|кучеш|\b(?:dogs?|canine|pupp(?:y|ies))\b/u
const OTHER_ANIMAL = /котк|котеш|гризач|заек|зайц|\b(?:cats?|feline|kittens?|rodents?|rabbits?|guinea pigs?)\b/u
const CHILD = /детск|деца|беб|юнош|\b(?:kids?|child(?:ren)?|youth|junior|bab(?:y|ies))\b/u

const MASSAGE = whole('масаж(?:и|на|ни)?|massages?')
const BACK_MASSAGE = /класическ|релаксиращ|\brelax(?:ing|ation)\b|\bswedish\b|\bclassic(?:al)?\b|(?:на |за )?гръб|рамен|цяло тяло|цялостен масаж|\b(?:full[ -]body|back|shoulders?)\b/u
const OTHER_MASSAGE = /лице|скалп|ходил|стъпал|длан|ръце|крака|крайниц|деколте|глава|бремен|масажн[аои] (?:вана|стол|уред)|камъ|апарат|лимф|рефлексолог|шиацу|тайланд|антицелул|медицинск|физиотерап|терапевтичен|дълбокотъкан|лечеб|спортен|миофасц|пилинг|почистван|игло|вендуз|мокса|акупункт|\b(?:facial|face|head|scalp|feet|foot|hand|hands|leg|legs|limbs?|pregnan\w*|prenatal|stones?|device|lymph\w*|reflexology|thai|shiatsu|deep tissue|sports|medical|physiotherapy|peel\w*|cupping|acupuncture|dry needling)\b/u

const DIAGNOSTICS = whole('автодиагностик[аи]|диагностик[аи]|diagnostics?|obd(?:[ -]?(?:ii|2))?')
const SCAN = /компютърн\p{L}* диагностик|откриване на грешки|грешки в електронн|\b(?:obd|scan tool|code scan(?:ning)?|computer diagnostics?)\b/u
const OTHER_DIAGNOSTICS = /ремонт|смяна|демонтаж|монтаж|перал|сушил|фурн|ходов|окачван|турбо|автоклимат|климатик|фреон|сензор|датчик|каросер|гуми|дентал|зъб|кожа|психо|логопед|\b(?:repair|replace\w*|turbo|sensor|suspension|air condition\w*|appliance|washing machine|dental|skin)\b/u
const OIL_CHANGE = /смяна\s+(?:на\s+)?(?:двигателн[оо]\s+)?масло|\b(?:engine[ -])?oil[ -](?:and filter[ -])?change\b|\bchang(?:e|ing) (?:the )?(?:engine )?oil\b/u
const ENGINE_OIL = /двигателно масло|масло на двигателя|\bengine oil\b/u
const OTHER_OIL = /скоростн|трансмис|раздатъч|диференциал|хидравл|спирач|диагност|съединител|автоклимат|мотоцик|морск|лодк|трактор|\b(?:dsg|cvt|haldex|atf|transmission|gearbox|gear oil|transfer case|differential|hydraulic|brake|diagnostics?|clutch|motorcycle|marine|boat|tractor)\b/u

const CAR_INTERIOR = /салон|интериор|седалк|тапицери|\b(?:interior|upholstery|seats?|cabin)\b/u
const EXTRACTION = /пран\p{L}*|шампоан\p{L}*|мокро почистване|екстракц\p{L}*|\b(?:shampoo\w*|extract\w*|wet clean\w*)\b/u
const OTHER_CAR_CLEANING = /екстериор|сухо почистване|прахосмукачка само|полиране|фолиран|защитно покритие|смяна на масл|\b(?:exterior|dry clean\w*|vacuum only|polish\w*|wrap\w*|coating|oil change)\b/u

const MATH = whole('математик[аи]|алгебра|геометрия|maths?|mathematics|algebra|geometry')
const TEACHING = /уро[кц]|заняти[ея]|обучени|преподав|подготовк|курс|учител|\b(?:lessons?|tutor\w*|classes|class|coaching|training|prepar\w*)\b/u
const OTHER_MATH = /онлайн|дистанцион|физик|хими|български език|\b(?:online|remote|virtual|physics|chemistry|materials|textbooks?)\b/u
const BATH = /къпане|изкъпване|измиване|\b(?:bath|baths|bathing|wash|washing)\b/u
const OTHER_BATH = /без къпане|подстриг|бръсн|\b(?:without (?:a )?bath|no bath|haircut|hair cut|trimming|shav\w*)\b/u

const PLUMBER = whole('вик|водопровод\\p{L}*|plumb\\w*')
const SINK_WORK = /(?:ремонт|монтаж|демонтаж|смяна|отпушване|почистване).*сифон|отстраняване.*теч.*тръб|\b(?:sink|drain|p[ -]trap)\b.*\b(?:repair|unclog\w*|clear\w*|clean\w*|leak\w*|replac\w*)\b|\b(?:repair|unclog\w*|clear\w*|clean\w*|replac\w*)\b.*\b(?:sink|drain|p[ -]trap)\b/u
const OTHER_PLUMBING = /електр|перал|съдомиял|водомер|бойлер|газов|тоалетн|подов сифон|вана|душ|шахт|водопроводна точка|консултац|оглед|\b(?:electric\w*|appliance|washing machine|dishwasher|water meter|water heater|boiler|gas|toilet|floor drain|bathtub|shower|sewer|consult\w*|inspection|supplies)\b/u

const CLEAN_TEETH = /зъбен камък|зъбн[аи]\s+плака|дентална хигиена|почистване на зъби(?:те)?(?!\p{L})|\b(?:dental (?:cleaning|hygiene)|teeth cleaning|cleaning (?:of )?(?:the )?teeth|tartar removal|dental scaling|scale and polish)\b/u
const OTHER_DENTAL = /кюретаж|избелван|хирург|операц|консултац|ортодонт|преглед|протез|имплант|air[ -]?flow|\b(?:surg\w*|whitening|consult\w*|orthodont\w*|curettage|exam\w*|dentures?|implants?)\b/u

const BOXING = whole('бокс|boxing')
const OTHER_BOXING = /кик[ -]?бокс|тайландски бокс|муай[ -]?тай|мма|карате|джудо|борба|боксова круша|спаринг|\b(?:kick[ -]?boxing|muay[ -]?thai|thai boxing|mma|karate|judo|wrestling|cardio[ -]?boxing|fitness boxing|sparring|boxing match)\b/u
const TENNIS = whole('тенис|tennis')
const OTHER_TENNIS = /тенис на маса|тенис[ -](?:лакът|лакътя)|падел|пикълбол|тенис корт под наем|наем на тенис корт|\b(?:table tennis|ping[ -]?pong|tennis elbow|pickleball|padel|court rental)\b/u
const COACHED = /трениров|треньор|индивидуал|персонал|групов|\b(?:train\w*|coach\w*|private|individual|group)\b/u

// The name is already normalized by the caller. Category and art kind only
// disambiguate wording: neither can establish a pictured service on its own.
export function midServicePhotoKind(name, { category, artKind, business } = {}) {
  if (typeof name !== 'string' || !name) return null
  const categories = [category, business?.businessCategory, business?.category, business?.industry]
  const pet = categories.includes('pets') || ['dog-grooming', 'pet-care'].includes(artKind) || ANIMAL.test(name)
  const auto = categories.some(value => AUTO.has(value)) || CAR.test(name)
  const sports = categories.includes('fitness')

  if (!pet && !CHILD.test(name) && MASSAGE.test(name) && BACK_MASSAGE.test(name) && !OTHER_MASSAGE.test(name)) return 'massage'
  if (auto && !pet && DIAGNOSTICS.test(name) && (SCAN.test(name) || CAR.test(name)) && !OTHER_DIAGNOSTICS.test(name) && !OIL_CHANGE.test(name)) return 'auto-diagnostics'
  if (!pet && (auto || ENGINE_OIL.test(name)) && OIL_CHANGE.test(name) && !OTHER_OIL.test(name)) return 'oil-change'
  if (auto && !pet && CAR_INTERIOR.test(name) && EXTRACTION.test(name) && !OTHER_CAR_CLEANING.test(name)) return 'interior-car-clean'
  if (!pet && MATH.test(name) && TEACHING.test(name) && !OTHER_MATH.test(name)) return 'math-lesson'
  if (DOG.test(name) && BATH.test(name) && !OTHER_ANIMAL.test(name) && !OTHER_BATH.test(name)) return 'pet-bath'
  if (!pet && !auto && (PLUMBER.test(name) || SINK_WORK.test(name)) && !OTHER_PLUMBING.test(name)) return 'plumbing'
  if (!pet && !CHILD.test(name) && CLEAN_TEETH.test(name) && !OTHER_DENTAL.test(name)) return 'dental-cleaning'
  if (!pet && !CHILD.test(name) && BOXING.test(name) && (COACHED.test(name) || TEACHING.test(name)) && !OTHER_BOXING.test(name)) return 'boxing'
  if (!pet && !CHILD.test(name) && category !== 'health' && TENNIS.test(name) && (TEACHING.test(name) || (sports && COACHED.test(name)) || /трениров|треньор|\bcoach\w*\b/u.test(name)) && !OTHER_TENNIS.test(name)) return 'tennis'
  return null
}
