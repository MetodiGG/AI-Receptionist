export const SERVICE_PHOTO_61_TO_75_IDS = Object.freeze([
  'home-deep-clean', 'mattress-cleaning', 'window-cleaning', 'headlight-restoration', 'ceramic-car-coating',
  'cat-grooming', 'pet-claw-trim', 'sports-massage', 'speech-therapy', 'psychology-consultation',
  'teeth-whitening', 'guitar-lesson', 'vocal-lesson', 'ceramics-class', 'car-aircon-service',
])

const AUTO_CATEGORIES = new Set(['auto', 'auto_repair', 'car_wash', 'detailing'])
const PET_ART = new Set(['dog-grooming', 'pet-care'])
const REMOTE = /онлайн|дистанц|видеовръз|\bonline\b|\bremote\b|\bvirtual\b/u
const HOME_VISIT = /\bhome visit\b|\bin[ -]home\b|на адрес|у дома|вкъщи|домашн\p{L}* посещен/u
const FOR_CHILDREN = /детск|дете|деца|юнош|младеж|под\s+18|\b(?:child|children|kids?|teen\w*|pa?ediatric)\b/u
const DOG = /(?:^|[^\p{L}])(?:куч\p{L}*|dogs?|puppy|canine)(?=$|[^\p{L}])/u
const CAT = /(?:^|[^\p{L}])(?:кот\p{L}*|cats?|feline)(?=$|[^\p{L}])/u
const INSTRUMENTS = /пиано|барабан|флейт|цигул|акордеон|солфеж|актьорск|саксофон|музикален инструмент|\b(?:piano|drums?|flute|violin|accordion|solfege|acting|saxophone|instrument)\b/u

