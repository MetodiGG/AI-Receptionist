import { CATEGORY_IDS, categoryById, normalizeSearchText } from './categories.mjs'

// This presentation/filter taxonomy creates no services, prices or availability.
// Membership requires a real public service, not a selected category alone.
const definitions = [
  ['hair','cut','Подстригване','Haircuts','womens-haircut',/подстриг|haircut|hair cut/u],
  ['hair','children','Детско подстригване','Children’s haircuts','kids-haircut',/(?:детск|деца|момич|момче|kids?|child(?:ren)?|boys?|girls?).*(?:подстриг|hair.?cut)|(?:подстриг|hair.?cut).*(?:детск|деца|момич|момче|kids?|child(?:ren)?|boys?|girls?)/u],
  ['hair','colour','Боядисване','Hair colouring','hair-color',/боядис|боя(?:\s|$)|колор|тонира|colour|coloring|hair color/u],
  ['hair','balayage','Балеаж и кичури','Balayage and highlights','hair-balayage',/балеаж|кичур|бал[еия]аж|balayage|highlight|ombre|омбре/u],
  ['hair','styling','Сешоар и стилизиране','Blow-dry and styling','hair-blowdry',/сешоар|стилиз|оформяне на причес|изправяне|къдрен|blow.?dry|styling|curl|straighten/u],
  ['hair','updos','Официални прически','Occasion hairstyles','formal-updo',/официалн|сватбен.*причес|булчин.*причес|кок(?:\s|$)|updo|bridal hair|occasion hair/u],
  ['hair','treatments','Терапии за коса','Hair treatments','sx-hair-treatment',/терапи|кератин|маска.*кос|възстанов.*кос|hair treatment|keratin|hair mask/u],
  ['hair','extensions','Удължаване','Hair extensions','hair-extension-row',/удължав.*кос|сгъстяв.*кос|екстенш|extensions|hair extension/u],
  ['hair','braids','Плитки','Braids','hair-braiding',/плитк|плетен.*кос|braid/u],
  ['nails','manicure','Маникюр','Manicure','classic-manicure',/маникюр|manicure/u],
  ['nails','gel','Гел лак','Gel polish','gel-manicure',/гел.?лак|гел лак|gel polish|gel manicure/u],
  ['nails','pedicure','Педикюр','Pedicure','classic-pedicure',/педикюр|pedicure/u],
  ['nails','strengthening','Укрепване на нокти','Nail strengthening','sx-nails-strengthen-hands',/укреп|заздравяв|nail strengthen|strengthening|gel overlay|natural nail overlay/u],
  ['nails','apparatus-pedicure','Апаратен педикюр','Machine pedicure','sx-nails-russian-pedicure',/(?:апарат|машин|hardware|e[ -]?file|machine).*(?:педик|pedicur)|(?:педик|pedicur).*(?:апарат|машин|hardware|e[ -]?file|machine)/u],
  ['nails','extensions','Ноктопластика','Nail extensions','nail-extension',/ноктопласт|изграждан|удължав.*нок|nail extension|sculpted nail/u],
  ['nails','art','Декорации','Nail art','nail-art',/декорац|рисуван|френск|nail art|nail design|french/u],
  ['nails','removal-repair','Сваляне и поправка','Removal and repair','nail-gel-removal',/свалян|поправ|ремонт.*нок|ремув|removal|repair/u],
  ['beauty','face','Лице','Facials','facial-cleansing',/лице|лицето|facial|face|микронид|дермабраз|пилинг/u],
  ['beauty','laser','Лазерна епилация','Laser hair removal','laser-hair-removal',/лазер.*епилац|фотоепилац|laser.*hair|ipl|диодн.*епилац/u],
  ['beauty','waxing','Кола маска','Waxing','waxing',/кола маска|коламаска|восък|шугар|wax|sugaring/u],
  ['beauty','makeup','Грим','Makeup','makeup',/грим|make.?up/u],
  ['beauty','brows','Вежди','Brows','brow-shaping',/вежд|brow/u],
  ['beauty','brow-lamination','Ламиниране на вежди','Brow lamination','sx-brow-lamination-only',/ламинир.*вежд|вежд.*ламинир|brow.*laminat|laminat.*brow/u],
  ['beauty','lashes','Мигли','Lashes','lash-extensions',/мигл|lash/u],
  ['beauty','permanent-makeup','Перманентен грим','Permanent makeup','sx-beauty-brow-pmu',/перманент|микроблейд|микропигмент|permanent make|microblad|pmu/u],
  ['beauty','body','Процедури за тяло','Body treatments','pressotherapy',/тяло|телесн|целулит|кавитац|пресотерап|липолиз|body|cellulite|pressotherapy/u],
  ['barber','haircut','Мъжко подстригване','Men’s haircuts','mens-haircut',/подстриг|haircut|hair cut/u],
  ['barber','beard','Брада и бръснене','Beard and shaving','beard-trim',/брада|бради|бръснен|beard|shav/u],
  ['barber','hair-beard','Коса и брада','Hair and beard','partner-hair-beard-brows-finish',/(?:коса|подстриг|hair).*(?:брада|beard)|(?:брада|beard).*(?:коса|подстриг|hair)|комбо|combo/u],
  ['barber','colour','Боядисване и камуфлаж','Colour and camouflage','hair-camouflage',/боя|боядис|камуфлаж|colour|color|camouflage/u],
  ['barber','children','Детско подстригване','Children’s haircuts','kids-haircut',/детск|деца|момч|kids?|child|boys?/u],
  ['barber','brows-wax','Вежди и кола маска','Brows and waxing','barber-brow-threading',/вежд|кола маска|восък|уши|нос|brow|wax|nose|ears?/u],
  ['auto_repair','diagnostics','Диагностика','Diagnostics','auto-diagnostics',/диагност|компютър|diagnos/u],
  ['auto_repair','oil-filters','Масла и филтри','Oil and filters','oil-change',/масл|филт[ъа]р|oil|filter/u],
  ['auto_repair','engine','Двигател','Engine repairs','sx-auto-engine-repair',/двигател|ангренаж|инжектор|дюз|engine|timing|injector/u],
  ['auto_repair','brakes-suspension','Спирачки и окачване','Brakes and suspension','brake-service',/спирач|наклад|диск|окачван|ходова|амортис|носач|шарнир|brake|suspension|shock/u],
  ['auto_repair','tyres','Гуми и реглаж','Tyres and alignment','tyre-change',/гум[аи]|реглаж|баланс|джант|tyres?|tires?|align|balanc/u],
  ['auto_repair','air-conditioning','Автоклиматици','Car air conditioning','car-aircon-service',/климат|фреон|air.?con|a\/c|refrigerant/u],
  ['auto_repair','electrics','Автоелектроника','Auto electrics','sx-auto-alternator',/електр|електрон|акумул|алтернатор|стартер|electric|electron|battery|alternator|starter/u],
  ['auto_repair','body-paint','Тенекеджийство и боядисване','Bodywork and painting','sx-auto-panel-spray-paint',/тенекедж|боядис|лак|детайл|каросер|pdr|paint|bodywork|body repair/u],
  ['auto_repair','inspection','ГТП','Vehicle inspection','sx-auto-car-inspection',/гтп|технически преглед|годишен.*преглед|vehicle inspection|technical inspection|annual inspection/u],
  ['auto_repair','prepurchase','Оглед преди покупка','Pre-purchase inspection','partner-car-lift-inspection',/преди покуп|предпокуп|оглед.*автомоб|оглед.*кол|преглед и оценка|pre.?purchase|car inspection and assessment/u],
  ['car_wash','exterior','Външно измиване','Exterior wash','car-exterior-hand-wash',/външн|екстериор|exterior|external/u],
  ['car_wash','interior','Вътрешно почистване','Interior cleaning','car-interior-vacuum',/вътрешн|интериор|купе|прахосмук|interior|vacuum/u],
  ['car_wash','complete','Комплексно измиване','Complete wash','sx-wash-full-car',/комплекс|цялостн|външно и вътрешно|вътрешно и външно|complete|full wash|exterior and interior/u],
  ['car_wash','upholstery','Пране на салон','Upholstery cleaning','car-interior-detailing',/пране|салон|тапиц|седал|upholstery|seats?|shampoo/u],
  ['car_wash','mobile','Мобилна автомивка','Mobile car wash','sx-wash-mobile-van',/мобилн|на адрес|mobile|at your/u],
  ['car_wash','pickup','Вземане и връщане','Collection and return','sx-wash-pickup-return',/вземан|връщан|pickup|pick.up|collection|collect.*return/u],
  ['fitness','folk-dance','Народни танци','Folk dance','sx-bulgarian-folk-group',/народн.*танц|танц.*народн|българск.*хор|bulgarian folk|folk danc/u],
  ['fitness','yoga','Йога','Yoga','yoga-class',/йога|yoga/u],
  ['fitness','pilates','Пилатес и реформър','Pilates and reformer','reformer-pilates',/пилатес|реформ[ъе]р|pilates|reformer/u],
  ['fitness','boxing','Бокс и кикбокс','Boxing and kickboxing','boxing',/бокс|boxing/u],
  ['fitness','latin-dance','Латино и социални танци','Latin and social dance','sx-adult-argentine-tango-group',/салса|бачата|кизомба|танго|латино|социалн.*танц|salsa|bachata|kizomba|tango|latin|social danc/u],
  ['fitness','modern-dance','Модерни танци','Modern dance','sx-child-modern-hiphop-class',/модерн.*танц|съвремен.*танц|хип.?хоп|джаз|контемп|балет|modern danc|contemporary|hip.?hop|jazz|ballet/u],
  ['fitness','personal-training','Персонални тренировки','Personal training','strength-training',/персонал|индивидуал.*трениров|силов|функционал|personal train|strength|conditioning/u],
  ['fitness','group-training','Групови тренировки','Group workouts','sx-strength-group',/групов.*трениров|трениров.*групов|group.*(?:train|workout)|(?:train|workout).*group/u],
  ['fitness','martial-arts','Бойни изкуства','Martial arts','karate-training',/карате|таекуон|джу.?дж|джиу.?дж|джудо|борба|айкидо|кунг.?фу|мма|муай.?тай|бойни изкуств|karate|taekwon|jiu.?jitsu|bjj|judo|wrestl|aikido|kung.?fu|mma|muay.?thai|martial/u],
  ['fitness','racket-sports','Ракетни спортове','Racket sports','tennis',/тенис|падел|скуош|бадминтон|tennis|padel|squash|badminton/u],
  ['fitness','swimming','Плуване','Swimming','sx-adult-swimming-individual',/плув|swim/u],
  ['fitness','climbing','Катерене','Climbing','sx-climbing-private',/катерен|боулд[ъе]р|climb|boulder/u],
  ['fitness','football','Футболни игрища','Football pitches','sx-football-pitch-rental',/футбол|football|soccer/u],
  ['education','languages','Езици','Languages','language-lesson',/език|англий|немск|френск|испанск|италианск|корейск|японск|language|english|german|french|spanish|italian|korean|japanese/u],
  ['education','school','Училищни предмети и матури','School subjects and exams','math-lesson',/математ|бел|литератур|български език|матур|нво|физик|хими|биолог|истори|географ|math|school|exam|physics|chemistry|biology|literature/u],
  ['education','mathematics','Математика','Mathematics','math-lesson',/математ|\bmath(?:ematics|s)?\b/u],
  ['education','exam-preparation','Подготовка за изпити','Exam preparation','math-lesson',/(?:^|[^\p{L}])нво(?:$|[^\p{L}])|матур|подготовк.*изпит|изпитн.*подготовк|exam.*prep|prep.*exam/u],
  ['education','instruments','Музикални инструменти','Musical instruments','piano-lesson',/пиано|китар|цигул|барабан|флейт|саксофон|инструмент|piano|guitar|violin|drums?|flute|saxophone|instrument/u],
  ['education','singing','Пеене','Singing','vocal-lesson',/пеене|вокал|певческ|sing|vocal/u],
  ['education','art','Рисуване и приложни изкуства','Drawing and crafts','sx-adult-art-group',/рисув|изобразител|керамик|грънчар|приложн.*изкуств|drawing|painting|pottery|ceramic|(?:^|[^\p{L}])arts?(?:$|[^\p{L}])|craft/u],
  ['education','dance','Танци','Dance lessons','dance-lesson',/танц|балет|хип.?хоп|dance|dancing|ballet/u],
  ['education','driving','Шофьорски курсове','Driving lessons','driving-lesson',/шофьор|кормув|водач|категория [абвсд]|driving|driver/u],
  ['education','coding','Програмиране','Programming','sx-programming-class',/програмир|кодира|софтуер|роботик|programming|coding|software|robotic/u],
  ['pets','dogs','За кучета','Dogs','dog-full-grooming',/куче|кучета|кучен|пород|dog|pupp/u],
  ['pets','cats','За котки','Cats','cat-grooming',/котк|котен|cats?|kitten|feline/u],
  ['pets','bath-brush','Къпане и разресване','Bathing and brushing','pet-bath',/къп|баня|разрес|обезкосм|bath|brush|deshed/u],
  ['pets','cut-trim','Подстригване и триминг','Haircuts and trimming','dog-haircut',/подстриг|трим|groom|haircut|trim|stripping/u],
  ['pets','hygiene','Нокти и хигиена','Nails and hygiene','dog-ear-cleaning',/нокт|уши|очи|лап|хигиен|nails?|ears?|eyes?|paws?|hygiene/u],
  ['home_services','plumbing','ВиК','Plumbing','plumbing',/водопровод|(?:^|[^\p{L}])ви[ .]?к(?:$|[^\p{L}])|вик\s*услуг|канал|сифон|мивк|тоалетн|plumb|drain|sink|toilet/u],
  ['home_services','electrical','Електроуслуги','Electrical work','electrical-repair',/електр|контакт|освет|табло|electric|socket|lighting/u],
  ['home_services','cleaning','Почистване','Cleaning','home-deep-clean',/почиств|clean/u],
  ['home_services','furniture-cleaning','Пране на мебели','Furniture cleaning','sofa-cleaning',/пране.*(?:мебел|диван|матрак|килим|мокет)|(?:мебел|диван|матрак|килим|мокет).*пране|upholstery|sofa clean|carpet clean|mattress clean/u],
  ['home_services','renovation','Ремонти и боядисване','Renovation and painting','sx-home-plaster-paint',/ремонт|боядис|шпаклов|гипсокартон|плочк|renovat|paint|plaster|drywall|tiling/u],
  ['home_services','air-conditioning','Климатици','Air conditioning','home-aircon-service',/климат|air.?con|a\/c/u],
  ['home_services','appliances','Битова техника','Appliance repair','sx-home-appliance-repair',/пералн|съдомиял|хладил|фурн|печк|котлон|бойлер|битова|appliance|washing machine|dishwasher|fridge|oven|heater/u],
  ['home_services','moving','Преместване и мебели','Moving and furniture','sx-home-furniture-move',/преместв|хамал|мебел|монтаж.*кухн|moving|removal|furniture/u],
  ['home_services','furniture-assembly','Сглобяване на мебели','Furniture assembly','sx-home-desk-assembly',/(?:сглоб|монтаж).*(?:мебел|гардероб|легло|шкаф|бюро)|(?:мебел|гардероб|легло|шкаф|бюро).*(?:монтаж|сглоб)|furniture.*assembl|assembl.*furniture/u],
  ['home_services','pest-control','Дезинсекция и дератизация','Pest control','sx-home-rodent-control',/дезинсек|дератиз|вредител|хлебарк|дървениц|гризач|pest|rodent|cockroach|bed.?bug/u],
  ['health','massage','Масажи','Massage','therapeutic-massage',/масаж|massage/u],
  ['health','kinesitherapy','Кинезитерапия','Kinesitherapy','sx-kinesitherapy-equipment',/кинезитерап|kinesiotherapy|kinesitherapy/u],
  ['health','physiotherapy','Физиотерапия','Physiotherapy','physiotherapy',/физиотерап|physiotherapy|physical therapy/u],
  ['health','rehabilitation','Рехабилитация','Rehabilitation','physiotherapy',/рехабилит|rehabilit/u],
  ['health','manual','Мануална терапия','Manual therapy','manual-therapy',/мануал|manual therapy|chiroprac|хиропракт/u],
  ['health','taping','Кинезиотейпинг','Kinesiology taping','sx-kinesiotaping',/кинезио.*тейп|кинезиотейп|kinesio.*tap|kinesiology tap|taping/u],
  ['health','lymphatic','Лимфодренаж','Lymphatic drainage','sx-manual-lymph-drainage',/лимф|lymph|пресотерап|pressotherapy/u],
  ['consulting','legal','Правни','Legal','legal-consultation',/правн|юрид|адвокат|трудовоправ|legal|lawyer|attorney/u],
  ['consulting','accounting','Счетоводни и данъчни','Accounting and tax','accounting-consultation',/счетовод|данъч|декларац|account|tax/u],
  ['consulting','career','Кариерни','Career','sx-career-consultation',/кариер|професионалн.*ориент|career/u],
  ['consulting','business','Бизнес','Business','legal-consultation',/бизнес|фирмен|търговск|business|company|commercial/u],
  ['consulting','architecture','Архитектура','Architecture','sx-architecture-onsite-consultation',/архитект|интериор|architect|interior design/u],
  ['detailing','polishing','Полиране','Polishing','sx-detail-body-polish-protect',/полир|пастир|polish/u],
  ['detailing','ceramic','Керамични покрития','Ceramic coating','ceramic-car-coating',/керамич|нано.*покрити|ceramic|nano.?coat/u],
  ['detailing','ppf','PPF','PPF protection','sx-detail-ppf-front',/ppf|защитн.*фоли|полиуретан|paint protection/u],
  ['detailing','wrap-tint','Фолиране и затъмняване','Wrapping and tinting','vehicle-window-tint',/фолир|затъмн|wrap|tint/u],
  ['detailing','interior','Интериорен детайлинг','Interior detailing','car-interior-detailing',/интериор|салон|тапиц|седал|вътреш|interior|upholstery/u],
  ['detailing','headlights','Фарове','Headlights','headlight-restoration',/фаров|фар|headlight|headlamp/u],
  ['detailing','leather','Кожа','Leather care','sx-detail-leather-protect',/кожа|кожен|кожени|leather/u],
  ['other','dental','Зъболекари','Dentists','dental-exam',/зъб|зъби|стоматолог|дентал|ортодонт|имплант|dental|dentist|orthodont|tooth|teeth/u],
  ['other','psychology','Психолози и психотерапевти','Psychologists and psychotherapists','psychology-consultation',/психолог|психотерап|psycholog|psychotherap/u],
  ['other','psychiatry','Психиатри','Psychiatrists','sx-psychiatry-video',/психиатр|psychiatr/u],
  ['other','speech-therapy','Логопеди','Speech therapists','speech-therapy',/логопед|(?:^|[^\p{L}])(?:говорн|речев)|(?:^|[^\p{L}])говор(?:а|ът)?(?:$|[^\p{L}])|speech[ _-]+(?:therap|assess|language|session|consult|difficult)|logoped/u],
  ['other','photography','Фотография','Photography','photography-session',/фотограф|фотосес|фото\s*(?:заснем|услуг)|(?:^|[^\p{L}])фото(?:$|[^\p{L}])|photograph|photoshoot|photo shoot|photo session/u],
  ['other','tattoo-piercing','Татуировки и пиърсинг','Tattoos and piercing','sx-tattoo-application',/татуир|татуаж|(?:^|[^\p{L}])тату(?:$|[^\p{L}])|пиърс|tattoo|pierc/u],
  ['other','escape-rooms','Ескейп стаи','Escape rooms','sx-escape-archaeology',/ескейп|escape|стая.*загад|стаи.*загад/u],
  ['other','studio-rental','Студиа под наем','Studio rental','sx-photo-studio-rental',/(?:студио|студиа|зала).*наем|(?:наем).*студи|studio rental|studio hire/u],
]
const privateDefinitions = definitions.map(([category,key,bg,en,photoId,pattern]) => Object.freeze({
  id: category+'-'+key, category, bg, en, photo: '/service-photos/'+photoId+'-v1.webp', pattern,
}))
const byId = new Map(privateDefinitions.map(item => [item.id,item]))
const byCategory = new Map(CATEGORY_IDS.map(category=>[category,privateDefinitions.filter(item=>item.category===category)]))
const publicItem = (item, locale='bg') => {
  const { pattern, ...metadata } = item
  return { ...metadata, label: item[locale==='en'?'en':'bg'] }
}
export const SUBCATEGORY_IDS = Object.freeze(privateDefinitions.map(item=>item.id))
export const DISCOVERY_SUBCATEGORIES = Object.freeze(privateDefinitions.map(item=>Object.freeze(publicItem(item))))
export function subcategoryById(id) { const item=byId.get(id);return item?publicItem(item):undefined }
export function subcategoriesForCategory(category,locale='bg') { return (byCategory.get(category)||[]).map(item=>publicItem(item,locale)) }
export function subcategorySelection(query,category,id,locale='bg') {
  const parent=categoryById(category),child=byId.get(id)
  return parent?{category:parent.id,subcategory:child?.category===parent.id?child.id:'',query:parent[locale==='en'?'en':'bg']}:
    {category:'',subcategory:'',query}
}
const knownCategories=new Set(CATEGORY_IDS)
function serviceName(service) {return normalizeSearchText(typeof service==='string'?service:service?.name||'')}
function businessContext(business) {return normalizeSearchText([business?.name,business?.primaryType].filter(Boolean).join(' '))}
const animalActivity=/куче|кучета|кучеш|котк|котеш|животн|груминг|\b(?:dogs?|puppy|cats?|kitten|pets?|grooming|veterinary)\b/u
const humanActivity=/маникюр|педикюр|нок(?:ът|ти)|вежд|мигл|зъб|(?:^|[^\p{L}])(?:лице|лицето|коса|косата|брада)(?:$|[^\p{L}])|\b(?:facial|nails?|brows?|lashes|hair|beard|teeth)\b/u
const vehicleActivity=/автомоб|(?:^|[^\p{L}])авто(?:$|[^\p{L}])|автоклимат|автосерв|автоелектр|джант|фаров|каросер|\b(?:car|vehicle|automotive|tyres?|tires?|headlights?)\b/u
const homeObject=/(?:^|[^\p{L}])(?:жилищ|апартамент|помещени|сграда|офис|фасад|стен|таван|диван|мебел|матрак|килим)|\b(?:home|house|apartment|office|building|wall|ceiling|sofa|furniture|carpet)\b/u
function conflictingActivity(name,category,business,serviceCategory){
  const declared=business?.businessCategory||business?.category||business?.industry
  const explicitCategory=knownCategories.has(serviceCategory)
  if(['hair','barber','nails','beauty','health','fitness'].includes(category)&&
    (animalActivity.test(name)||declared==='pets'&&!explicitCategory))return true
  if(['hair','barber','nails','beauty'].includes(category)&&vehicleActivity.test(name))return true
  if(['hair','barber','nails'].includes(category)&&homeObject.test(name))return true
  if(!explicitCategory&&['hair','barber','nails','beauty'].includes(category)&&
    ['auto','auto_repair','car_wash','detailing','home_services'].includes(declared)&&!humanActivity.test(name))return true
  if(category==='home_services'&&(humanActivity.test(name)||vehicleActivity.test(name)||animalActivity.test(name)&&!homeObject.test(name)))return true
  if(!explicitCategory&&category==='home_services'&&
    ['beauty','hair','barber','nails','auto','auto_repair','car_wash','detailing','pets','health'].includes(declared)&&!homeObject.test(name))return true
  if(['auto_repair','car_wash','detailing'].includes(category)&&humanActivity.test(name))return true
  if(!explicitCategory&&['auto_repair','car_wash','detailing'].includes(category)&&
    ['beauty','hair','barber','nails','home_services','pets','health'].includes(declared)&&!vehicleActivity.test(name))return true
  if(category==='beauty'&&/трениров|фитнес|пилатес|йога|\b(?:training|workout|pilates|yoga)\b/u.test(name))return true
  return false
}
export function matchesSubcategory(service,id,business={}) {
  const item=byId.get(id)
  if(!item||service?.active===false)return false
  if(knownCategories.has(service?.category)&&service.category!==item.category)return false
  const name=serviceName(service)
  if(!name)return false
  if(conflictingActivity(name,item.category,business,service?.category))return false
  if(id==='beauty-face'&&/юридическ.*лице|face.to.face/u.test(name))return false
  if(id==='other-photography'&&/фото\s*епила|фототерап|photo.?epilat|phototherap/u.test(name))return false
  if(item.pattern.test(name))return true
  if(item.category==='other'&&/консулт|сеси|терап|преглед|consult|session|therapy|exam/u.test(name)&&
    ['other-dental','other-psychology','other-psychiatry','other-speech-therapy'].includes(id))return item.pattern.test(businessContext(business))
  return false
}
export function businessSubcategoryIds(business,category) {
  const services=business?.services||business?.details?.services||[]
  return (category?(byCategory.get(category)||[]):privateDefinitions).filter(item=>services.some(service=>matchesSubcategory(service,item.id,business))).map(item=>item.id)
}
export function filterBusinessesBySubcategory(rows,id) {
  if(!id)return rows
  if(!byId.has(id))return []
  return rows.flatMap(row=>{
    const services=(row.services||[]).filter(service=>matchesSubcategory(service,id,row))
    return services.length?[{...row,services,subcategory:id}]:[]
  })
}
export function subcategoryOptionsForBusinesses(rows,category,locale='bg') {
  if(!knownCategories.has(category))return []
  const options=subcategoriesForCategory(category,locale)
  const counts=new Map(options.map(item=>[item.id,0]))
  for(const row of rows)for(const id of businessSubcategoryIds(row,category))counts.set(id,(counts.get(id)||0)+1)
  return options.flatMap(item=>counts.get(item.id)?[{...item,count:counts.get(item.id)}]:[])
}
