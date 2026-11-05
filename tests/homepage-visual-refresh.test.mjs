import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { homeCategories } from '../lib/discovery/home.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const luminance = hex => hex.match(/\w{2}/g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0)
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)

test('the hamburger has exactly the requested seven destinations and BG/EN labels in order', async () => {
  const nav = await read('components/marketing-navigation.js'), menu = nav.slice(nav.indexOf('<div id="launch-menu"'))
  const routes = [...menu.matchAll(/href=\{`([^`]+)`\}/g)].map(match => match[1])
  assert.deepEqual(routes, ['/?lang=${locale}', '/?lang=${locale}#ai-query', '/account?lang=${locale}', '/login?lang=${locale}', '/for-businesses?lang=${locale}', '/faq?lang=${locale}', 'mailto:${SUPPORT_EMAIL}'])
  const labels = ["'Home' : 'Начало'", "'Find a service' : 'Намери услуга'", "'Client account' : 'Вход за клиенти'", "'Business Account' : 'Вход за бизнес'", "'Become GoRez Partner' : 'Стани GoRez партньор'", "'FAQ' : 'ЧЗВ'", "'Contact us' : 'Свържи се с нас'"]
  let previous = -1
  for (const label of labels) { const at = menu.indexOf(label); assert.ok(at > previous, label); previous = at }
  assert.equal((menu.match(/<Link\b/g) || []).length, 6); assert.equal((menu.match(/<a\b/g) || []).length, 1)
  assert.doesNotMatch(menu, /How it works|GoRez Partners|\/partners|business &&/)
  assert.match(nav, /event.key === 'Escape'/); assert.match(nav, /hidden=\{!open\}/)
})
test('FAQ is consistently named ЧЗВ in Bulgarian navigation without rewriting actual answers', async () => {
  const footer = await read('components/site-footer.js'), landing = await read('components/business-landing.js')
  assert.match(footer, /en\?'FAQ':'ЧЗВ'/)
  assert.match(landing, /navFaq: 'ЧЗВ'/)
  assert.doesNotMatch(footer, /en\?'FAQ':'Въпроси'/)
})
test('the compact orange panel groups the heading and search only, leaving browse rails outside it', async () => {
  const search = await read('components/discovery-search.js'), css = await read('app/discovery-home.css')
  assert.match(search, /const SearchPanel = home \? 'div' : Fragment/)
  assert.match(search, /className: 'home-search-panel'/)
  assert.ok(search.indexOf('<SearchPanel ') < search.indexOf('<header className='))
  assert.ok(search.indexOf('</form>') < search.indexOf('</SearchPanel>'))
  assert.ok(search.indexOf('</SearchPanel>') < search.indexOf('title={homeCopy.categories}'))
  assert.match(css, /\.home-search-panel \{[^}]*border-radius: 30px;[^}]*linear-gradient/)
  assert.match(css, /font-family: "Avenir Next", "Segoe UI", ui-sans-serif/)
  assert.match(css, /\.home-discovery-heading h1 \{[^}]*font-weight: 700/)
  assert.match(css, /\.home-discovery-section h2 \{[^}]*font-weight: 700/)
  assert.doesNotMatch(css, /@import|https?:\/\/|font-weight: 760/)
})
test('homepage submission is the leading search icon or Enter, with no extra arrow/continue button', async () => {
  const search = await read('components/discovery-search.js'), css = await read('app/discovery-home.css')
  assert.match(search, /home && <button className="home-search-trigger" type="submit"[^\n]*<Icon name="search"/)
  assert.ok(search.indexOf('className="home-search-trigger"') < search.indexOf('<input id='))
  assert.match(search, /!home && <button className="discovery-submit"/)
  assert.match(search, /onSubmit=\{submit\}/)
  assert.doesNotMatch(search, /home-query-symbol/)
  assert.match(css, /\.home-search-trigger \{[^}]*width: 44px; height: 44px; min-height: 44px/)
  assert.match(search, /home-inline-location[^\n]*aria-pressed=\{locationEnabled\}/)
})
test('two compact centered cards retain the handshake and a text-only registration action', async () => {
  const browse = await read('components/discovery-home-browse.js'), css = await read('app/discovery-home.css')
  assert.match(browse, /home-bottom-partners[^\n]*<PartnerCardArt/)
  assert.match(browse, /home-bottom-business[^\n]*home-business-signup/)
  const bottom = browse.slice(browse.indexOf('export function DiscoveryHomeBottom'))
  assert.doesNotMatch(bottom, /Icon name="store"|home-bottom-symbol|<BrandMark/)
  assert.match(bottom, /loading="lazy" decoding="async"/)
  assert.match(css, /\.home-bottom-card \{[^}]*box-shadow: inset/)
  assert.match(css, /\.home-bottom-card \{[^}]*flex-direction: column;[^}]*text-align: center/)
  assert.match(css, /\.home-bottom-art \{[^}]*width: 88px;[^}]*height: 48px/)
  assert.match(css, /\.home-bottom-art \{ width: 72px; height: 40px/)
  assert.match(css, /\.home-bottom-card \{[^}]*min-height: 136px; padding: 16px;/)
  assert.match(css, /\.home-bottom-card \{ min-height: 160px; padding: 16px 10px;/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  const manifest = JSON.parse(await read('docs/homepage-card-art-2026-11-05.json'))
  assert.deepEqual(manifest.assets.map(row => row.id), ['partners'])
  let total = 0
  for (const asset of manifest.assets) for (const [i, output] of asset.outputs.entries()) {
    assert.ok(['generated-illustration', 'imagegen-edit'].includes(asset.sourceType))
    const bytes = await readFile(new URL(`../${output}`, import.meta.url)); total += bytes.length
    const meta = await sharp(bytes).metadata()
    assert.equal(meta.width, asset.widths[i]); assert.equal(meta.height, Math.round(meta.width / asset.aspectRatio)); assert.equal(meta.hasAlpha, asset.hasAlpha)
    assert.equal(meta.exif, undefined); assert.equal(meta.xmp, undefined)
  }
  assert.ok(total < 130000)
})
test('the final registration card has only the complete larger registration phrase and orange Free accent, with no image or extra heading', async () => {
  const component = await read('components/discovery-home-browse.js'), card = component.split('<Link className="home-bottom-card home-bottom-business"')[1].split('</Link>')[0]
  assert.match(card, /href=\{`\/for-businesses\?lang=\$\{locale\}`\}/)
  assert.match(card, /aria-label=\{copy.register\}/)
  assert.match(card, /<strong>\{copy.registerAction\}<\/strong><span className="home-free-label">\{copy.free\}<\/span>/)
  assert.doesNotMatch(card, /<img|<svg|CardArt|Icon|copy.business/)
  assert.doesNotMatch(component, /business-growth|business-3d/)
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-business-signup \{[^}]*justify-items: center;[^}]*text-align: center/)
  assert.match(css, /\.home-business-signup > strong \{[^}]*font-size: 24px; font-weight: 750/)
  assert.match(css, /\.home-business-signup > strong \{ font-size: 22px/)
  assert.match(css, /\.home-bottom-business \.home-free-label \{[^}]*linear-gradient\(135deg,#ffe5c5,#ffc58d\)[^}]*font-size: 20px; font-weight: 800/)
  for (const color of ['ffe5c5','ffc58d']) assert.ok(contrast('602b11', color) >= 4.5)
  const manifest = JSON.parse(await read('docs/homepage-card-art-2026-11-05.json'))
  assert.equal(manifest.discardedBusinessDraft.used, false)
})
test('orange card and panel text retains at least normal-text contrast on the gradient endpoints', () => {
  for (const background of ['fffaf3', 'fff0df', 'fffaf5', 'fff2e5']) {
    assert.ok(contrast('452719', background) >= 4.5)
    assert.ok(contrast('65422d', background) >= 4.5)
  }
  for (const background of ['fff3e5', 'ffe5cb', 'fff0df']) assert.ok(contrast('352b25', background) >= 4.5)
})
test('the public header has only the shared wordmark, flags and orange dimensional menu control', async () => {
  const nav = await read('components/marketing-navigation.js'), flags = await read('components/country-flag.js'), language = await read('components/language-switch.js'), controls = await read('app/header-controls.css')
  assert.doesNotMatch(nav, /home-desktop-navigation|AdminAccessLink|My appointments|Моите часове/)
  assert.match(nav, /<LanguageSwitch locale=\{locale\} onChange=\{setLocale\} compact\/?>/)
  assert.match(nav, /<Icon name=\{open \? 'close' : 'menu'\}/)
  assert.match(language, /<CountryFlag locale=\{locale\}/)
  assert.doesNotMatch(language, /'EN'|'BG'|🇬🇧|🇧🇬/)
  assert.match(flags, /useId\(\)/); assert.match(flags, /aria-hidden="true"/)
  assert.doesNotMatch(flags, /fetch\(|https?:\/\/|<text|<image/)
  assert.match(controls, /height:44px; min-height:44px/)
  assert.match(controls, /button \.country-flag \{ display:block; width:36px; height:28px/)
  assert.match(controls, /linear-gradient\(150deg,#fffaf4,#ffead5\)/)
})
test('G and R are bold orange accents in the shared complete, accessible wordmark', async () => {
  const logo = await read('components/brand-logo.js'), css = await read('app/brand.css')
  assert.match(logo, /gorez-wordmark-accent">G<\/span>o<span className="gorez-wordmark-accent">R<\/span>ez/)
  assert.match(css, /gorez-wordmark-accent \{ color:#d55e22; font-weight:900/)
  assert.match(css, /font-family:"Trebuchet MS","Avenir Next"/)
  assert.match(logo, /sr-only">GoRez/)
})
test('headings use clean bold text, with the discarded scroll highlights completely removed', async () => {
  const css = await read('app/discovery-home.css'), browse = await read('components/discovery-home-browse.js'), rail = await read('components/discovery-home-rail.js'), search = await read('components/discovery-search.js')
  for (const source of [css, browse, rail, search]) assert.doesNotMatch(source, /HeadingHighlight|home-heading-highlight|IntersectionObserver/)
  assert.match(css, /\.home-discovery-heading h1 \{[^}]*font-weight: 700/)
  assert.match(css, /\.home-discovery-section h2 \{[^}]*font-weight: 700/)
})
test('desktop density is compact without shrinking mobile controls or framing the flags', async () => {
  const css = await read('app/discovery-home.css'), controls = await read('app/header-controls.css'), flags = await read('components/country-flag.js')
  assert.match(css, /width: min\(1080px, calc\(100% - 48px\)\)/)
  assert.match(css, /font-size: clamp\(25px,2.4vw,30px\)/)
  assert.match(css, /\.home-search-trigger \{[^}]*width: 44px; height: 44px; min-height: 44px/)
  assert.match(controls, /border:0; border-radius:0;[^}]*background:transparent; box-shadow:none/)
  assert.doesNotMatch(flags, /<rect|<text|<image/)
})
test('larger centered card titles and the static orange Free label retain their accessible registration meaning', async () => {
  const css = await read('app/discovery-home.css'), browse = await read('components/discovery-home-browse.js')
  assert.match(css, /\.home-bottom-copy strong \{[^}]*font-size: 20px; font-weight: 700/)
  assert.match(css, /\.home-bottom-copy strong \{ font-size: 19px/)
  assert.match(browse, /className="home-free-label">\{copy.free\}/)
  assert.match(browse, /aria-label=\{copy.register\}/)
  assert.match(css, /\.home-free-label \{[^}]*font-weight: 800/)
  assert.ok(contrast('9c3e16', 'ffe4c9') >= 4.5)
})
test('partner art is the requested soft handshake instead of the discarded chain links', async () => {
  const manifest = JSON.parse(await read('docs/homepage-card-art-2026-11-05.json')), partner = manifest.assets.find(row => row.id === 'partners')
  assert.match(partner.prompt, /two hands shaking/)
  assert.match(partner.source, /bef5e587/)
  assert.equal(partner.aspectRatio, 2)
  assert.deepEqual(partner.outputs, ['public/home-art/partners-3d-v2.webp', 'public/home-art/partners-3d-2x-v2.webp'])
})
test('Other services has the new owner-supplied picture and cannot reuse Consulting', async () => {
  const choices = homeCategories('en'), other = choices.find(row => row.id === 'other'), consulting = choices.find(row => row.id === 'consulting')
  assert.equal(other.photo, '/category-photos/other-v4.webp')
  assert.notEqual(other.photo, consulting.photo)
  const bytes = await readFile(new URL(`../public${other.photo}`, import.meta.url)), consultingBytes = await readFile(new URL(`../public${consulting.photo}`, import.meta.url))
  assert.notDeepEqual(bytes, consultingBytes)
  const manifest = JSON.parse(await read('docs/homepage-other-art-2026-11-05.json'))
  assert.equal(manifest.source, 'BECF761C-5CAF-4865-95F6-C7A7D56354BD/1-Photo-1.jpg')
  assert.doesNotMatch(manifest.source, /generated|exec-/)
})
