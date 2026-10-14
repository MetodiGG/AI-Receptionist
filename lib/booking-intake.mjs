const text = (bg, en) => ({ bg, en })
const option = (value, bg, en) => ({ value, label: text(bg, en) })

const PRESETS = {
  auto: {
    title: text('За автомобила', 'About your vehicle'),
    description: text('Помогни на сервиза да се подготви за посещението.', 'Help the repair shop prepare for your visit.'),
    fields: [
      { key: 'vehicle', label: text('Марка и модел', 'Make and model'), placeholder: text('Напр. Volkswagen Golf', 'e.g. Volkswagen Golf'), required: true, maxLength: 100 },
      { key: 'year', label: text('Година', 'Year'), placeholder: text('Напр. 2018', 'e.g. 2018'), inputMode: 'numeric', maxLength: 4, pattern: '[0-9]{4}' },
      { key: 'request', label: text('Проблем или допълнителна информация', 'Issue or additional information'), placeholder: text('Какво искаш да бъде проверено?', 'What would you like checked?'), type: 'textarea', maxLength: 300 },
    ],
  },
  pets: {
    title: text('За домашния любимец', 'About your pet'),
    description: text('Нужните детайли за подготовка на услугата.', 'A few details to prepare for the appointment.'),
    fields: [
      { key: 'pet_name', label: text('Име на любимеца', 'Pet name'), maxLength: 80 },
      { key: 'pet_type', label: text('Вид', 'Animal type'), type: 'select', required: true, options: [option('dog', 'Куче', 'Dog'), option('cat', 'Котка', 'Cat'), option('other', 'Друг', 'Other')] },
      { key: 'breed', label: text('Порода и приблизителен размер', 'Breed and approximate size'), placeholder: text('Напр. пудел, около 8 кг', 'e.g. poodle, around 8 kg'), maxLength: 100 },
    ],
  },
  home_services: {
    title: text('За посещението на адрес', 'About the service visit'),
    description: text('Посочи мястото за посещение. Бизнесът ще потвърди дали адресът е в обслужвания район.', 'Enter the visit address. The business will confirm it is within their service area.'),
    fields: [
      { key: 'visit_address', label: text('Адрес за посещение', 'Visit address'), placeholder: text('Град, улица, номер', 'City, street and number'), required: true, maxLength: 200 },
      { key: 'request', label: text('Какво трябва да бъде направено?', 'What needs to be done?'), type: 'textarea', maxLength: 300 },
    ],
  },
  education: {
    title: text('За урока', 'About your lesson'),
    description: text('Това помага на преподавателя да подготви подходящ урок.', 'This helps the tutor prepare an appropriate lesson.'),
    fields: [
      { key: 'subject', label: text('Предмет или тема', 'Subject or topic'), required: true, maxLength: 100 },
      { key: 'level', label: text('Ниво или клас', 'Level or school year'), placeholder: text('Напр. начинаещ или 8. клас', 'e.g. beginner or year 8'), maxLength: 100 },
    ],
  },
  consulting: {
    title: text('За консултацията', 'About your consultation'),
    description: text('Кратка тема, за да може специалистът да се подготви.', 'A short topic so the consultant can prepare.'),
    fields: [{ key: 'topic', label: text('Тема на срещата', 'Meeting topic'), type: 'textarea', required: true, maxLength: 300 }],
  },
  fitness: {
    title: text('За тренировката', 'About your session'),
    description: text('Сподели целта си, ако желаеш.', 'Share your goal if you wish.'),
    fields: [
      { key: 'goal', label: text('Цел на тренировката', 'Training goal'), maxLength: 150 },
      { key: 'experience', label: text('Опит', 'Experience'), type: 'select', options: [option('beginner', 'Начинаещ', 'Beginner'), option('regular', 'Тренирам редовно', 'I train regularly'), option('experienced', 'Напреднал', 'Experienced')] },
    ],
  },
  health: {
    title: text('За посещението', 'About your visit'),
    description: text('Не въвеждай медицински документи или чувствителна здравна информация тук.', 'Please do not enter medical records or sensitive health information here.'),
    fields: [{ key: 'visit_type', label: text('Вид посещение', 'Visit type'), type: 'select', options: [option('first', 'Първо посещение', 'First visit'), option('follow_up', 'Повторно посещение', 'Follow-up visit')] }],
  },
  beauty: {
    title: text('Предпочитания', 'Preferences'),
    description: text('Незадължителни детайли за по-персонално обслужване.', 'Optional details for a more personal service.'),
    fields: [{ key: 'preference', label: text('Желан резултат или предпочитания', 'Desired result or preferences'), maxLength: 200 }],
  },
}

export function getBookingIntake(industry, locale = 'bg') {
  const lang = locale === 'en' ? 'en' : 'bg'
  const preset = PRESETS[industry]
  if (!preset) return { title: '', description: '', fields: [] }
  return {
    title: preset.title[lang],
    description: preset.description[lang],
    fields: preset.fields.map((field) => ({
      ...field,
      label: field.label[lang],
      placeholder: field.placeholder?.[lang] || '',
      options: field.options?.map((item) => ({ value: item.value, label: item.label[lang] })),
    })),
  }
}

export function validateBookingIntake(industry, answers = {}, locale = 'bg') {
  const en = locale === 'en'
  const { fields } = getBookingIntake(industry, locale)
  const fail = (message) => { throw Object.assign(new Error(message), { code: 'VALIDATION_ERROR' }) }
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail(en ? 'Check your appointment details.' : 'Провери данните за посещението.')
  const allowed = new Set(fields.map((field) => field.key))
  if (Object.keys(answers).some((key) => !allowed.has(key))) fail(en ? 'Unexpected appointment detail.' : 'Непознато поле за посещението.')

  return Object.fromEntries(fields.flatMap((field) => {
    const raw = answers[field.key] ?? ''
    if (typeof raw !== 'string') fail(en ? `Check ${field.label}.` : `Провери „${field.label}“.`)
    const value = raw.trim()
    if (field.required && !value) fail(en ? `Enter ${field.label.toLowerCase()}.` : `Попълни „${field.label}“.`)
    if (!value) return []
    if (value.length > (field.maxLength || 100)) fail(en ? `${field.label} is too long.` : `„${field.label}“ е твърде дълго.`)
    if (field.options && !field.options.some((item) => item.value === value)) fail(en ? `Choose a valid ${field.label.toLowerCase()}.` : `Избери валидна стойност за „${field.label}“.`)
    if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value)) fail(en ? `Check ${field.label.toLowerCase()}.` : `Провери „${field.label}“.`)
    return [[field.key, value]]
  }))
}

// Use the existing protected appointment notes column. Bilingual labels keep
// answers understandable when the client and owner use different languages.
export function buildBookingNotes(industry, answers, notes = '', locale = 'bg') {
  const validated = validateBookingIntake(industry, answers, locale)
  const preset = PRESETS[industry]
  const rows = (preset?.fields || []).flatMap((field) => {
    const value = validated[field.key]
    if (!value) return []
    const selected = field.options?.find((item) => item.value === value)
    const displayValue = selected ? `${selected.label.bg} / ${selected.label.en}` : value
    return [`${field.label.bg} / ${field.label.en}: ${displayValue}`]
  })
  return [rows.join('\n'), notes.trim()].filter(Boolean).join('\n\n') || null
}
