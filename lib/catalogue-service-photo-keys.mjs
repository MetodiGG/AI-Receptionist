import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS } from './catalogue-service-photo-associations.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113 } from './catalogue-service-photo-associations-20261113.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116 } from './catalogue-service-photo-associations-20261116.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122 } from './catalogue-service-photo-associations-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122 } from './catalogue-service-photo-associations-azis-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122 } from './catalogue-service-photo-associations-suhodol-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123 } from './catalogue-service-photo-associations-intake-20261123.mjs'
import { specificServicePhotoKey } from './specific-service-photo-ids.mjs'
import { catalogueBusinessDetails } from './discovery/business-details.mjs'

// Only this server adapter imports the exact-name inventory. Browser payloads
// carry a small allowlisted image ID, not thousands of catalogue names.
const key = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])
const associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123]
  .map(([businessId, category, name, photoId]) => [key(businessId, category, name), photoId]))
associations.set(key('sofia-mline-auto-detailing-gorublyane-pionerska2', 'detailing', 'Интериорен детайлинг'), 'sx-detail-complete-interior')
associations.set(key('sofia-luckydent-dragalevtsi-gluharche10', 'other', 'Първичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-part-time-pavlovo-duychev12v', 'education', 'Групово актьорско майсторство на английски за деца'), 'sx-acting-child')
associations.set(key('sofia-galileodent-nadezhda4-lomsko182', 'other', 'Профилактичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-vm-auto-service-obelya-2-lomsko248a', 'auto_repair', 'Компютърна диагностика на автомобил'), 'auto-diagnostics')
associations.set(key('sofia-umni-deca-obelya2-106-3', 'education', 'Ментална аритметика за деца · математика с абакус'), 'sx-child-abacus-group')
associations.set(key('sofia-doichinova-lyulin3-block368', 'other', 'Първичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-dbros-vrazhdebna-botevgradsko431', 'auto_repair', 'Компютърна диагностика на двигател и електроника'), 'auto-diagnostics')
associations.set(key('sofia-dbros-vrazhdebna-botevgradsko431', 'auto_repair', 'Проверка на окачване и кормилно управление'), 'sx-auto-suspension-diagnose-repair')
associations.set(key('sofia-kabident-lyulin9-vlaikov27', 'other', 'Лечение на кариес'), 'dental-filling')
associations.set(key('sofia-neksas-academy-chelopechene-yane28', 'education', 'Присъствен курс по заваряване'), 'sx-in-person-welding-course')
associations.set(key('sofia-pakosti-chudati-botunets-levski5', 'other', 'Рожден ден на открито – половин ден'), 'sx-outdoor-birthday-venue')
associations.set(key('sofia-pakosti-chudati-botunets-levski5', 'other', 'Рожден ден на открито – цял ден'), 'sx-outdoor-birthday-venue')
associations.set(key('sofia-ac-power-suhodol-badeshte4a', 'auto_repair', 'Машинно почистване на DPF/FAP филтър'), 'sx-auto-filter-machine-cleaning')
associations.set(key('sofia-mikron-dotsev-knyazhevo-tsarboris298', 'auto_repair', 'Оглед и диагностика на шибидах или панорамна система'), 'sx-auto-sunroof-inspection')
associations.set(key('sofia-my-reformer-space-levski-g-vazov39', 'fitness', 'Пилатес реформър – еднократна групова тренировка'), 'sx-reformer-group')
associations.set(key('sofia-unigas-romano-voenna-rampa-konstantin3', 'auto_repair', 'Монтаж на газов инжекцион Romano Antonio ECO — 4 цилиндъра'), 'sx-auto-lpg-injection-installation')
associations.set(key('sofia-sm-group-korekt-druzhba1-block182', 'consulting', 'Първоначална счетоводна консултация'), 'accounting-consultation')
associations.set(key('sofia-mushmula-poligona-tsarigradsko111v', 'fitness', 'Групова HIIT тренировка'), 'sx-hiit-group')
associations.set(key('sofia-koba-auto-bosch-rodopi27', 'auto_repair', 'Компютърна диагностика на автомобил'), 'auto-diagnostics')
associations.set(key('sofia-ucha-land-dianabad-novachnitsa3', 'education', 'Групов курс по шах за деца'), 'sx-child-chess-group')
associations.set(key('sofia-infinity-team-strelbishte-bulgaria43', 'fitness', 'Пробна групова тренировка по спортни танци'), 'sx-adult-ballroom-group')
associations.set(key('sofia-horo-moderno-predgradie-evropa20', 'fitness', 'Български народни танци за начинаещи'), 'sx-bulgarian-folk-group')
associations.set(key('sofia-sharen-svyat-lyulin5-block519g', 'other', 'Детски рожден ден · пакет за 10 деца'), 'sx-indoor-childrens-birthday-party')
associations.set(key('sofia-salt-hug-druzhba1-block195v', 'health', 'Солна стая за възрастен · едно посещение'), 'sx-adult-salt-room')
associations.set(key('sofia-nikolay-frantsov-druzhba1-block18v', 'other', 'Първичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-solux-auto-pavlina4', 'auto_repair', 'Диагностика на двигател'), 'auto-diagnostics')
associations.set(key('sofia-mopart-lyulin3-okolovrasten803', 'auto_repair', 'Компютърна диагностика на двигател'), 'auto-diagnostics')
associations.set(key('sofia-mopart-lyulin3-okolovrasten803', 'auto_repair', 'Обслужване на спирачки'), 'sx-auto-brake-disc')
associations.set(key('sofia-mopart-lyulin3-okolovrasten803', 'auto_repair', 'Машинна смяна на масло на автоматична скоростна кутия'), 'sx-auto-auto-gear-oil-filter')
associations.set(key('sofia-solema-lyulin3-block348', 'education', 'Групова подготовка по математика · двама ученици'), 'math-lesson')
associations.set(key('sofia-alice-academy-lyulin3-block389', 'education', 'Индивидуален тест за ниво по английски · за възрастни'), 'language-lesson')
associations.set(key('sofia-bs-wrap-studio-studentski-stranski3b', 'detailing', 'PPF защитно фолио · предна част'), 'sx-detail-ppf-front')
associations.set(key('sofia-bs-wrap-studio-studentski-stranski3b', 'detailing', 'Цветно фолио за автомобил'), 'sx-detail-colour-wrap')
associations.set(key('sofia-as-vavilon-vrabnitsa2-block632d', 'education', 'Шофьорски курс за категория B'), 'driving-lesson')
associations.set(key('sofia-best-moments-photography-lyulin6-block641', 'other', 'Семейна фотосесия · Мини · 7 кадъра'), 'sx-family-studio-photoshoot')
associations.set(key('sofia-reya-kids-ovcha-kupel2-ivan-hadzhiyski3', 'education', 'Неделен курс по английски език за деца'), 'sx-child-language-group')
associations.set(key('sofia-art-academy-banishora-kozloduy128', 'education', 'Частно ателие по рисуване за екипи · 5–10 души'), 'sx-adult-acrylic-painting-wine')
associations.set(key('sofia-va-consulting-lyulin10-block135', 'consulting', 'Данъчна консултация за фирми и физически лица'), 'accounting-consultation')
associations.set(key('sofia-essentisimo-banishora-karlovo7', 'hair', 'Дамско подстригване'), 'womens-haircut')
associations.set(key('sofia-essentisimo-banishora-karlovo7', 'nails', 'Маникюр с гел лак'), 'gel-manicure')
associations.set(key('sofia-hairless-hipodruma-hanpresiyan15', 'beauty', 'Козметична грижа за лице · Express Skin Reset'), 'facial-cleansing')
associations.set(key('sofia-nn-architecture-hladilnika-banat34', 'consulting', 'Интериорна консултация · пакет „Бърз съвет“ при Нели Николова'), 'sx-interior-design-consultation')
associations.set(key('sofia-nn-architecture-hladilnika-banat34', 'consulting', 'Цялостна интериорна консултация при Нели Николова'), 'sx-interior-design-consultation')
associations.set(key('sofia-abv-academy-reduta-velcho-atanasov53', 'education', 'Състезателна математика · 1.–4. клас'), 'sx-child-math-group')
associations.set(key('sofia-masters-dance-lyulin-centre-nenov29', 'fitness', 'Български народни танци за начинаещи възрастни'), 'sx-bulgarian-folk-group')
associations.set(key('sofia-candy-house-lyulin10-mayski-den22', 'other', 'Детско тържество · пакет за 10 деца'), 'sx-indoor-childrens-birthday-party')
associations.set(key('sofia-koba-auto-paris14', 'auto_repair', 'Компютърна диагностика на автомобил'), 'auto-diagnostics')
associations.set(key('sofia-kis-auto-simeonovo-bosilek3', 'auto_repair', 'Боядисване на броня'), 'sx-auto-bumper-spray-paint')
associations.set(key('sofia-kis-auto-simeonovo-bosilek3', 'auto_repair', 'Боядисване на врата или калник'), 'sx-auto-panel-spray-paint')
associations.set(key('sofia-kis-auto-simeonovo-bosilek3', 'auto_repair', 'Изчукване и подмяна на каросерийни детайли'), 'sx-auto-body-panel-repair')
associations.set(key('sofia-next-level-knyazhevo-tsar-boris272', 'fitness', 'Фитнес и групови тренировки · 7-дневна карта'), 'sx-hiit-group')
associations.set(key('sofia-gemini4-republika-729-22', 'auto_repair', 'Ремонт на автоматична скоростна кутия'), 'sx-auto-gearbox-removal')
associations.set(key('sofia-alva-dental-hadzhi-dimitar107v', 'other', 'Профилактичен стоматологичен преглед'), 'dental-exam')
associations.set(key('sofia-alva-dental-hadzhi-dimitar107v', 'other', 'Професионално почистване на зъбен камък и полиране'), 'dental-cleaning')
associations.set(key('sofia-salt-home-druzhba2-block302a', 'fitness', 'Йога в солна стая · групова практика'), 'yoga-class')
associations.set(key('sofia-logos152-simeonovo-krairechna10', 'education', 'Групов курс по английски език за ученици'), 'sx-child-language-group')
associations.set(key('sofia-logos152-simeonovo-krairechna10', 'education', 'Индивидуален урок по английски език'), 'language-lesson')
associations.set(key('sofia-emika-druzhba2-block204', 'education', 'Подготовка за НВО след 4. клас · БЕЛ и математика'), 'sx-school-tutoring-pair')
associations.set(key('sofia-silver-star-ring-mall-okolovrasten214', 'auto_repair', 'Смяна на спирачни дискове'), 'sx-auto-brake-disc')
associations.set(key('sofia-elizabet-ritmika-dragalevtsi-bela-dona1', 'fitness', 'Групова художествена гимнастика за деца'), 'sx-child-rhythmic-gymnastics-group')
associations.set(key('sofia-avtotapicera-iliyantsi-balcho7', 'detailing', 'Претапициране на волан'), 'sx-detail-steering-restore')
associations.set(key('sofia-carplay-bulgaria-gorublyane-pionerska2', 'auto_repair', 'Монтаж и настройка на автомобилна мултимедия'), 'sx-auto-audio-navigation-module-repair')
associations.set(key('sofia-partydots-druzhba2-block280e', 'other', 'Класическо детско парти'), 'sx-indoor-childrens-birthday-party')
associations.set(key('sofia-partydots-druzhba2-block280e', 'other', 'Тематично детско парти'), 'sx-indoor-childrens-birthday-party')
associations.set(key('sofia-partydots-druzhba2-block280e', 'other', 'Премиум детско парти с кетъринг'), 'sx-child-birthday-reportage')
associations.set(key('sofia-karting-ring-academy-simeonovo-214', 'fitness', 'Групов курс по картинг за деца (6–17 г.)'), 'sx-karting-driving-course')
associations.set(key('sofia-karting-ring-academy-simeonovo-214', 'fitness', 'Групов курс по картинг за възрастни (18+)'), 'sx-karting-driving-course')
associations.set(key('sofia-terpsihora-lyulin5-504-1', 'fitness', 'Класически балет за деца от 6 до 8 години'), 'sx-child-ballet')
for (const name of [
  'Машинно пране на килими · стандартна поръчка',
  'Машинно пране на килими · бърза поръчка',
  'Машинно пране на килими · експресна поръчка',
  'Машинно пране на килими над 12 м²',
]) associations.set(key('sofia-kanev-carpet-knyazhevo-buket55', 'home_services', name), 'carpet-cleaning')
for (const vehicle of ['купе', 'седан / комби', 'SUV', 'джип', 'хеви джип']) {
  associations.set(key('sofia-dca-garage-levski-v-letostruy27', 'detailing', `Фолиране на задни автомобилни стъкла · ${vehicle}`), 'vehicle-window-tint')
}
for (const schedule of ['едно посещение', 'едно посещение седмично', 'две посещения седмично']) {
  associations.set(key('sofia-elit-chess-sveta-troitsa-hisarya3a', 'education', `Шахмат за деца · ${schedule}`), 'sx-child-chess-group')
}
associations.set(key('sofia-studio-s-hadzhi-dimitar-vastanik5', 'education', 'Групов курс по математика за 6. клас'), 'math-lesson')
associations.set(key('sofia-studio-s-hadzhi-dimitar-vastanik5', 'education', 'Групов курс по български език и литература за 6. клас'), 'sx-school-literature-group')
associations.set(key('sofia-smartykids-lyulin9-block954', 'education', 'Пробен урок по ментална аритметика за деца'), 'sx-child-abacus-group')
associations.set(key('sofia-limoncello-kids-buxton-gortalov1', 'other', 'Посещение на закрит детски кът · 1 час'), 'sx-child-psychomotor-group')
associations.set(key('sofia-sr-cars-ovcha-kupel-boychev4', 'auto_repair', 'Баланс на гуми с HUNTER Road Force'), 'sx-auto-workshop-tyre-fit-balance')
associations.set(key('sofia-yonitrade-suhata-reka-block10a', 'education', 'Шофьорски курс за категория B'), 'driving-lesson')
associations.set(key('sofia-active-dental-mladost2-block295', 'other', 'Почистване на зъбен камък'), 'dental-cleaning')
associations.set(key('sofia-active-dental-mladost2-block295', 'other', 'Лечение на кариес'), 'dental-filling')
associations.set(key('sofia-drive-school-knyazhevo-tsar-boris365', 'education', 'Стандартен шофьорски курс · категория B'), 'driving-lesson')
associations.set(key('sofia-sokol-tennis-benkovski-stadium', 'fitness', 'Наем на открит тенис корт'), 'sx-outdoor-turf-tennis-court')
associations.set(key('sofia-lokomotiv-tennis-voenna-rampa-rozhen23', 'fitness', 'Наем на закрит тенис корт с клей'), 'sx-indoor-clay-tennis-court')
associations.set(key('sofia-kindyroo-lyulin8-tsaritsa-yoanna68', 'education', 'Групови занимания за деца на 3–4 г. · Опосум'), 'sx-child-learning-trial')
associations.set(key('sofia-one-service-vrabnitsa1-276-13', 'auto_repair', 'Компютърна диагностика на автомобил'), 'auto-diagnostics')
associations.set(key('sofia-magazinche-za-znanie-lyulin2', 'education', 'Групов урок по английски за деца'), 'sx-child-language-group')
for (const course of ['WeDo 2.0', 'Spike Essential', 'Spike Prime']) {
  associations.set(key('sofia-sparklab-mladost3-block304-3', 'education', `Курс по роботика · LEGO ${course}`), 'sx-child-robotics')
}
for (const title of [
  'Детски рожден ден · до 10 деца',
  'Детски рожден ден с аниматор · до 10 деца',
  'Семеен рожден ден · до 10 деца и 10 възрастни',
  'Голям семеен рожден ден · до 10 деца и 20 възрастни',
]) associations.set(key('sofia-little-smiles-mladost1-nikola-genadiev5g', 'other', title), 'sx-indoor-childrens-birthday-party')
associations.set(key('sofia-jolly-kids-pavlovo-duychev12v', 'education', 'Английски за деца на 4–7 г. · Jolly Phonics'), 'sx-child-language-group')
for (const [name, photo] of [
  ['Мъжко подстригване', 'mens-haircut'],
  ['Оформяне на брада', 'beard-trim'],
  ['Подстригване и оформяне на брада', 'haircut-beard-combo'],
  ['Кралско бръснене', 'classic-shave'],
  ['Бръснене на глава', 'head-shave'],
  ['Бръснене на глава и оформяне на брада', 'head-shave-beard-trim'],
  ['Подстригване с машинка · един номер', 'one-guard-buzz-cut'],
  ['Оформяне на вежди', 'partner-hair-beard-brows-finish'],
]) associations.set(key('sofia-anev-barber-mladost1a-ahmatova532', 'barber', name), photo)
for (const [name, photo] of [
  ["Дамско подстригване", 'womens-haircut'],
  ["Мъжко подстригване с измиване", 'sx-hair-seq-adult-wash-cut'],
  ["Мъжко подстригване с машинка и измиване", 'mens-haircut'],
  ["Детско подстригване (до 6 години)", 'kids-haircut'],
  ["Подстригване на бретон", 'sx-hair-fringe-trim'],
  ["Сешоар · къса коса", 'sx-womens-short-blowdry-styling'],
  ["Сешоар · средна коса", 'sx-womens-shoulder-blowdry-styling'],
  ["Букли с маша · къса коса", 'sx-hair-tight-wand-curls'],
  ["Букли с маша · средна коса", 'sx-hair-tight-wand-curls'],
  ["Букли с маша · дълга коса", 'sx-hair-tight-wand-curls'],
  ["Кичури с шапка · 30 г блондор", 'sx-hair-cap-highlights'],
  ["Боядисване с боя на клиента", 'full-hair-color'],
  ["Боядисване на корени · до 60 мл боя", 'sx-hair-root-colour-rough-dry'],
  ["Балеаж · средна коса", 'hair-balayage'],
  ["Балеаж · дълга коса", 'hair-balayage'],
  ["Матиране", 'hair-toning'],
  ["Официална прическа", 'formal-event-hairstyle'],
  ["Трайно изправяне с терапия", 'hair-straightening'],
  ["Трайно изправяне · до 6 месеца", 'hair-straightening'],
]) associations.set(key('sofia-wave-studio-lyulin7-nails', 'hair', name), photo)

