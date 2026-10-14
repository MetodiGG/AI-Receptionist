'use client'

import { getBookingIntake } from '../lib/booking-intake.mjs'

export function BookingIntakeFields({ industry, locale = 'bg', value = {}, onChange }) {
  const intake = getBookingIntake(industry, locale)
  if (!intake.fields.length) return null
  return <fieldset className="booking-intake">
    <legend>{intake.title}</legend>
    <p>{intake.description}</p>
    <div className="booking-intake-grid">{intake.fields.map((field) => {
      const props = {
        value: value[field.key] || '',
        onChange: (event) => onChange({ ...value, [field.key]: event.target.value }),
        required: Boolean(field.required),
        maxLength: field.maxLength,
        placeholder: field.placeholder,
      }
      return <label className={field.type === 'textarea' ? 'full' : ''} key={field.key}>
        <span>{field.label}{field.required ? ' *' : ` (${locale === 'en' ? 'optional' : 'по желание'})`}</span>
        {field.type === 'select' ? <select value={props.value} onChange={props.onChange} required={props.required}>
          <option value="">{locale === 'en' ? 'Choose' : 'Избери'}</option>
          {field.options.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select> : field.type === 'textarea' ? <textarea {...props} rows={3} /> : <input {...props} type="text" inputMode={field.inputMode} pattern={field.pattern} />}
      </label>
    })}</div>
  </fieldset>
}

export function BookingIntakeSummary({ industry, locale = 'bg', value = {} }) {
  const intake = getBookingIntake(industry, locale)
  const answered = intake.fields.filter((field) => value[field.key]?.trim())
  if (!answered.length) return null
  return <dl className="booking-intake-summary">{answered.map((field) => <div key={field.key}>
    <dt>{field.label}</dt><dd>{field.options?.find((item) => item.value === value[field.key])?.label || value[field.key]}</dd>
  </div>)}</dl>
}
