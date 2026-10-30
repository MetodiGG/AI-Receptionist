'use client'

export function LanguageSwitch({ locale, onChange, compact = false }) {
  const en = locale === 'en'
  return (
    <div className={`language-switch language-switch-single ${compact ? 'compact' : ''}`} role="group" aria-label={en ? 'Choose language' : 'Избор на език'}>
      <button type="button" className="active" aria-label={en ? 'Switch language to Bulgarian' : 'Смени езика на английски'} title={en ? 'Switch to Bulgarian' : 'Смени на английски'} onClick={() => onChange(en ? 'bg' : 'en')}><span aria-hidden="true">{en ? '🇬🇧' : '🇧🇬'}</span>{en ? 'EN' : 'BG'}</button>
    </div>
  )
}
