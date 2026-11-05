import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Home is an icon-only localized link to the fixed AI entry point, not history, logout or a form action', async () => {
  const component = await read('components/home-link.js')
  assert.match(component, /locale === 'en' \? 'en' : 'bg'/)
  assert.match(component, /<Link className="site-home-link" href=\{`\/\?lang=\$\{language\}`\}/)
  assert.match(component, /const label = language === 'en' \? 'Home' : 'Начало'/)
  assert.match(component, /aria-label=\{label\} title=\{label\}/)
  assert.match(component, /<Icon name="house3d"/)
  assert.doesNotMatch(component, /<span|<p|<strong/)
  assert.doesNotMatch(component, /onSubmit|signOut|history\.|router\.back|target=/)
})

test('inner public flows and shared owner/admin shells include the same direct Home link', async () => {
  for (const path of [
    'components/marketing-navigation.js', 'components/business-login.js',
    'components/password-recovery.js', 'components/legal-page.js',
    'components/customer-account.js', 'components/public-booking-page.js',
    'components/review-form.js', 'app/booking/[token]/page.js',
    'components/dashboard-shell.js', 'components/owner-context.js',
    'components/platform-admin.js', 'components/review-admin.js',
  ]) {
    const source = await read(path)
    assert.match(source, /import \{ HomeLink \} from/, path)
    assert.match(source, /<HomeLink locale=\{(?:locale|language)\}(?:\s|\/)/, path)
  }
  for (const path of ['components/business-onboarding.js', 'components/discovery-page.js']) {
    assert.match(await read(path), /<MarketingNavigation/, path)
  }
})

test('the homepage omits Home regardless of locale or menu state, while inner pages retain it outside the menu', async () => {
  const navigation = await read('components/marketing-navigation.js')
  assert.match(navigation, /import \{ usePathname \} from 'next\/navigation'/)
  assert.match(navigation, /const isHome = usePathname\(\) === '\/'/)
  assert.match(navigation, /\{!homeDiscovery && !isHome && <HomeLink locale=\{locale\} onClick=\{\(\) => setOpen\(false\)\}\/\>\}/)
  assert.match(navigation, /isHome \? ' launch-navigation-home' : ''/)
  assert.ok(navigation.indexOf('<HomeLink') < navigation.indexOf('id="launch-menu"'))
  assert.doesNotMatch(navigation, /window\.location|useSearchParams/)
})

test('booking Home remains outside the owner-session condition', async () => {
  const booking = await read('components/public-booking-page.js')
  assert.match(booking, /<\/nav> : null\}[\s\S]*?<\/div>\s*<HomeLink locale=\{locale\}\/>/)
  assert.match(booking, /function LoadingPage\(\{ copy, locale \}\)/)
  assert.match(booking, /<LoadingPage copy=\{copy\} locale=\{locale\}/)
})

test('Home, language and menu share a single compact aligned action group, including the narrow layout', async () => {
  const css = await read('app/home-navigation.css')
  assert.match(await read('app/layout.js'), /import '\.\/home-navigation\.css'/)
  assert.match(css, /a\.site-home-link \{[^}]*width: 44px;[^}]*min-height: 44px;[^}]*background: transparent;[^}]*font-size: 16px;/)
  assert.match(css, /a\.site-home-link:focus-visible \{ outline: 3px/)
  assert.match(css, /\.launch-navigation \.launch-nav-actions \{[^}]*display: flex;[^}]*gap: 8px;/)
  assert.match(css, /\.launch-navigation \.launch-menu \{ grid-column: 1 \/ -1; grid-row: 4;/)
  assert.match(css, /\.marketing-page \.launch-navigation \{ grid-template-columns: minmax\(0, 1fr\) auto;/)
  assert.doesNotMatch(css, /\.launch-navigation[^{}]*> \.site-home-link|\.launch-navigation:not\(\.launch-navigation-home\) \.language-switch/)
  const navigation = await read('components/marketing-navigation.js'), actions = navigation.slice(navigation.indexOf('<div className="launch-nav-actions"'), navigation.indexOf('id="launch-menu"'))
  assert.ok(actions.indexOf('<HomeLink') < actions.indexOf('<LanguageSwitch'))
  assert.ok(actions.indexOf('<LanguageSwitch') < actions.indexOf('className="launch-menu-toggle"'))
  const controls = await read('app/header-controls.css')
  assert.match(controls, /launch-nav-actions > \.launch-menu-toggle \{ flex:0 0 44px; width:44px; min-width:44px; height:44px; margin:0;/)
  assert.match(css, /\.public-booking-page\.embedded-booking \.booking-topbar \{ display: none; \}/)
})

test('the owner-shell fixture cannot expose a fictional signed-in dashboard in production', async () => {
  const fixture = await read('app/dev/home-navigation/page.js')
  assert.match(fixture, /process\.env\.NODE_ENV !== 'development'\) notFound\(\)/)
  const preview = await read('app/dev/home-navigation/preview.js')
  assert.match(preview, /<DashboardShell/)
  assert.match(preview, /onLogout=\{\(\) => \{\}\}/)
  assert.doesNotMatch(preview, /fetch\(|signIn|signOut|\.from\(/)
})
