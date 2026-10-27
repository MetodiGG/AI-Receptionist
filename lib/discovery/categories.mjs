// Google types are deliberately server-selected, never accepted from a client.
// Some services have no precise Places type: use Text Search rather than a
// misleading broad Nearby type (e.g. a pet shop is not a grooming salon).
export const DISCOVERY_CATEGORIES = [
  { id: 'barber', industry: 'beauty', bg: 'Барбершоп', en: 'Barbers', icon: 'scissors', types: ['barber_shop'], terms: ['барбершоп', 'барбър', 'бръснар', 'barber', 'barbershop'], serviceTerms: ['подстриг', 'haircut', 'брада', 'beard', 'бръсн'] },
  { id: 'hair', industry: 'beauty', bg: 'Фризьор', en: 'Hair', icon: 'scissors', types: ['hair_salon'], terms: ['фризьор', 'подстриг', 'боядисване', 'hairdresser', 'haircut', 'hair salon'], serviceTerms: ['фризьор', 'подстриг', 'боядис', 'hair', 'причес'] },
  { id: 'nails', industry: 'beauty', bg: 'Маникюр', en: 'Nails', icon: 'spark', types: ['nail_salon'], terms: ['маникюр', 'педикюр', 'ноктопластика', 'manicure', 'pedicure', 'nail salon', 'nails'], serviceTerms: ['маникюр', 'педикюр', 'нокт', 'manicure', 'pedicure', 'nail'] },
  { id: 'beauty', industry: 'beauty', bg: 'Красота', en: 'Beauty', icon: 'spark', types: ['beauty_salon'], terms: ['красота', 'козметик', 'епилация', 'beauty', 'beautician', 'waxing'], serviceTerms: ['козмет', 'епилац', 'beauty', 'wax', 'лице'] },
  { id: 'car_wash', industry: 'auto', bg: 'Автомивка', en: 'Car wash', icon: 'wrench', types: ['car_wash'], terms: ['автомивка', 'автомив', 'измиване на кола', 'car wash'], serviceTerms: ['измив', 'миене', 'автомив', 'wash'] },
  { id: 'detailing', industry: 'auto', bg: 'Детайлинг', en: 'Detailing', icon: 'wrench', types: [], terms: ['детайлинг', 'полиране', 'detailing', 'car detailing'], serviceTerms: ['детайлинг', 'полир', 'detail', 'polish'] },
  { id: 'auto_repair', industry: 'auto', bg: 'Автосервиз', en: 'Auto repair', icon: 'wrench', types: ['car_repair'], terms: ['автосервиз', 'авторемонт', 'ремонт на кола', 'смяна на гуми', 'auto repair', 'car repair', 'garage', 'tyre'], serviceTerms: ['ремонт', 'диагност', 'масло', 'гуми', 'repair', 'tyre', 'oil'] },
  { id: 'fitness', industry: 'fitness', bg: 'Фитнес', en: 'Fitness', icon: 'dumbbell', types: ['fitness_center', 'gym', 'sports_coaching'], terms: ['фитнес', 'трениров', 'треньор', 'йога', 'fitness', 'personal trainer', 'training', 'yoga'], serviceTerms: ['фитнес', 'трен', 'йога', 'fitness', 'training', 'yoga'] },
  { id: 'education', industry: 'education', bg: 'Уроци', en: 'Lessons', icon: 'graduation', types: [], terms: ['урок', 'уроци', 'учител', 'обучение', 'математика', 'tutor', 'lesson', 'education'], serviceTerms: ['урок', 'уроци', 'учител', 'обуч', 'tutor', 'lesson', 'курс'] },
  { id: 'pets', industry: 'pets', bg: 'Груминг', en: 'Pet grooming', icon: 'paw', types: [], terms: ['груминг', 'грумър', 'подстригване на куче', 'grooming', 'pet groomer'], serviceTerms: ['грум', 'куче', 'котк', 'groom', 'pet', 'dog'] },
  { id: 'home_services', industry: 'home_services', bg: 'За дома', en: 'Home services', icon: 'house', types: ['plumber', 'electrician', 'locksmith', 'painter'], terms: ['водопроводчик', 'електротехник', 'почистване', 'ключар', 'plumber', 'electrician', 'cleaning', 'locksmith', 'home service'], serviceTerms: ['водопровод', 'електр', 'почист', 'ключар', 'plumb', 'clean', 'electric', 'lock'] },
  { id: 'consulting', industry: 'consulting', bg: 'Консултации', en: 'Consulting', icon: 'briefcase', types: ['consultant'], terms: ['консултац', 'счетовод', 'consulting', 'consultant', 'accountant'], serviceTerms: ['консулт', 'счетовод', 'consult', 'account'] },
  { id: 'health', industry: 'health', bg: 'Терапии', en: 'Therapies', icon: 'stethoscope', types: ['physiotherapist'], terms: ['физиотерап', 'рехабилит', 'physiotherapy', 'physiotherapist'], serviceTerms: ['терап', 'рехабилит', 'physio', 'therapy'] },
  { id: 'other', industry: 'other', bg: 'Друга услуга', en: 'Other service', icon: 'calendarSearch', types: [], terms: [], serviceTerms: [] },
]
export const CATEGORY_IDS = DISCOVERY_CATEGORIES.map(item => item.id)
export const categoryById = id => DISCOVERY_CATEGORIES.find(item => item.id === id)
export const normalizeSearchText = value => String(value || '').normalize('NFKC').toLocaleLowerCase('bg').replace(/\s+/g, ' ').trim()
export function hasTerm(text, term) {
  const escaped = normalizeSearchText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^\\p{L}])${escaped}`, 'u').test(normalizeSearchText(text))
}
