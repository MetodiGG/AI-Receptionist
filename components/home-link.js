import Link from 'next/link'
import { Icon } from './icon'

// A direct route to AI Search, independent of browser history or sign-in state.
export function HomeLink({ locale = 'bg', onClick }) {
  const language = locale === 'en' ? 'en' : 'bg'
  return <Link className="site-home-link" href={`/?lang=${language}`} onClick={onClick}><Icon name="house" /><span>{language === 'en' ? 'Home' : 'Начало'}</span></Link>
}
