import { sofiaIntegrityPriorSource, sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile } from "./sofia-location-image-integrity-20261124-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  SPORTS_MOBILE_PHOTO_FIT_BASE, SPORTS_MOBILE_PHOTO_FIT_HASHES, SPORTS_MOBILE_PHOTO_FIT_DELTA,
  sportsMobilePhotoFitAllowsFileChange, sportsMobilePhotoFitPriorCss,
} from './sports-mobile-photo-fit-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, sofiaIntegrityPriorSource(path, source))))))))
const before = path => git('show', SPORTS_MOBILE_PHOTO_FIT_BASE + ':' + path)
const sha256 = source => createHash('sha256').update(source).digest('hex')
const cssPath = 'app/inline-discovery.css'
const css = await read(cssPath)
const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', SPORTS_MOBILE_PHOTO_FIT_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('sports phone framing authorizes one exact CSS path and restores every prior stylesheet byte', async () => {
  assert.deepEqual(Object.keys(SPORTS_MOBILE_PHOTO_FIT_HASHES), [cssPath])
  assert.equal(sha256(css), SPORTS_MOBILE_PHOTO_FIT_HASHES[cssPath])
  assert.equal(sportsMobilePhotoFitAllowsFileChange(cssPath), true)
  assert.equal(sportsMobilePhotoFitPriorCss(css), before(cssPath))
  assert.equal(sportsMobilePhotoFitPriorCss(before(cssPath)), before(cssPath))
  for (const source of [css + '\n', css.replace('50% 62%', '50% 63%'), css + SPORTS_MOBILE_PHOTO_FIT_DELTA]) {
    assert.throws(() => sportsMobilePhotoFitPriorCss(source), /Unreviewed sports mobile CSS delta/u)
  }
  for (const path of ['components/inline-category-grid.js', 'lib/discovery/home.mjs', 'app/premium-discovery-cards.css', 'app/api/public/discovery/route.js', 'public/category-photos/fitness-large-v3.webp', 'lib/discovery/subcategories.mjs', 'package.json']) assert.equal(sportsMobilePhotoFitAllowsFileChange(path), false, path)
})

test('all other production, original photos, data, routes, booking, search and historical review bytes remain frozen', async () => {
  const frozen = tree.filter(record => !sofiaIntegrityAllowsFileChange(record.path) && !sportsMobilePhotoFitAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ': only the phone sports CSS delta is authorized')
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => !sofiaIntegrityAllowsNewFile(path) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && !priority30ReportAllowsNewFile(path) && !regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path)) && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), tree.map(record => record.path).sort(), 'no runtime, image, data or documentation path is added')
  for (const path of ['tests/discovery-refinement-20261122-scope.mjs', 'tests/next-security-upgrade-scope.mjs', 'tests/stationary-discovery-scope.mjs', 'tests/public-action-scope.mjs', 'tests/public-english-scope.mjs', 'tests/services-price-cards-scope.mjs', 'tests/catalogue-revalidation-20261122-scope.mjs']) assert.equal(await read(path), before(path), path + ': never rewrite a historical scope map')
})

test('the delta targets only the original sports category photograph below 700px; tablet, desktop, service photos and ratios are unchanged', () => {
  const delta = parse(SPORTS_MOBILE_PHOTO_FIT_DELTA)
  const media = delta.nodes.filter(node => node.type !== 'comment')
  assert.equal(media.length, 1)
  assert.equal(media[0].type, 'atrule'); assert.equal(media[0].name, 'media'); assert.equal(media[0].params, '(max-width:699px)')
  const rules = media[0].nodes
  assert.deepEqual(rules.map(rule => rule.selector), [
    '.inline-category-photo-frame .inline-category-photo[src="/category-photos/fitness-large-v3.webp"]',
    '.inline-category-option:hover .inline-category-photo[src="/category-photos/fitness-large-v3.webp"]',
  ])
  const values = rule => Object.fromEntries(rule.nodes.map(node => {
    assert.equal(node.type, 'decl'); assert.equal(Boolean(node.important), false)
    return [node.prop, node.value]
  }))
  assert.deepEqual(values(rules[0]), { height: 'calc(100% - 2.25rem)', 'object-fit': 'cover', 'object-position': '50% 62%' })
  assert.deepEqual(values(rules[1]), { transform: 'none' })
  for (const width of [700, 768, 999, 1000, 1440]) assert.equal(width <= 699, false, width + 'px keeps the original styles')
  assert.equal(sportsMobilePhotoFitPriorCss(css), before(cssPath), 'all other selectors, media/container queries, hover, focus, reduced motion and dark styles are byte-identical')
})

test('the original square source and the real phone frames keep the complete ball and player head above the caption', async () => {
  for (const [name, size] of [['fitness-v3.webp', 160], ['fitness-2x-v3.webp', 240], ['fitness-large-v3.webp', 640]]) {
    const { width, height } = await sharp(fileURLToPath(new URL('../public/category-photos/' + name, import.meta.url))).metadata()
    assert.equal(width, size); assert.equal(height, size)
  }
  // Actual browser measurements at the checked phone sizes, normal 16px root
  // text. Subject bounds are measured in the untouched 640px original source.
  const ball = { left: 198, right: 253, top: 510, bottom: 565 }, headY = 124
  for (const [viewport, tileWidth, imageHeight, captionTop] of [[320, 134, 98, 97.5], [390, 165, 129, 128.5], [430, 185, 149, 148.5]]) {
    assert.equal(imageHeight, tileWidth - 2.25 * 16, viewport + 'px reserves the declared caption space')
    const scale = Math.max(tileWidth / 640, imageHeight / 640)
    const offsetX = (tileWidth - 640 * scale) * .5, offsetY = (imageHeight - 640 * scale) * .62
    const visible = { left: ball.left * scale + offsetX, right: ball.right * scale + offsetX, top: ball.top * scale + offsetY, bottom: ball.bottom * scale + offsetY }
    assert.ok(headY * scale + offsetY > 0, viewport + 'px: player head is inside the photo')
    assert.ok(visible.left >= 0 && visible.right <= tileWidth && visible.top >= 0 && visible.bottom <= imageHeight, viewport + 'px: the entire ball remains in the image')
    assert.ok(visible.bottom < captionTop, viewport + 'px: the entire ball clears the caption instead of disappearing behind it')
    assert.ok(ball.bottom * tileWidth / 640 > captionTop, viewport + 'px: the old full-height frame would obscure the ball, so the regression assertion is meaningful')
  }
})