for (const [name, photo] of [
  ['Монтаж на LED крушки за фарове · автоелектроника', 'sx-auto-bulb-check-replace'],
  ['Регулиране на фарове · автоелектроника', 'sx-auto-headlight-align'],
  ['Смяна на фарове · автоелектроника', 'sx-auto-headlamp-assembly-replacement'],
]) associations.set(key('sofia-garage46-serdika-ivanivanov67', 'auto_repair', name), photo)

associations.set(key('sofia-aura-music-stamboliyski175', 'education', 'Индивидуални уроци по музика за деца · пиано, цигулка или пеене'), 'sx-music-classical-equipment')
for (const [name, photo] of [
  ['Класически масаж на цяло тяло', 'sx-male-massage'],
  ['Авторски масаж на цяло тяло при Милена Цветкова', 'sx-massage-manual-covered-alternatives'],
  ['Частичен масаж при Милена Цветкова · гръб или антицелулитен', 'sx-neck-shoulder-massage'],
]) associations.set(key('sofia-mts-massage-pchinya31b', 'health', name), photo)

associations.set(key('sofia-yavorov1920-geo-milev24', 'education', 'Детска вокална група'), 'go-yavorov-geo-milev-child-singing-20261127')
associations.set(key('sofia-yavorov1920-geo-milev24', 'education', 'Уроци по музикален инструмент · синтезатор'), 'go-yavorov-geo-milev-synthesizer-20261127')

for (const [name, photo] of [
  ['Компютърна диагностика', 'auto-diagnostics'],
  ['Смяна на масло', 'oil-change'],
]) associations.set(key('sofia-ivon-service-gorna-banya-eho1', 'auto_repair', name), photo)

for (const [name, photo] of [
  ['Групови тренировки и фитнес · карта за 7 дни', 'sx-women-mat-strength'],
  ['Групови тренировки · карта за 3 месеца', 'sx-kangoo-jumps'],
]) associations.set(key('sofia-flais-nadezhda1-lyuborodie2', 'fitness', name), photo)

associations.set(key('sofia-sihia-nadezhda2-velezhki49g', 'fitness', 'Реформър пилатес · групова тренировка'), 'sx-reformer-intense-equipment')

export function catalogueServicePhotoFields(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.name !== 'string' || typeof service?.category !== 'string') return {}
  const photoId = specificServicePhotoKey(associations.get(key(business.id, service.category, service.name)))
  return photoId ? { illustrativePhotoKey: photoId } : {}
}

export function catalogueDetailsWithServicePhotos(business, now) {
  const details = catalogueBusinessDetails(business, now)
  return { ...details, services: details.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, business) })) }
}
