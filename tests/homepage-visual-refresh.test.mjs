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
  assert.doesNotMatch(bottom, /partnersHint|Разгледай бизнесите в GoRez|Explore businesses on GoRez/)
  assert.match(bottom, /loading="lazy" decoding="async"/)
  assert.match(css, /\.home-bottom-card \{[^}]*box-shadow: inset/)
  assert.match(css, /\.home-bottom-card \{[^}]*flex-direction: column;[^}]*text-align: center/)
  assert.match(css, /\.home-bottom-art \{[^}]*width: 88px;[^}]*height: 48px/)
  assert.match(css, /\.home-bottom-art \{ width: 72px; height: 40px/)
  assert.match(css, /\.home-discovery-bottom \{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\);[^}]*max-width: 680px/)
  assert.match(css, /\.home-bottom-card \{[^}]*min-height: 112px; padding: 12px;/)
  assert.match(css, /\.home-bottom-card \{ min-height: 116px; padding: 10px;/)
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
test('the compact registration card retains the complete registration phrase and readable Free accent, with no image or extra heading', async () => {
  const component = await read('components/discovery-home-browse.js'), card = component.split('<Link className="home-bottom-card home-bottom-business"')[1].split('</Link>')[0]
  assert.match(card, /href=\{`\/for-businesses\?lang=\$\{locale\}`\}/)
  assert.match(card, /aria-label=\{copy.register\}/)
  assert.match(card, /<strong>\{copy.registerAction\}<\/strong><span className="home-free-label">\{copy.free\}<\/span>/)
  assert.doesNotMatch(card, /<img|<svg|CardArt|Icon|copy.business/)
  assert.doesNotMatch(component, /business-growth|business-3d/)
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-business-signup \{[^}]*justify-items: center;[^}]*text-align: center/)
  assert.match(css, /\.home-business-signup > strong \{[^}]*font-size: 21px; font-weight: 750/)
  assert.match(css, /\.home-business-signup > strong \{ font-size: 20px/)
  assert.match(css, /\.home-bottom-business \.home-free-label \{[^}]*linear-gradient\(135deg,#ffe5c5,#ffc58d\)[^}]*font-size: 18px; font-weight: 800/)
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
test('registration text uses the exact GoRez Partners headline color without changing the Free accent', async () => {
  const css = await read('app/discovery-home.css')
  const partnerColor = css.match(/\.home-bottom-copy strong \{[^}]*color: #([a-f\d]{6});/i)?.[1]
  const registrationColor = css.match(/\.home-business-signup > strong \{[^}]*color: #([a-f\d]{6});/i)?.[1]
  assert.equal(partnerColor, '452719')
  assert.equal(registrationColor, partnerColor)
  for (const background of ['fffaf5', 'fff2e5']) assert.ok(contrast(registrationColor, background) >= 4.5)
  assert.match(css, /\.home-bottom-business \.home-free-label \{[^}]*color: #602b11;[^}]*linear-gradient\(135deg,#ffe5c5,#ffc58d\)/)
})
test('Maps navigation is bold only for GoRez-owned cards, leaving Google provider attribution unchanged', async () => {
  const card = await read('components/discovery-business-card.js'), css = await read('app/discovery-home.css'), kit = await read('components/google-discovery-list.js')
  assert.match(card, /<article className="home-business-card" data-source=\{row.source\}>/)
  assert.match(css, /\.home-business-card\[data-source="gorez"\] \.home-maps-label \{ font-weight: 700; \}/)
  assert.match(css, /\.home-maps-label, \.home-google-attribution \{[^}]*font-weight: 400;[^}]*white-space: nowrap;/)
  assert.match(css, /\.home-business-actions \.home-maps-label \{ width: 100%; font-size: 15px; line-height: 1\.2; text-align: center; white-space: normal; \}/)
  assert.match(card, /className="home-maps-label">\{directionsLabel\}/)
  assert.match(kit, /document.createElement\('gmp-place-attribution'\)/)
  assert.doesNotMatch(css, /\[data-source="google"\][^{]*\{[^}]*font-weight: 700|gmp-place-attribution[^}]*font-weight/)
})
test('directions use one larger map icon above a centered label, keeping the shared action grid', async () => {
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-business-actions \.home-directions \{ flex-direction: column; gap: 2px; min-height: 60px; padding: 6px; \}/)
  assert.match(css, /\.home-business-actions \.home-directions > svg \{ width: 24px; height: 24px; flex: 0 0 24px;/)
  assert.equal((css.match(/\.home-business-actions \.home-directions > svg \{/g) || []).length, 1, 'no later rule silently shrinks the map again')
  assert.match(css, /\.home-business-actions \{ display: grid; grid-template-columns: minmax\(0,1fr\) minmax\(0,1fr\)/)
})
test('only enabled reserve controls receive orange hover, keyboard focus and pressed feedback', async () => {
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-business-card \.home-reserve:not\(:disabled\):not\(\[aria-disabled="true"\]\):is\(:hover,:focus-visible\) \{[^}]*linear-gradient\(135deg,#ffac62,#ff8d3f\)/)
  assert.match(css, /\.home-business-card \.home-reserve:focus-visible \{ outline: 3px solid #9c4318; outline-offset: 3px; \}/)
  assert.match(css, /\.home-business-card \.home-reserve:not\(:disabled\):not\(\[aria-disabled="true"\]\):active \{[^}]*transform: translateY\(2px\);[^}]*linear-gradient\(135deg,#ff9546,#ff7725\)/)
  const outbound = await read('components/outbound-booking-button.js')
  assert.match(outbound, /disabled=\{busy\s*\|\|\s*disabled\}/)
})
test('Reserve is subtly darker orange at rest, with the same stronger hover/focus and pressed feedback as Free', async () => {
  const css = await read('app/discovery-home.css')
  const palette = selector => {
    const rule = css.split(`${selector} {`)[1]?.split('}')[0]
    assert.ok(rule, selector)
    return Object.fromEntries(['color', 'background', 'border-color', 'box-shadow'].map(property => [property, rule.match(new RegExp(`(?:^|;)\\s*${property}: ([^;]+);`))?.[1]]))
  }
  const resting = palette('.home-business-card .home-reserve')
  const free = palette('.home-bottom-business .home-free-label')
  assert.equal(resting.background, 'linear-gradient(135deg,#ffd6b0,#ffb875)')
  assert.equal(free.background, 'linear-gradient(135deg,#ffe5c5,#ffc58d)')
  for (const property of ['color', 'border-color', 'box-shadow']) assert.equal(resting[property], free[property])
  for (const [deeper, previous] of [['ffd6b0', 'ffe5c5'], ['ffb875', 'ffc58d']]) {
    assert.ok(luminance(deeper) < luminance(previous))
    assert.ok(contrast('602b11', deeper) >= 4.5)
  }
  for (const state of [':is(:hover,:focus-visible)', ':active']) {
    assert.deepEqual(palette(`.home-business-card .home-reserve:not(:disabled):not([aria-disabled="true"])${state}`), palette(`.home-bottom-business${state} .home-free-label`))
  }
  assert.notEqual(resting.background, palette('.home-bottom-business:is(:hover,:focus-visible) .home-free-label').background)
  assert.doesNotMatch(css, /\.home-reserve:hover\s*[,\{]/)
})
test('the Free accent becomes stronger orange on signup hover, keyboard focus and press without changing layout', async () => {
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-bottom-business:is\(:hover,:focus-visible\) \.home-free-label \{[^}]*color: #3c1b0c;[^}]*linear-gradient\(135deg,#ffac62,#ff8d3f\)/)
  assert.match(css, /\.home-bottom-business:active \.home-free-label \{[^}]*color: #3c1b0c;[^}]*linear-gradient\(135deg,#ff9546,#ff7725\)/)
  assert.match(css, /\.home-discovery-bottom > \.home-bottom-business:focus-visible \{ outline: 3px solid #9c4318; outline-offset: 4px; \}/)
  for (const selector of ['.home-bottom-business:is(:hover,:focus-visible) .home-free-label', '.home-bottom-business:active .home-free-label']) {
    const rule = css.slice(css.indexOf(`${selector} {`)).split('}')[0]
    assert.doesNotMatch(rule, /font-size:|padding:|min-height:|width:/)
  }
  for (const background of ['ffac62','ff8d3f','ff9546','ff7725']) assert.ok(contrast('3c1b0c', background) >= 4.5)
})
test('reduced motion disables the new transitions and pressed movement while retaining color feedback', async () => {
  const css = await read('app/discovery-home.css'), reduced = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(reduced, /\.home-bottom-business \.home-free-label,[\s\S]*\.home-business-card \.home-reserve:not\(:disabled\):not\(\[aria-disabled="true"\]\) \{ transition: none; \}/)
  assert.match(reduced, /\.home-business-card \.home-reserve:not\(:disabled\):not\(\[aria-disabled="true"\]\):active \{ transform: none; \}/)
})
test('button-state visual fixture is development-only and cannot reserve, register or call providers', async () => {
  const page = await read('app/dev/button-states/page.js')
  assert.match(page, /if \(process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.equal((page.match(/<button type="button"/g) || []).length, 3)
  assert.doesNotMatch(page, /fetch\(|<form|<a\b|<Link|href=|onClick=|<script|GoogleDiscoveryList|OutboundBookingButton/)
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
