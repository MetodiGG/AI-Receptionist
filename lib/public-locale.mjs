export const SUPPORTED_LOCALES = ['bg', 'en']

export function normalizeLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : 'bg'
}

export const INDUSTRY_KEYS = [
  'beauty',
  'auto',
  'fitness',
  'education',
  'consulting',
  'home_services',
  'pets',
  'health',
  'other',
]

export const INDUSTRY_META = {
  beauty: { icon: 'scissors', symbol: '✂️', bg: 'Бръснарници и красота', en: 'Barbers & beauty' },
  auto: { icon: 'wrench', symbol: '🔧', bg: 'Автосервизи', en: 'Auto services' },
  fitness: { icon: 'dumbbell', symbol: '🏋️', bg: 'Спорт и фитнес', en: 'Sport & fitness' },
  education: { icon: 'graduation', symbol: '🎓', bg: 'Обучение', en: 'Education' },
  consulting: { icon: 'briefcase', symbol: '💼', bg: 'Консултации', en: 'Consulting' },
  home_services: { icon: 'house', symbol: '🏠', bg: 'Услуги на адрес', en: 'Home services' },
  pets: { icon: 'paw', symbol: '🐾', bg: 'Домашни любимци', en: 'Pet services' },
  health: { icon: 'stethoscope', symbol: '🩺', bg: 'Здраве и терапии', en: 'Health & therapy' },
  other: { icon: 'calendarSearch', symbol: '📅', bg: 'Други услуги', en: 'Other services' },
}

export function getIndustryLabel(industry, locale = 'bg') {
  return (INDUSTRY_META[industry] || INDUSTRY_META.other)[normalizeLocale(locale)]
}

export function filterDirectoryBusinesses(businesses, industry = 'all') {
  if (industry === 'all') return businesses
  return businesses.filter((business) => (business.industry || 'other') === industry)
}

export function resolvePublicIndustry(business) {
  if (business?.industry && business.industry !== 'other') return business.industry
  const searchable = [business?.name, ...(business?.services || []).map((service) => service.name)].join(' ').toLocaleLowerCase('bg-BG')
  if (/barber|бръснар|фризьор|маникюр|подстриг|салон за красота/.test(searchable)) return 'beauty'
  if (/auto|garage|авто|диагностик|гуми|сервиз/.test(searchable)) return 'auto'
  return business?.industry || 'other'
}

export function localizeDateTime(dateTime, locale = 'bg') {
  return dateTime.setLocale(normalizeLocale(locale))
}
