export const INDUSTRY_SERVICE_TEMPLATES = {
  beauty: [{ name: 'Подстригване', price: '25', duration_min: '45' }, { name: 'Боядисване', price: '55', duration_min: '90' }, { name: 'Маникюр', price: '30', duration_min: '60' }],
  auto: [{ name: 'Компютърна диагностика', price: '30', duration_min: '45' }, { name: 'Смяна на масло и филтри', price: '35', duration_min: '60' }, { name: 'Преглед и оценка за ремонт', price: '25', duration_min: '30' }],
  fitness: [{ name: 'Индивидуална тренировка', price: '30', duration_min: '60' }, { name: 'Консултация', price: '20', duration_min: '30' }],
  education: [{ name: 'Индивидуален урок', price: '25', duration_min: '60' }, { name: 'Входно ниво', price: '15', duration_min: '30' }],
  consulting: [{ name: 'Първа консултация', price: '40', duration_min: '45' }, { name: 'Последваща среща', price: '35', duration_min: '30' }],
  home_services: [{ name: 'Оглед на адрес', price: '25', duration_min: '60' }, { name: 'Посещение за услуга', price: '45', duration_min: '90' }],
  pets: [{ name: 'Груминг', price: '35', duration_min: '60' }, { name: 'Консултация', price: '25', duration_min: '30' }],
  health: [{ name: 'Първична консултация', price: '40', duration_min: '45' }, { name: 'Терапевтична сесия', price: '45', duration_min: '60' }],
  other: [{ name: 'Консултация', price: '25', duration_min: '30' }],
}

export const INDUSTRY_SERVICE_TEMPLATES_EN = {
  beauty: [{ name: 'Haircut', price: '25', duration_min: '45' }, { name: 'Hair colouring', price: '55', duration_min: '90' }, { name: 'Manicure', price: '30', duration_min: '60' }],
  auto: [{ name: 'Computer diagnostics', price: '30', duration_min: '45' }, { name: 'Oil and filter change', price: '35', duration_min: '60' }, { name: 'Inspection and repair estimate', price: '25', duration_min: '30' }],
  fitness: [{ name: 'Personal training', price: '30', duration_min: '60' }, { name: 'Consultation', price: '20', duration_min: '30' }],
  education: [{ name: 'Private lesson', price: '25', duration_min: '60' }, { name: 'Level assessment', price: '15', duration_min: '30' }],
  consulting: [{ name: 'Initial consultation', price: '40', duration_min: '45' }, { name: 'Follow-up meeting', price: '35', duration_min: '30' }],
  home_services: [{ name: 'On-site inspection', price: '25', duration_min: '60' }, { name: 'Service visit', price: '45', duration_min: '90' }],
  pets: [{ name: 'Grooming', price: '35', duration_min: '60' }, { name: 'Consultation', price: '25', duration_min: '30' }],
  health: [{ name: 'Initial consultation', price: '40', duration_min: '45' }, { name: 'Therapy session', price: '45', duration_min: '60' }],
  other: [{ name: 'Consultation', price: '25', duration_min: '30' }],
}

export function getIndustryServiceTemplate(industry, locale = 'bg') {
  const templates = locale === 'en' ? INDUSTRY_SERVICE_TEMPLATES_EN : INDUSTRY_SERVICE_TEMPLATES
  return (templates[industry] || templates.other).map((service) => ({ ...service }))
}