const HOME_CLEAN = /^(?:(?:стандартно )?основно почистване(?: \/ след наематели)?|(?:(?:основно|дълбоко|еднократно|планирано|планирано поддържащо|абонаментно|планирано абонаментно) )?почистване на (?:дома?|домове|жилищ[еа]|апартамент(?:и)?|къща)(?: на адрес| след наематели| (?:(?:до|над) )?\d+ м[²2])?|(?:standard |one.off |regular |deep )?(?:home|house|apartment|residential) clean(?:ing)?)$/u
const MATTRESS_CLEAN = /^(?:пране|почистване|дълбоко почистване)(?: на| ·) (?:[\p{L}0-9×/ -]+ )?(?:матрак|матраци)(?=$|[^\p{L}])|^(?:(?:deep |wet )?mattress (?:clean(?:ing)?|wash(?:ing)?)|(?:clean(?:ing)?|wash(?:ing)?) (?:a |the )?mattress)(?=$|[^\p{L}])/u
const WINDOWS = /^(?:(?:почистване|миене|измиване) (?:на )?(?:вътрешни )?прозорци(?: на адрес)?|(?:indoor |interior )?window (?:cleaning|washing))$/u
const HEADLIGHTS = /^(?:(?:машинно )?(?:полиране|възстановяване) (?:на )?(?:комплект )?(?:фар(?:ове)?|автомобилни фарове)(?: на адрес)?|(?:car )?headlight (?:lens )?(?:polishing|restoration))$/u
const CAR_COATING = /^(?:(?:(?:защитно|перманентно) )?керамичн(?:о (?:защитно )?покритие|а защита)(?: (?:на|за) (?:лек )?автомобил)?|(?:(?:automotive|car|vehicle) )?ceramic coat(?:ing)?(?: (?:for|on) (?:a |the )?(?:car|vehicle))?)$/u
const CAT_GROOM = /^(?:(?:цялостен )?груминг(?: (?:на|за) (?:дългокосмест[аи] )?кот(?:ка|ки))?|(?:разресване|четкане) (?:на )?(?:подкосъм на )?кот(?:ка|ки)|котка · (?:разресване|четкане|цялостен груминг)|цялостен груминг · дългокосместа котка|(?:(?:long[ -]haired )?(?:cat|feline) (?:grooming|brushing)|(?:grooming|brushing) (?:a |the )?cat))(?=$|\s*·)/u
const DOG_CLAWS = /^(?:(?:куче · )?(?:подрязване|рязане|изрязване) (?:на )?нокти(?: (?:на|за) куч(?:е|ета))?|(?:dog|canine) (?:claw|nail) (?:trim(?:ming)?|clip(?:ping)?)|(?:claw|nail) (?:trim(?:ming)?|clip(?:ping)?) (?:on|for) dogs?)$/u
const SPORTS_MASSAGE = /^(?:(?:частичен )?спортен масаж|спортно възстановяване и спортен масаж|sports? massage(?: therapy)?)$/u
const SPEECH_THERAPY = /^(?:(?:индивидуална )?логопедична терапия(?: (?:за|на) деца)?|терапия (?:при|с) логопед|(?:(?:individual|child|children's|pediatric|paediatric) )?speech(?: and language)? therapy(?: for (?:kids|children))?)$/u
const PSYCH_CONSULT = /^(?:(?:(?:индивидуална|първична|(?:редовна |задълбочена )?вторична) )?психологич(?:на|еска) консултация(?: за възрастни)?|(?:индивидуално )?психологич(?:но|еско) консултиране|(?:индивидуална )?консултация (?:с|при) (?:клиничен )?психолог|клиничен психолог · (?:първична|вторична) консултация|(?:(?:individual|initial|adult) )?(?:psychological consult(?:ation|ing)|consultation with (?:a )?(?:clinical )?psychologist)(?: for adults)?)(?=$|\s*·)/u
const WHITENING = /^(?:(?:(?:клинично|професионално|кабинетно|led) )?избелване на зъб(?:и|ите)|(?:клинично|кабинетно) избелване|(?:(?:professional|in[ -]office|chairside|led) )?teeth whitening)$/u
const LESSON_BG = '(?:(?:индивидуал(?:ни|ен|на|но)|проб(?:ни|ен|на|но)|начал(?:ни|ен|на|но)) )?(?:уро(?:к|ци)|курс|обучение) (?:по|за) '
const GUITAR = new RegExp(`^(?:${LESSON_BG}(?:акустична )?китара|(?:индивидуална )?китара(?: с [\\p{L} -]+)?|(?:(?:individual|private|acoustic) )?guitar (?:lessons?|class|tuition|instruction))$`, 'u')
const VOCAL = new RegExp(`^(?:${LESSON_BG}(?:поп(?: и джаз)? |джаз |народно )?пеене|(?:(?:поп(?: и джаз)?|джаз|народно) )?пеене(?: с [\\p{L} -]+)?|вокални (?:уроци|занимания)|(?:(?:individual|private) )?(?:vocal|singing) (?:lessons?|class|coaching|tuition))$`, 'u')
const POTTERY = /^(?:(?:(?:индивидуал(?:ни|ен|но)|проб(?:ни|ен|но)) )?(?:уро(?:к|ци)|курс|обучение|занятие) по грънчарство|грънчарство (?:на колело|за възрастни)|керамика (?:и точарско колело|на (?:точарско )?колело)(?: за двойка)?|(?:(?:individual|private|wheel[ -]thrown) )?pottery (?:lessons?|class|workshop)|(?:wheel[ -]throwing|pottery wheel) (?:lessons?|class|workshop))$/u
const AUTO_AC = /^(?:(?:диагностика и )?зареждане (?:на|с) (?:автоклиматик|автомобилен климатик|фреон)(?: [a-z0-9]+)?(?: на адрес)?|(?:обслужване|профилактика|диагностика) (?:на )?(?:автомобилен климатик|автоклиматик|авто климатик|авто климатична система)|проверка за наличие на фреон|(?:car|vehicle|automotive) (?:a\/c|ac|air conditioning) (?:service|recharge|regas|inspection|diagnostics?)|(?:a\/c|ac|air conditioning) (?:service|recharge|regas|inspection|diagnostics?))$/u

export function approvedServicePhoto61To75({ name, context = {}, category = context.category, artKind = context.artKind, business = context.business } = {}) {
  if (!name) return null
  const [core] = name.split(/\s*·\s*/u, 1)
  const auto = AUTO_CATEGORIES.has(category) || business?.industry === 'auto'
  const home = category === 'home_services' || artKind === 'home-services' || business?.industry === 'home_services'
  const pet = category === 'pets' || PET_ART.has(artKind) || business?.industry === 'pets'

  if (pet) {
    if (CAT.test(name) && CAT_GROOM.test(name) && !DOG.test(name) &&
      !/късокосмест|подстриг|бръсн|къпан|нокт|свалян|упойк|\b(?:short[ -]haired|haircut|shav\w*|bath\w*|claws?|nails?|sedat\w*)\b/u.test(name)) return 'cat-grooming'
    if (DOG.test(name) && (DOG_CLAWS.test(core) || DOG_CLAWS.test(name)) && !CAT.test(name) &&
      !/гризач|заек|изпиляв|шлайф|къпане|уши|\b(?:rodents?|rabbits?|grind\w*|filing|bath\w*|ears?)\b/u.test(name)) return 'pet-claw-trim'
    return null
  }

  if (auto) {
    if (HEADLIGHTS.test(core) && !/фолио|керамик|uv|защит|стопов|стъкл|\b(?:film|ceramic|coating|taillights?|glass)\b/u.test(name)) return 'headlight-restoration'
    if (CAR_COATING.test(core) && !/полиран|поддръж|фар|стоп|джант|фолио|салон|кожа|стъкл|пластмас|\b(?:polish\w*|maintenance|headlights?|wheels?|film|interior|leather|glass|plastic)\b/u.test(name)) return 'ceramic-car-coating'
    if (AUTO_AC.test(core) && !/смяна|ремонт|демонтаж|монтаж|радиатор|компресор|кондензатор|парното|без климатик|домаш|\b(?:replace\w*|repair|install\w*|radiator|compressor|condenser|heater|residential)\b/u.test(name)) return 'car-aircon-service'
    return null
  }

  if (home) {
    if (HOME_CLEAN.test(core) && !/ремонт|строител|офис|заведени|индустриал|фасад|оглед|прозорц|матрац|матрак|диван|килим|климати|\b(?:renovation|construction|office|commercial|inspection|windows?|mattress|sofa|carpet)\b/u.test(name)) return 'home-deep-clean'
    if (MATTRESS_CLEAN.test(name) && !/сухо|пара|ензим|миризм|петно|дезинфекц|антиакар|калъф|диван|килим|\b(?:dry|steam|enzyme|odou?r|stain|disinfect\w*|cover|sofa|carpet)\b/u.test(name)) return 'mattress-cleaning'
    if (WINDOWS.test(core) && !/височин|след ремонт|фасад|дограма|щор|витрин|външн|\b(?:high[ -]rise|exterior|facade|frame|blinds?)\b/u.test(name)) return 'window-cleaning'
    return null
  }

  if (SPORTS_MASSAGE.test(core) && !REMOTE.test(name) && !HOME_VISIT.test(name) && !FOR_CHILDREN.test(name) &&
    !/апарат|ролер|вендуз|игл|лице|глава|горни крайници|гръб|ръце|\b(?:machine|cupping|needling|face|head|back|arms?)\b/u.test(name)) return 'sports-massage'
  if (SPEECH_THERAPY.test(core) && !REMOTE.test(name) && !HOME_VISIT.test(name) &&
    !/възрастни|инсулт|афази|диагност|консултац|\b(?:adults?|stroke|aphasia|diagnos\w*|consult\w*)\b/u.test(name)) return 'speech-therapy'
  if (PSYCH_CONSULT.test(name) && !REMOTE.test(name) && !HOME_VISIT.test(name) && !FOR_CHILDREN.test(name) &&
    !/семей|двойк|групов|психотерап|логопед|ерготерап|\b(?:family|couples?|group|psychotherapy|speech therapist)\b|\//u.test(name)) return 'psychology-consultation'
  if ((category === 'other' || category === 'health' || /зъб|\bteeth\b/u.test(core)) && WHITENING.test(core) &&
    !/домаш|вкъщи|шини|лазер|паста|кариес|почистван|\b(?:home|tray\w*|laser|toothpaste|cleaning)\b/u.test(name)) return 'teeth-whitening'

  if (category === 'education' || artKind === 'education') {
    if (GUITAR.test(core) && !INSTRUMENTS.test(name) && !/пеене|електр|бас китар|групов|двама|\b(?:singing|vocal|electric|bass|group|duo)\b/u.test(name) && !FOR_CHILDREN.test(name) && !REMOTE.test(name)) return 'guitar-lesson'
    if (VOCAL.test(core) && !INSTRUMENTS.test(name) && !/китар|груп|хоров|двама|\b(?:guitar|group|choir|duo)\b/u.test(name) && !FOR_CHILDREN.test(name) && !REMOTE.test(name)) return 'vocal-lesson'
    if (POTTERY.test(core) && !/рисуван|глазиран|моделиране на ръка|рожден|те?ймбилдинг|парт[иі]|\b(?:painting|glazing|hand[ -]building|birthday|party)\b/u.test(name) && !FOR_CHILDREN.test(name) && !REMOTE.test(name)) return 'ceramics-class'
  }
  return null
}
