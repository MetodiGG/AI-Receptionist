const SECTIONS = [
  ['businesses', 'Бизнеси', 'Businesses'],
  ['catalogue', 'Каталог', 'Catalogue'],
  ['leads', 'Заявки', 'Applications'],
  ['statistics', 'Статистика', 'Statistics'],
  ['external-links', 'Външни линкове', 'External links'],
  ['audit', 'Журнал', 'Activity log'],
  ['reviews', 'Отзиви', 'Reviews'],
]

export function adminSections(locale = 'bg') {
  return SECTIONS.map(([id, bg, en]) => ({ id, label: locale === 'en' ? en : bg }))
}

export function adminSectionDestination(id, locale = 'bg') {
  return id === 'reviews' ? `/admin/reviews?lang=${locale === 'en' ? 'en' : 'bg'}` : null
}
