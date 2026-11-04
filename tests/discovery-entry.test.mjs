import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('home mounts the full existing AI finder and its shared browsing variant, never a retired catalogue page', async () => {
  const home = await read('components/home-page.js'), page = await read('components/discovery-page.js')
  assert.match(home, /<DiscoveryPage/)
  assert.doesNotMatch(home, /useDirectory|DirectoryFilters|BusinessDirectory|BookingStory|compact|\/businesses/)
  assert.match(page, /<DiscoverySearch locale=\{locale\} preview=\{preview\} locationProvider=\{locationProvider\} home=\{home\} directoryData=\{directoryData\}\/>/)
  assert.match(page, /enabled \? <DiscoverySearch/)
  assert.match(page, /Търсенето временно не е достъпно/)
  assert.match(home, /accountDeleted=\{accountDeleted\}/)
  assert.match(page, /Your account has been deleted/)
})

test('public navigation, account actions and error states cannot restore the retired directory', async () => {
  for (const path of ['components/home-page.js', 'components/discovery-page.js', 'components/discovery-search.js', 'components/marketing-navigation.js', 'components/site-footer.js', 'components/customer-account.js']) {
    const source = await read(path)
    assert.doesNotMatch(source, /\/businesses\?lang=|copy\.catalog|Или избери от каталога/, path)
  }
  const nav = await read('components/marketing-navigation.js')
  assert.doesNotMatch(nav, /\{business && <Link href="#how">/)
  assert.match(nav, /href=\{`\/for-businesses\?lang=/)
  assert.match(nav, /href=\{`\/login\?lang=/)
  assert.match(nav, /href=\{`\/account\?lang=/)
  assert.doesNotMatch(await read('lib/discovery/copy.mjs'), /отвори каталога|open the directory/)
})

test('legacy catalogue route only redirects to a fixed local locale-aware AI entry point', async () => {
  const route = await read('app/businesses/page.js')
  assert.match(route, /import \{ redirect \} from 'next\/navigation'/)
  assert.match(route, /redirect\(`\/\?lang=\$\{query\?\.lang === 'en' \? 'en' : 'bg'\}`\)/)
  assert.doesNotMatch(route, /query\?\.(redirect|next|url)|BusinessSearchPage|fetch\(|supabase/i)
  assert.doesNotMatch(await read('app/sitemap.js'), /'\/businesses'/)
  assert.match(await read('app/page.js'), /title: 'GoRez AI Search'/)
})

test('the location icon has its own grid column instead of overlaying the native Safari select', async () => {
  const css = await read('app/discovery.css'), ui = await read('components/discovery-search.js')
  assert.match(ui, /<label className="discovery-city">[\s\S]*?<Icon name="pin"\/><select/)
  assert.match(css, /\.discovery-controls \.discovery-city \{[^}]*grid-template-columns: 20px minmax\(0, 1fr\)/)
  assert.match(css, /\.discovery-city > svg \{ position: static;/)
  assert.doesNotMatch(css, /\.discovery-city > svg \{[^}]*position: absolute/)
  assert.match(css, /\.discovery-controls \.discovery-city \{ grid-template-columns: minmax\(0, 1fr\); \}/)
  assert.doesNotMatch(ui, /role="listbox"|aria-activedescendant/)
})
