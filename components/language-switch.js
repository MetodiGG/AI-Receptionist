'use client'

export function LanguageSwitch({ locale, onChange, compact = false }) {
  return (
    <div className={`language-switch ${compact ? 'compact' : ''}`} role="group" aria-label={locale === 'bg' ? 'Избор на език' : 'Choose language'}>
      <button type="button" className={locale === 'bg' ? 'active' : ''} aria-pressed={locale === 'bg'} onClick={() => onChange('bg')}><span aria-hidden="true">🇧🇬</span> BG</button>
      <button type="button" className={locale === 'en' ? 'active' : ''} aria-pressed={locale === 'en'} onClick={() => onChange('en')}><span aria-hidden="true">🇬🇧</span> EN</button>
    </div>
  )
}
