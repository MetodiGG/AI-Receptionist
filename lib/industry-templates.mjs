export const INDUSTRY_SERVICE_TEMPLATES = {
  beauty: [{ name: 'Подстригване', price: '25', duration_min: '30' }, { name: 'Боядисване', price: '55', duration_min: '90' }, { name: 'Маникюр', price: '30', duration_min: '60' }],
  auto: [{ name: 'Компютърна диагностика', price: '30', duration_min: '45' }, { name: 'Смяна на масло и филтри', price: '35', duration_min: '60' }, { name: 'Преглед и оценка за ремонт', price: '25', duration_min: '30' }],
  fitness: [{ name: 'Индивидуална тренировка', price: '30', duration_min: '60' }, { name: 'Консултация', price: '20', duration_min: '30' }],
  education: [{ name: 'Индивидуален урок', price: '25', duration_min: '60' }, { name: 'Входно ниво', price: '15', duration_min: '30' }],
  consulting: [{ name: 'Първа консултация', price: '40', duration_min: '45' }, { name: 'Последваща среща', price: '35', duration_min: '30' }],
  home_services: [{ name: 'Оглед на адрес', price: '25', duration_min: '60' }, { name: 'Посещение за услуга', price: '45', duration_min: '90' }],
  pets: [{ name: 'Груминг', price: '35', duration_min: '60' }, { name: 'Консултация', price: '25', duration_min: '30' }],
  health: [{ name: 'Първична консултация', price: '40', duration_min: '45' }, { name: 'Терапевтична сесия', price: '45', duration_min: '60' }],
  other: [{ name: 'Консултация', price: '25', duration_min: '30' }],
}

export function getIndustryServiceTemplate(industry) {
  return (INDUSTRY_SERVICE_TEMPLATES[industry] || INDUSTRY_SERVICE_TEMPLATES.other).map((service) => ({ ...service }))
}
