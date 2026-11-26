import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import * as photos from '../lib/business-photos.mjs'
import * as coverResolver from '../lib/business-cover-photo.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
async function load(component, stubs) {
  const filename = '../components/' + component + '.js'
  const { code } = await transform(await read('components/' + component + '.js'), {
    filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), module, module.exports)
  return module.exports
}
const { BusinessPhotoGallery } = await load('business-photo-gallery', {
  'next/image': ({ fill, preload, ...props }) => createElement('img', { ...props, 'data-fill': fill || undefined }),
  '../lib/business-photos.mjs': photos,
  '../lib/photo-autoplay.mjs': { createPhotoAutoplay: () => { throw Error('Effects must not run during static rendering') } },
  '../lib/business-photo-layout.mjs': { businessPhotoStyle },
})
const { BusinessCoverPhoto } = await load('business-cover-photo', {
  '../lib/business-cover-photo.mjs': coverResolver,
})
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))
const vesi = photos.getBusinessPhotos({ id: '450c5c2f-db41-476b-a21e-98cf5ee29194' })

test('portrait, square and landscape preview metadata all use full-image containment without mutating original dimensions or focal points', () => {
  for (const [width, height] of [[1200, 1600], [1200, 1200], [1600, 900]]) {
    const photo = { src: '/api/business-media/owner-upload', width, height, position: '50% 68%' }
    const before = structuredClone(photo)
    assert.deepEqual(businessPhotoStyle(photo, { preview: true }), {
      objectFit: 'contain', objectPosition: 'center', backgroundColor: 'var(--photo-preview-surface, #f5f1eb)',
    })
    assert.deepEqual(photo, before)
    assert.equal(businessPhotoStyle(photo).objectPosition, '50% 68%', 'Legacy metadata remains available outside previews')
  }
})

test('explicit contained logos retain their intentional white background in the new preview frame', () => {
  for (const photo of [{ fit: 'contain' }, { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736' }]) {
    assert.deepEqual(businessPhotoStyle(photo, { preview: true }), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
  }
})

test('both original VESI portrait images, order and existing crop metadata remain byte-for-byte unchanged', async () => {
  assert.deepEqual(vesi.map(photo => [photo.width, photo.height, photo.position]), [[1200, 1600, '50% 68%'], [1200, 1600, '50% 56%']])
  const hashes = ['fe810490fc272849240cce4b7bc090d5218b6fe8cf0e0cf6dd3f2817eaed47f5', '78bbc55a58368094f24c2b279ce37e8640f3355e9b5e2f4546f581624df29a7e']
  for (const [index, photo] of vesi.entries()) {
    const bytes = await readFile(new URL('../public' + photo.src, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hashes[index])
    assert.equal(businessPhotoStyle(photo, { preview: true }).objectPosition, 'center')
  }
})

test('actual gallery component previews use containment in profile, directory and details without labelling real images AI', () => {
  for (const locale of ['bg', 'en']) for (const variant of ['profile', 'directory', 'details']) {
    const html = render(BusinessPhotoGallery, { photos: vesi, businessName: 'ВЕСИ СТУДИО', locale, variant, autoplay: false })
    assert.match(html, /data-photo-fit="contain"/)
    assert.match(html, /data-photo-controls="navigation"/)
    assert.match(html, /style="object-fit:contain;object-position:center;background-color:var\(--photo-preview-surface, #f5f1eb\)"/)
    assert.match(html, /interior-20261026\.webp/)
    assert.match(html, /<div class="business-photo-preview-controls">.*business-photo-prev.*business-photo-next.*business-photo-counter/s)
    assert.doesNotMatch(html, /AI илюстрация|AI illustration|business-category-cover-label/)
    if (variant !== 'details') assert.ok(html.indexOf('interior-20261026.webp') < html.indexOf('entrance-20261026.webp'))
  }
})

test('string and localized original alt text survives the preview while empty media retains its provided fallback', () => {
  const html = render(BusinessPhotoGallery, { photos: [{ src: '/api/business-media/existing-owner-photo', alt: 'Original owner description' }], businessName: 'Actual business', autoplay: false })
  assert.match(html, /alt="Original owner description"/)
  assert.match(html, /data-photo-controls="counter"/)
  assert.doesNotMatch(html, /class="business-photo-(?:prev|next)"|AI illustration/)
  assert.equal(render(BusinessPhotoGallery, { photos: [], fallback: createElement('p', null, 'Existing fallback') }), '<p>Existing fallback</p>')
})

test('only genuinely generated cover artwork has the visible disclosure and explicit illustration marker', () => {
  const html = render(BusinessCoverPhoto, { business: {
    id: 'sofia-photo-studio-margo-svoboda',
    category: 'other',
    illustrativeCoverPhotoKey: 'sx-outdoor-family-photoshoot',
  }, locale: 'bg' })
  assert.match(html, /activity-sx-outdoor-family-photoshoot-v1\.webp/)
  assert.match(html, /data-image-kind="ai-illustration"/)
  assert.match(html, /alt="AI илюстрация\./)
  assert.doesNotMatch(html, /business-category-cover-label/)
  const missing = render(BusinessCoverPhoto, { business: { category: 'fitness', services: [{ name: 'Unmapped future sport' }] }, locale: 'en' })
  assert.doesNotMatch(missing, /data-image-kind|business-category-cover-label|AI illustration/)
  const sharedPhoto = render(BusinessCoverPhoto, { business: { id: 'another-studio', category: 'nails', services: [{ name: 'Класически маникюр', category: 'nails' }] }, locale: 'bg' })
  assert.doesNotMatch(sharedPhoto, /<img|data-image-kind|AI илюстрация/, 'no reused artwork for an unrelated business')
})

test('photo-only stylesheet reserves a control gutter and useful frames instead of zooming or obscuring the image', async () => {
  const css = await read('app/discovery-photo-refinement.css')
  assert.match(css, /--photo-controls-space:\s*52px/)
  assert.match(css, /inset:\s*0 0 var\(--photo-controls-space\)/)
  assert.match(css, /\.business-photo-preview-controls[\s\S]*grid-template-columns:\s*44px 44px minmax\(0,1fr\) 44px/)
  assert.match(css, /width:\s*44px;\s*height:\s*44px/)
  assert.match(css, /:focus-visible\s*\{\s*outline:\s*3px/)
  assert.doesNotMatch(css, /scale\(|zoom:|filter:|\.discovery-query|\.service-thumbnail/)
})

test('disclosure is a single readable eleven-pixel line with restrained surfaces, not an invisible tooltip', async () => {
  const css = await read('app/discovery-photo-refinement.css')
  assert.match(css, /\[data-image-kind="ai-illustration"\] > \.business-category-cover-label\s*\{[^}]*font-size:\s*11px;[^}]*white-space:\s*nowrap;/s)
  assert.match(css, /padding:\s*1px 3px/)
  assert.match(css, /background:\s*#fff8efe8/)
  assert.match(css, /color:\s*#512b19/)
  assert.doesNotMatch(css, /opacity:\s*0|visibility:\s*hidden|display:\s*none[^}]*business-category-cover-label/)
})
