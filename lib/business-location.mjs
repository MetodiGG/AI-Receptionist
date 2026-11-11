import { BULGARIAN_CITIES } from './bulgarian-cities.mjs'

export { BULGARIAN_CITIES }

const LETTERS = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'y',ю:'yu',я:'ya',ѝ:'i' }
export function transliterate(value) {
  return value.split('').map((letter) => { const result = LETTERS[letter.toLowerCase()]; return !result ? letter : letter === letter.toUpperCase() ? result[0].toUpperCase() + result.slice(1) : result }).join('')
}

// Shared by city and neighbourhood search. Transliterate before decomposing
// accents so Cyrillic й keeps its distinct official Latin spelling.
export function normalizeLocationQuery(value = '') {
  return transliterate(String(value ?? '')).normalize('NFKD').replace(/\p{M}/gu, '')
    .toLocaleLowerCase('bg').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/gu, ' ')
}

// Suggestions, not an exhaustive cadastral register. Owners can enter any
// missing neighbourhood; every Bulgarian city remains selectable via EKATTE.
export const NEIGHBOURHOODS = {
  '68134': ['Център','Банишора','Белите брези','Бенковски','Борово','Ботунец','Бояна','Бъкстон','Витоша','Военна рампа','Враждебна','Връбница 1','Връбница 2','Гевгелийски','Гео Милев','Горна баня','Горубляне','Гоце Делчев','Дианабад','Драгалевци','Дружба 1','Дружба 2','Дървеница','Западен парк','Захарна фабрика','Зона Б-5','Зона Б-18','Зона Б-19','Иван Вазов','Изгрев','Изток','Илинден','Илиянци','Карпузица','Княжево','Красна поляна','Красно село','Кремиковци','Кръстова вада','Лагера','Левски','Лозенец','Люлин 1','Люлин 2','Люлин 3','Люлин 4','Люлин 5','Люлин 6','Люлин 7','Люлин 8','Люлин 9','Люлин 10','Малашевци','Манастирски ливади','Младост 1','Младост 1А','Младост 2','Младост 3','Младост 4','Модерно предградие','Мусагеница','Надежда 1','Надежда 2','Надежда 3','Надежда 4','Обеля 1','Обеля 2','Оборище','Овча купел','Овча купел 1','Овча купел 2','Орландовци','Павлово','Подуяне','Полигона','Разсадника','Редута','Република','Света Троица','Свобода','Сердика','Симеоново','Слатина','Стрелбище','Студентски град','Сухата река','Суходол','Толстой','Триъгълника','Факултета','Филиповци','Фондови жилища','Хаджи Димитър','Хиподрума','Хладилника','Христо Ботев','Яворов'],
  '56784': ['Център','Капана','Стария град','Кършияка','Кючук Париж','Тракия','Смирненски','Прослав','Коматево','Остромила','Беломорски','Гагарин','Захарна фабрика','Изгрев','Столипиново','Мараша','Каменица 1','Каменица 2','Съдийски','Отдих и култура','Западен','Източен','Северен','Южен'],
  '10135': ['Център','Аспарухово','Владислав Варненчик','Възраждане','Левски','Чайка','Бриз','Трошево','Младост','Победа','Виница','Галата','Изгрев','Цветен квартал','Чаталджа','Спортна зала','Лятно кино Тракия','Колхозен пазар','Конфуто','Завод Дружба','Одесос','Приморски'],
  '07079': ['Център','Възраждане','Братя Миладинови','Лазур','Зорница','Изгрев','Славейков','Меден рудник','Сарафово','Крайморие','Лозово','Горно Езерово','Долно Езерово','Ветрен','Банево','Победа','Акациите'],
  '68850': ['Център','Железник','Три чучура – север','Три чучура – юг','Зора','Самара 1','Самара 2','Самара 3','Казански','Аязмото','Бедечка'],
  '63427': ['Център','Възраждане','Здравец','Здравец – изток','Здравец – север','Дружба 1','Дружба 2','Дружба 3','Чародейка','Родина 1','Родина 2','Родина 3','Родина 4','Долапите','Средна кула','Образцов чифлик'],
  '56722': ['Център','Сторгозия','Дружба 1','Дружба 2','Дружба 3','Дружба 4','Мара Денчева','Кайлъка','Девети квартал'],
}

export function findCity(code) { return BULGARIAN_CITIES.find((city) => city.code === code) }
export function cityLabel(city, locale = 'bg') {
  return locale === 'en' ? `${city.nameEn} · ${transliterate(city.region)}` : `${city.name} · обл. ${city.region}`
}
export function searchCities(query = '', locale = 'bg') {
  const normalized = normalizeLocationQuery(query)
  const relevance = (city) => {
    if (!normalized) return 0
    const names = [normalizeLocationQuery(city.name), normalizeLocationQuery(city.nameEn)]
    if (names.includes(normalized)) return 0
    if (names.some((name) => name.startsWith(normalized))) return 1
    if (names.some((name) => name.split(' ').some((word) => word.startsWith(normalized)))) return 2
    if (names.some((name) => name.includes(normalized))) return 3
    if (city.code === normalized) return 4
    if (city.code.startsWith(normalized)) return 5
    if (normalizeLocationQuery(city.region).includes(normalized)) return 6
    return -1
  }
  // Region matches remain useful, but must not bury the city itself beneath
  // alphabetically earlier towns in Sofia province.
  return BULGARIAN_CITIES.map((city) => ({ city, rank: relevance(city) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank || (locale === 'en'
      ? a.city.nameEn.localeCompare(b.city.nameEn, 'en')
      : a.city.name.localeCompare(b.city.name, 'bg')) || a.city.code.localeCompare(b.city.code))
    .map(({ city }) => city)
}
export function businessLocationFields(code, neighbourhood = '') {
  const city = findCity(code)
  if (!city) throw new Error('Choose a valid Bulgarian city')
  return { city_ekatte: city.code, city: city.name, neighborhood: neighbourhood.trim().slice(0, 120) || null }
}
export function businessAddress(business, locale = 'bg') {
  const city = findCity(business.city_ekatte)
  const cityName = locale === 'en' && city ? city.nameEn : business.city
  const neighbourhood = business.neighborhood ? (locale === 'en' ? transliterate(business.neighborhood) : business.neighborhood) : ''
  return [cityName, neighbourhood, business.address].filter(Boolean).join(', ')
}
