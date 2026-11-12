// Curated vocabulary for optional name completion, not a business inventory.
// A suggestion never asserts that a business offers it or supplies a tariff,
// duration, qualification or availability. Owners retain their own free text.
// The generic template labels are reused without importing example prices.
const group = (key, bg, en, text) => Object.freeze({
  key, bg, en,
  services: Object.freeze(text.trim().split('\n').map(line => {
    const [id, bg, en, aliases = ''] = line.trim().split('|')
    return Object.freeze({ id, bg, en, aliases: Object.freeze(aliases.split(';').filter(Boolean)) })
  })),
})

export const SERVICE_SUGGESTION_DATA = Object.freeze({
  beauty: Object.freeze([
    group('hair', 'Фризьорство', 'Hair', `
haircut|Подстригване|Haircut|подстрижка
hair-colouring|Боядисване на коса|Hair colouring|Боядисване;боя;boq;hair coloring;hair dye
womens-haircut|Дамско подстригване|Women's haircut|женско подстригване
mens-haircut|Мъжко подстригване|Men's haircut|мъжка прическа
childrens-haircut|Детско подстригване|Children's haircut|подстригване за деца
bob-haircut|Подстригване на каре|Bob haircut|каре
fringe-trim|Подстригване на бретон|Fringe trim|бретон;bangs
hair-wash|Измиване на коса|Hair wash|миене на коса
blow-dry|Сешоар|Blow-dry|изсушаване;сушене на коса
cut-and-blow-dry|Подстригване и сешоар|Haircut and blow-dry|
root-colouring|Боядисване на корени|Root colouring|боя на корени;root coloring
full-colour|Цялостно боядисване|Full hair colouring|боядисване на цяла коса;full hair coloring
highlights|Кичури|Highlights|изсветляване на кичури
balayage|Балеаж|Balayage|
ombre|Омбре|Ombre|
hair-toner|Тониране на коса|Hair toning|тонер;гланц за коса
hair-bleaching|Изрусяване|Hair bleaching|обезцветяване на коса
colour-correction|Корекция на цвят|Hair colour correction|color correction
curl-styling|Оформяне на къдрици|Curl styling|къдрене с маша;къдрици
hair-straightening|Изправяне на коса|Hair straightening|изправяне с преса
updo|Официална прическа|Occasion hairstyle|кок;updo
bridal-hair|Булчинска прическа|Bridal hairstyle|сватбена прическа
braids|Плитки|Braids|сплитане на коса
hair-extensions|Поставяне на екстеншъни|Hair extensions|удължаване на коса
extension-removal|Сваляне на екстеншъни|Hair extension removal|
keratin-treatment|Кератинова терапия|Keratin treatment|кератин
hair-repair|Възстановяваща терапия за коса|Restorative hair treatment|терапия за коса
scalp-treatment|Грижа за скалпа|Scalp treatment|
permanent-wave|Трайно къдрене|Perm|студено къдрене
hair-consultation|Консултация за коса|Hair consultation|
`),
    group('barber', 'Бръснарски услуги', 'Barber services', `
barber-cut|Бръснарско подстригване|Barber haircut|барбър;barber
fade|Фейд подстригване|Fade haircut|фейд;fade
skin-fade|Скин фейд|Skin fade|
beard-trim|Оформяне на брада|Beard trim|брада;подстригване на брада
shave|Бръснене|Shave|бръснене с бръснач
hot-towel-shave|Бръснене с топла кърпа|Hot towel shave|
hair-and-beard|Подстригване и брада|Haircut and beard trim|комбо коса и брада
beard-colouring|Боядисване на брада|Beard colouring|боя за брада;beard coloring
head-shave|Бръснене на глава|Head shave|
barber-threading|Оформяне на вежди с конец|Eyebrow threading|конец;threading
ear-nose-wax|Кола маска на уши и нос|Ear and nose waxing|уши и нос
`),
    group('nails', 'Маникюр и педикюр', 'Nails', `
manicure|Маникюр|Manicure|маникюр класически
gel-polish|Маникюр с гел лак|Gel polish manicure|гел лак;gel polish
gel-polish-removal|Сваляне на гел лак|Gel polish removal|
nail-extension|Ноктопластика|Nail extensions|изграждане на нокти
gel-nails|Изграждане с гел|Gel nail extensions|гел нокти
acrylic-nails|Изграждане с акрил|Acrylic nail extensions|акрилни нокти
nail-infill|Поддръжка на ноктопластика|Nail infill|поддръжка на нокти
nail-repair|Ремонт на нокът|Nail repair|поправка на нокът
nail-art|Декорация на нокти|Nail art|рисунки на нокти
french-manicure|Френски маникюр|French manicure|френски
mens-manicure|Мъжки маникюр|Men's manicure|
pedicure|Педикюр|Pedicure|
gel-pedicure|Педикюр с гел лак|Gel polish pedicure|
dry-pedicure|Апаратен педикюр|Machine pedicure|сух педикюр
foot-care|Козметична грижа за стъпала|Cosmetic foot care|
paraffin-hands|Парафинова терапия за ръце|Paraffin hand treatment|
`),
    group('skin', 'Лице и тяло', 'Face and body', `
facial|Козметична процедура за лице|Facial treatment|процедура за лице
facial-cleansing|Почистване на лице|Facial cleansing|дълбоко почистване
hydrating-facial|Хидратираща терапия за лице|Hydrating facial|
facial-massage|Масаж на лице|Facial massage|
facial-peel|Козметичен пилинг|Cosmetic peel|пилинг на лице
face-mask|Маска за лице|Face mask|
brow-shaping|Оформяне на вежди|Eyebrow shaping|вежди;пинсета
brow-tint|Боядисване на вежди|Eyebrow tinting|боя за вежди
brow-lamination|Ламиниране на вежди|Brow lamination|
lash-lift|Ламиниране на мигли|Lash lift|повдигане на мигли
lash-tint|Боядисване на мигли|Eyelash tinting|
lash-extensions|Удължаване на мигли|Eyelash extensions|миглопластика
lash-infill|Поддръжка на мигли|Eyelash infill|
lash-removal|Сваляне на мигли|Eyelash extension removal|
waxing|Кола маска|Waxing|коламаска
leg-waxing|Кола маска на крака|Leg waxing|
arm-waxing|Кола маска на ръце|Arm waxing|
underarm-waxing|Кола маска на подмишници|Underarm waxing|
bikini-waxing|Кола маска на бикини зона|Bikini waxing|
face-waxing|Кола маска на лице|Facial waxing|
sugaring|Захарна епилация|Sugaring|шугаринг
laser-hair-removal|Лазерна епилация|Laser hair removal|лазерно обезкосмяване
body-massage|Релаксиращ масаж|Relaxation massage|масаж на тяло
body-scrub|Пилинг на тяло|Body scrub|
body-wrap|Обвиване на тяло|Body wrap|
`),
    group('makeup', 'Грим', 'Makeup', `
day-makeup|Дневен грим|Day makeup|ежедневен грим
evening-makeup|Вечерен грим|Evening makeup|официален грим
bridal-makeup|Булчински грим|Bridal makeup|сватбен грим
trial-makeup|Пробен грим|Makeup trial|
photo-makeup|Грим за фотосесия|Photoshoot makeup|
prom-makeup|Абитуриентски грим|Prom makeup|бален грим
makeup-lesson|Индивидуален урок по грим|Private makeup lesson|самогримиране
false-lashes|Поставяне на изкуствени мигли|False lash application|
permanent-brows|Перманентен грим на вежди|Permanent eyebrow makeup|микропигментация на вежди
permanent-lips|Перманентен грим на устни|Permanent lip makeup|
`),
  ]),
  auto: Object.freeze([
    group('maintenance', 'Автосервиз', 'Vehicle maintenance', `
diagnostics|Компютърна диагностика|Computer diagnostics|диагностика на автомобил;obd
oil-filters|Смяна на масло и филтри|Oil and filter change|масло
repair-estimate|Преглед и оценка за ремонт|Inspection and repair estimate|оглед за ремонт
engine-oil|Смяна на двигателно масло|Engine oil change|
air-filter|Смяна на въздушен филтър|Air filter change|
cabin-filter|Смяна на филтър на купето|Cabin filter change|поленов филтър
fuel-filter|Смяна на горивен филтър|Fuel filter change|
brake-pads|Смяна на накладки|Brake pad replacement|накладки
brake-discs|Смяна на спирачни дискове|Brake disc replacement|
brake-fluid|Смяна на спирачна течност|Brake fluid change|
brake-check|Проверка на спирачки|Brake inspection|
suspension|Диагностика на ходова част|Suspension inspection|ходова част
shock-absorbers|Смяна на амортисьори|Shock absorber replacement|
wheel-alignment|Реглаж на преден и заден мост|Wheel alignment|реглаж;геометрия
timing-belt|Смяна на ангренажен ремък|Timing belt replacement|ангренаж
clutch|Смяна на съединител|Clutch replacement|
gearbox-oil|Смяна на масло на скоростна кутия|Gearbox oil change|
battery-test|Проверка на акумулатор|Battery test|
battery-replace|Смяна на акумулатор|Battery replacement|
electrical|Диагностика на автоелектроника|Vehicle electrical diagnostics|автоелектричар
lights|Реглаж на фарове|Headlight alignment|
bulb-replace|Смяна на крушки|Bulb replacement|
ac-check|Диагностика на автоклиматик|Car air conditioning diagnostics|климатик
ac-service|Обслужване на автоклиматик|Car air conditioning service|зареждане на климатик
coolant|Смяна на антифриз|Coolant change|антифриз
exhaust|Ремонт на изпускателна система|Exhaust repair|ауспух;гърне
purchase-inspection|Преглед преди покупка на автомобил|Pre-purchase vehicle inspection|
annual-inspection|Годишен технически преглед|Annual vehicle inspection|гтп
`),
    group('tyres', 'Гуми', 'Tyres', `
tyre-change|Смяна на гуми|Tyre change|гуми;tires
wheel-balance|Баланс на гуми|Wheel balancing|баланс
puncture|Ремонт на спукана гума|Puncture repair|
tyre-storage|Съхранение на гуми|Tyre storage|хотел за гуми
rim-repair|Изправяне на джанти|Wheel rim straightening|джанти
tpms|Проверка на датчици за налягане|Tyre pressure sensor check|tpms
`),
    group('detailing', 'Автомивка и детайлинг', 'Car washing and detailing', `
exterior-wash|Външно измиване на автомобил|Exterior car wash|автомивка;миене на кола
interior-clean|Вътрешно почистване на автомобил|Interior car cleaning|
full-wash|Комплексно измиване на автомобил|Full car wash|
upholstery|Пране на автомобилен салон|Car upholstery cleaning|пране на седалки
leather-care|Почистване и подхранване на кожа|Leather cleaning and conditioning|
car-polish|Полиране на автомобил|Car polishing|пастиране
ceramic-coating|Керамично покритие|Ceramic coating|
headlight-polish|Полиране на фарове|Headlight polishing|
engine-clean|Почистване на двигател|Engine cleaning|
paint-protection|Поставяне на защитно фолио|Paint protection film installation|ppf
window-tint|Фолиране на автостъкла|Car window tinting|
dent-repair|Ремонт на вдлъбнатини|Dent repair|
bodywork|Оглед за тенекеджийски ремонт|Bodywork assessment|
car-paint|Оглед за автобоядисване|Car paint assessment|боядисване на автомобил;боя
`),
  ]),
  fitness: Object.freeze([
    group('training', 'Тренировки', 'Training', `
personal-training|Индивидуална тренировка|Personal training|персонална тренировка
consultation|Консултация|Consultation|спортна консултация
functional|Функционална тренировка|Functional training|
strength|Силова тренировка|Strength training|
conditioning|Кондиционна тренировка|Conditioning session|
group-training|Групова тренировка|Group training|
mobility|Мобилност и раздвижване|Mobility training|
stretching|Стречинг|Stretching|
fitness-assessment|Оценка на физическа подготовка|Fitness assessment|
training-plan|Изготвяне на тренировъчна програма|Training plan consultation|
`),
    group('martial-arts', 'Бойни изкуства', 'Martial arts', `
boxing|Тренировка по бокс|Boxing session|бокс
kickboxing|Тренировка по кикбокс|Kickboxing session|кикбокс
mma|Тренировка по ММА|MMA session|мма;смесени бойни изкуства
karate|Тренировка по карате|Karate session|карате
kung-fu|Тренировка по кунгфу|Kung fu session|кунгфу;кунг фу
muay-thai|Тренировка по муай тай|Muay Thai session|муай тай;тай бокс
taekwondo|Тренировка по таекуондо|Taekwondo session|таекуондо
judo|Тренировка по джудо|Judo session|джудо
bjj|Тренировка по бразилско жиу-жицу|Brazilian jiu-jitsu session|bjj;бжж;бразилско жиу жицу
jiu-jitsu|Тренировка по жиу-жицу|Jiu-jitsu session|жиу жицу
wrestling|Тренировка по борба|Wrestling session|борба
sambo|Тренировка по самбо|Sambo session|самбо
aikido|Тренировка по айкидо|Aikido session|айкидо
krav-maga|Тренировка по крав мага|Krav Maga session|крав мага
wing-chun|Тренировка по вин чун|Wing Chun session|вин чун
fencing|Урок по фехтовка|Fencing lesson|фехтовка
self-defence|Тренировка по самоотбрана|Self-defence session|самоотбрана
children-martial|Детска тренировка по бойни изкуства|Children's martial arts session|
private-boxing|Индивидуален урок по бокс|Private boxing lesson|
intro-martial|Въвеждаща тренировка по бойни изкуства|Introductory martial arts session|
`),
    group('movement', 'Движение и спорт', 'Movement and sports', `
yoga|Практика по йога|Yoga session|йога;yoga
private-yoga|Индивидуална йога практика|Private yoga session|
pilates|Тренировка по пилатес|Pilates session|пилатес
reformer|Пилатес реформър|Reformer Pilates|реформър;reformer
dance|Урок по танци|Dance lesson|танци
ballroom|Урок по спортни танци|Ballroom dance lesson|
salsa|Урок по салса|Salsa lesson|салса
bachata|Урок по бачата|Bachata lesson|бачата
folk-dance|Урок по народни танци|Folk dance lesson|народни танци
swimming|Урок по плуване|Swimming lesson|плуване
tennis|Урок по тенис|Tennis lesson|тенис
table-tennis|Урок по тенис на маса|Table tennis lesson|
badminton|Урок по бадминтон|Badminton lesson|бадминтон
squash|Урок по скуош|Squash lesson|скуош
climbing|Урок по катерене|Climbing lesson|катерене
horse-riding|Урок по конна езда|Horse riding lesson|езда
skiing|Урок по ски|Ski lesson|ски
snowboard|Урок по сноуборд|Snowboard lesson|сноуборд
`),
  ]),
  education: Object.freeze([
    group('school', 'Учебни предмети', 'School subjects', `
private-lesson|Индивидуален урок|Private lesson|частен урок
level-assessment|Входно ниво|Level assessment|тест за ниво
mathematics|Урок по математика|Mathematics lesson|математика
bulgarian|Урок по български език и литература|Bulgarian language and literature lesson|бел;български
physics|Урок по физика|Physics lesson|физика
chemistry|Урок по химия|Chemistry lesson|химия
biology|Урок по биология|Biology lesson|биология
history|Урок по история|History lesson|история
geography|Урок по география|Geography lesson|география
informatics|Урок по информатика|Informatics lesson|информатика
primary-school|Подготовка за начални класове|Primary school tutoring|
nvo-preparation|Подготовка за НВО|National assessment preparation|нво
school-finals|Подготовка за матура|School-leaving exam preparation|матура;дзи
university-entry|Кандидатстудентска подготовка|University entrance preparation|
homework|Помощ с домашни работи|Homework support|
`),
    group('languages', 'Езици', 'Languages', `
english|Урок по английски език|English lesson|английски
german|Урок по немски език|German lesson|немски
french|Урок по френски език|French lesson|френски
spanish|Урок по испански език|Spanish lesson|испански
italian|Урок по италиански език|Italian lesson|италиански
russian|Урок по руски език|Russian lesson|руски
greek|Урок по гръцки език|Greek lesson|гръцки
turkish|Урок по турски език|Turkish lesson|турски
bulgarian-foreign|Български език за чужденци|Bulgarian for foreigners|
conversation|Разговорна езикова практика|Language conversation practice|
business-english|Бизнес английски|Business English lesson|
language-exam|Подготовка за езиков изпит|Language exam preparation|
`),
    group('creative', 'Творчески и практически уроци', 'Creative and practical lessons', `
piano|Урок по пиано|Piano lesson|пиано
guitar|Урок по китара|Guitar lesson|китара
violin|Урок по цигулка|Violin lesson|цигулка
drums|Урок по барабани|Drum lesson|барабани
singing|Урок по пеене|Singing lesson|вокален урок;пеене
music-theory|Урок по солфеж|Music theory lesson|солфеж
drawing|Урок по рисуване|Drawing lesson|рисуване
painting|Урок по живопис|Painting lesson|живопис
pottery|Урок по керамика|Pottery lesson|керамика
photography|Урок по фотография|Photography lesson|фотография
programming|Урок по програмиране|Programming lesson|програмиране
robotics|Урок по роботика|Robotics lesson|роботика
chess|Урок по шах|Chess lesson|шах
driving|Практически урок по шофиране|Practical driving lesson|шофиране;кормуване
computer-skills|Урок по компютърна грамотност|Computer skills lesson|
`),
  ]),
  consulting: Object.freeze([
    group('professional', 'Професионални консултации', 'Professional consultations', `
initial-consultation|Първа консултация|Initial consultation|
follow-up|Последваща среща|Follow-up meeting|
legal|Правна консултация|Legal consultation|адвокат
contract-review|Преглед на договор|Contract review|
company-formation|Консултация за регистрация на фирма|Company formation consultation|
employment-law|Консултация по трудово право|Employment law consultation|
family-law|Консултация по семейно право|Family law consultation|
property-law|Консултация по имотно право|Property law consultation|
accounting|Счетоводна консултация|Accounting consultation|счетоводство
tax|Данъчна консултация|Tax consultation|данъци
annual-return|Консултация за годишна данъчна декларация|Annual tax return consultation|
payroll|Консултация за заплати и осигуровки|Payroll consultation|
financial|Финансова консултация|Financial consultation|
mortgage|Ипотечна консултация|Mortgage consultation|ипотека
insurance|Застрахователна консултация|Insurance consultation|застраховки
real-estate|Консултация за недвижим имот|Real estate consultation|
property-viewing|Оглед на имот|Property viewing|
property-valuation|Среща за оценка на имот|Property valuation meeting|
career|Кариерна консултация|Career consultation|
cv|Преглед на автобиография|CV review|автобиография;cv
interview|Подготовка за интервю|Interview preparation|
business|Бизнес консултация|Business consultation|
marketing|Маркетинг консултация|Marketing consultation|
social-media|Консултация за социални мрежи|Social media consultation|
website|Консултация за уебсайт|Website consultation|
it|ИТ консултация|IT consultation|информационни технологии
cybersecurity|Консултация по киберсигурност|Cybersecurity consultation|
hr|Консултация по човешки ресурси|Human resources consultation|човешки ресурси
translation|Консултация за превод|Translation consultation|
notary|Нотариална консултация|Notarial consultation|нотариус
`),
  ]),
  home_services: Object.freeze([
    group('repairs', 'Ремонти и монтаж', 'Repairs and installation', `
inspection|Оглед на адрес|On-site inspection|оглед
service-visit|Посещение за услуга|Service visit|
plumbing|ВиК ремонт|Plumbing repair|водопроводчик;вик
leak|Откриване на теч|Leak detection|теч
drain|Отпушване на канал|Drain unblocking|отпушване
tap|Смяна на смесител|Tap replacement|батерия за мивка
toilet|Монтаж на тоалетна|Toilet installation|
water-heater|Монтаж на бойлер|Water heater installation|бойлер
water-heater-repair|Ремонт на бойлер|Water heater repair|
electrical|Електроремонт|Electrical repair|електротехник;ел услуги
socket|Монтаж на контакти и ключове|Socket and switch installation|
lighting|Монтаж на осветителни тела|Light fixture installation|полилей;лампа
electrical-panel|Ремонт на електрическо табло|Electrical panel repair|
aircon-install|Монтаж на климатик|Air conditioner installation|климатик
aircon-clean|Почистване на климатик|Air conditioner cleaning|
aircon-repair|Ремонт на климатик|Air conditioner repair|
painting|Боядисване на стени|Wall painting|боя;боядисване;латекс
plastering|Шпакловка|Wall plastering|
wallpaper|Лепене на тапети|Wallpaper installation|тапети
drywall|Монтаж на гипсокартон|Plasterboard installation|гипсокартон
tiles|Полагане на плочки|Tile installation|фаянс;теракот
grouting|Фугиране|Grouting|фуги
laminate|Монтаж на ламинат|Laminate flooring installation|ламинат
parquet|Циклене на паркет|Parquet sanding|паркет
skirting|Монтаж на первази|Skirting board installation|
door|Монтаж на врата|Door installation|
locksmith|Ключарска услуга|Locksmith service|ключар
lock-replace|Смяна на брава|Lock replacement|брава
window-repair|Ремонт на дограма|Window frame repair|дограма
insect-screen|Монтаж на комарници|Insect screen installation|комарник
blinds|Монтаж на щори|Blind installation|щори
furniture|Сглобяване на мебели|Furniture assembly|мебели
kitchen|Монтаж на кухня|Kitchen installation|
carpentry|Дърводелска услуга|Carpentry service|дърводелец
appliance|Ремонт на домакински уред|Household appliance repair|
washing-machine|Ремонт на пералня|Washing machine repair|пералня
dishwasher|Ремонт на съдомиялна|Dishwasher repair|съдомиялна
fridge|Ремонт на хладилник|Refrigerator repair|хладилник
oven|Ремонт на фурна|Oven repair|фурна
roof|Оглед за ремонт на покрив|Roof repair inspection|покрив
waterproofing|Хидроизолация|Waterproofing|
`),
    group('cleaning', 'Почистване и грижа за дома', 'Cleaning and home care', `
home-clean|Почистване на дом|Home cleaning|почистване
deep-clean|Основно почистване|Deep cleaning|
post-renovation|Почистване след ремонт|Post-renovation cleaning|
window-clean|Измиване на прозорци|Window cleaning|
sofa-clean|Пране на диван|Sofa cleaning|диван
carpet-clean|Пране на килими|Carpet cleaning|килими
mattress-clean|Пране на матрак|Mattress cleaning|матрак
oven-clean|Почистване на фурна|Oven cleaning|
office-clean|Почистване на офис|Office cleaning|
garden|Поддръжка на градина|Garden maintenance|градинар
lawn|Косене на трева|Lawn mowing|
hedge|Подрязване на жив плет|Hedge trimming|
irrigation|Ремонт на поливна система|Irrigation system repair|
moving|Услуга при преместване|Moving service|хамали;преместване
furniture-transport|Транспорт на мебели|Furniture transport|
waste-removal|Извозване на стари мебели|Old furniture removal|
pest-control|Обработка срещу вредители|Pest control visit|дезинсекция;дератизация
`),
  ]),
  pets: Object.freeze([
    group('grooming', 'Груминг', 'Grooming', `
grooming|Груминг|Grooming|
consultation|Консултация|Consultation|консултация за домашен любимец
dog-groom|Подстригване на куче|Dog haircut|кучешко подстригване
cat-groom|Подстригване на котка|Cat haircut|
dog-bath|Къпане на куче|Dog bath|
cat-bath|Къпане на котка|Cat bath|
brush|Разресване|Brushing|разресване на козина
deshed|Премахване на подкосъм|Deshedding|подкосъм
dematting|Разплитане на сплъстена козина|Dematting|
hand-strip|Триминг на козина|Hand stripping|триминг
pet-nails|Подрязване на нокти|Nail trimming|
paw-care|Грижа за лапи|Paw care|
ear-clean|Почистване на уши|Ear cleaning|
eye-area|Почистване около очите|Eye area cleaning|
sanitary-trim|Хигиенно подстригване|Sanitary trim|
puppy-groom|Първо посещение за груминг на кученце|Puppy's first grooming visit|
coat-care|Консултация за грижа за козината|Coat care consultation|
`),
    group('pet-care', 'Обучение и грижа', 'Training and care', `
dog-training|Индивидуално обучение на куче|Private dog training|дресура
puppy-training|Обучение на кученце|Puppy training|
obedience|Тренировка по послушание|Dog obedience training|
behaviour|Поведенческа консултация за куче|Dog behaviour consultation|
socialisation|Социализация на куче|Dog socialisation session|
dog-walk|Разходка на куче|Dog walking|
pet-sitting|Посещение за грижа за домашен любимец|Pet sitting visit|гледане на любимец
boarding-meeting|Опознавателна среща за хотел за любимци|Pet boarding introduction|
daycare-intro|Опознавателно посещение за дневна грижа|Pet daycare introduction|
pet-transport|Транспорт на домашен любимец|Pet transport|
pet-photo|Фотосесия на домашен любимец|Pet photoshoot|
`),
  ]),
  health: Object.freeze([
    // Owner scope is dental care, psychology and psychiatry only. No general
    // clinic departments, other physician specialties or laboratory panels.
    group('dental', 'Стоматология', 'Dental care', `
initial-consultation|Първична консултация|Initial consultation|
dental-exam|Стоматологичен преглед|Dental examination|зъболекар;стоматолог
dental-follow-up|Контролен стоматологичен преглед|Dental follow-up|
dental-cleaning|Почистване на зъбен камък|Dental scaling|зъбен камък
dental-polish|Полиране на зъби|Tooth polishing|
filling|Поставяне на пломба|Dental filling|пломба
root-canal|Кореново лечение|Root canal treatment|
extraction|Изваждане на зъб|Tooth extraction|вадене на зъб
whitening|Избелване на зъби|Teeth whitening|
crown|Консултация за зъбна коронка|Dental crown consultation|
bridge|Консултация за зъбен мост|Dental bridge consultation|
denture|Консултация за зъбна протеза|Denture consultation|
implant|Консултация за зъбен имплант|Dental implant consultation|
orthodontic|Ортодонтска консултация|Orthodontic consultation|брекети;алайнери
braces-adjustment|Контрол и корекция на брекети|Braces adjustment|
child-dental|Детски стоматологичен преглед|Children's dental examination|
fissure-sealant|Поставяне на силанти|Dental sealant application|
gum-consultation|Консултация за венци|Gum care consultation|
`),
    group('mental-health', 'Психология и психиатрия', 'Psychology and psychiatry', `
therapy-session|Терапевтична сесия|Therapy session|
psychologist|Консултация с психолог|Psychologist consultation|психолог
psychologist-first|Първа среща с психолог|Initial psychologist appointment|
psychologist-follow-up|Последваща среща с психолог|Psychologist follow-up|
individual-therapy|Индивидуална психотерапия|Individual psychotherapy|психотерапия
couples|Консултация за двойки|Couples consultation|семейно консултиране
family|Семейна психотерапия|Family psychotherapy|
child-psychologist|Консултация с детски психолог|Child psychologist consultation|
parent-consultation|Психологическа консултация за родители|Psychological consultation for parents|
group-therapy|Групова психотерапия|Group psychotherapy|
online-therapy|Онлайн психологическа консултация|Online psychological consultation|
psychiatrist|Консултация с психиатър|Psychiatrist consultation|психиатър
psychiatrist-first|Първичен психиатричен преглед|Initial psychiatric appointment|
psychiatrist-follow-up|Контролен психиатричен преглед|Psychiatric follow-up|
psychological-assessment|Психологично изследване|Psychological assessment|
`),
  ]),
  other: Object.freeze([
    group('appointments', 'Услуги с предварителен час', 'Appointment services', `
consultation|Консултация|Consultation|
intro-meeting|Опознавателна среща|Introductory meeting|
project-meeting|Среща за обсъждане на проект|Project consultation|
photo-session|Индивидуална фотосесия|Portrait photoshoot|фотосесия
family-photo|Семейна фотосесия|Family photoshoot|
business-photo|Бизнес портрет|Business portrait|
product-photo|Продуктова фотография|Product photography|
video|Заснемане на видео|Video recording session|
studio-session|Запис в звукозаписно студио|Recording studio session|
tailor-fitting|Проба при шивач|Tailor fitting|шивач
clothing-alteration|Консултация за корекция на дреха|Clothing alteration consultation|
wedding-fitting|Проба на сватбена рокля|Wedding dress fitting|
shoe-repair|Приемане за ремонт на обувки|Shoe repair appointment|обущар
watch-repair|Приемане за ремонт на часовник|Watch repair appointment|часовникар
jewellery|Консултация за изработка на бижу|Custom jewellery consultation|бижутер
phone-repair|Диагностика на телефон|Phone diagnostics|ремонт на телефон
computer-repair|Диагностика на компютър|Computer diagnostics|ремонт на компютър
bicycle-repair|Преглед на велосипед|Bicycle inspection|ремонт на велосипед
instrument-service|Настройка на музикален инструмент|Musical instrument setup|
event-planning|Консултация за организация на събитие|Event planning consultation|
wedding-planning|Консултация за сватбена организация|Wedding planning consultation|
interior-design|Консултация за интериорен дизайн|Interior design consultation|
architecture|Архитектурна консултация|Architectural consultation|
tattoo-consultation|Консултация за татуировка|Tattoo consultation|татуировка
tattoo-session|Сесия за татуиране|Tattoo session|
piercing|Поставяне на пиърсинг|Piercing appointment|пиърсинг
floral-design|Консултация за флорална декорация|Floral design consultation|
personal-styling|Консултация за личен стил|Personal styling consultation|
`),
  ]),
})
