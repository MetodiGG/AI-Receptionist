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

export function catalogueServicePhotoFields(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.name !== 'string' || typeof service?.category !== 'string') return {}
  const photoId = specificServicePhotoKey(associations.get(key(business.id, service.category, service.name)))
  return photoId ? { illustrativePhotoKey: photoId } : {}
}

export function catalogueDetailsWithServicePhotos(business, now) {
  const details = catalogueBusinessDetails(business, now)
  return { ...details, services: details.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, business) })) }
}
