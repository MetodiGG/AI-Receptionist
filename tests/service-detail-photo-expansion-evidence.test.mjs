import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import expansion from '../lib/service-detail-photo-expansion-20261126.json' with { type: 'json' }
import beauty from '../docs/service-detail-photo-beauty-20261126.json' with { type: 'json' }
import autoHome from '../docs/service-detail-photo-auto-home-20261126.json' with { type: 'json' }
import activity from '../docs/service-detail-photo-activity-education-20261126.json' with { type: 'json' }
import specialties from '../docs/service-detail-photo-specialties-20261126.json' with { type: 'json' }
import { serviceDetailAlternates } from '../lib/service-detail-photo-variants.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'

const manifests = [beauty, autoHome, activity, specialties]
const assetUrl = filename => new URL('../' + filename, import.meta.url)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

test('each new detail-only scene is source-bound, compressed and visually distinct', async () => {
  const assets = manifests.flatMap(manifest => manifest.assets)
  assert.ok(assets.length >= 49)
  assert.equal(new Set(assets.map(asset => asset.file)).size, assets.length)
  assert.deepEqual(expansion, assets.map(({ file, primaryKeys, only, skip, alt }) => ({
    src: file.slice('public'.length), primaryKeys: [...new Set(primaryKeys)],
    ...(only ? { only } : {}), ...(skip ? { skip } : {}), ...(alt ? { alt } : {}),
  })))
  const verified = []
  for (const asset of assets) {
    assert.match(asset.sourceSha256, /^[a-f0-9]{64}$/u)
    assert.match(asset.prompt, /photorealistic-natural/u)
    assert.match(asset.file, /^public\/service-photos\/go-detail-[a-z0-9-]+-20261126-v2\.webp$/u)
    const bytes = await readFile(assetUrl(asset.file))
    assert.equal(digest(bytes), asset.optimizedSha256, asset.file)
    assert.equal(bytes.length, asset.bytes, asset.file)
    assert.ok(bytes.length < 32_000, asset.file)
    const photo = await fingerprintDiscoveryPhoto(bytes)
    assert.deepEqual([photo.width, photo.height, photo.format], [256, 256, 'webp'], asset.file)
    for (const [otherFile, other] of verified) {
      assert.equal(compareDiscoveryPhotos(photo, other), null, asset.file + ' / ' + otherFile)
    }
    verified.push([asset.file, photo])
  }
})

test('expansion distinguishes technique, class format, age and otherwise vague titles', () => {
  const options = { expansionOnly: true, confirmedActivity: false }
  const resolve = (key, name, context = options) => serviceDetailAlternates(`/service-photos/${key}-v1.webp`, { name }, context).map(photo => photo.src)
  assert.ok(resolve('beard-trim', 'Оформяне на брада').some(src => src.includes('-beard-shaping-')))
  assert.equal(resolve('beard-trim', 'Оформяне на брада с боядисване').length, 0)
  assert.equal(resolve('beard-trim', 'Услуга по запитване').length, 0)
  assert.equal(resolve('classic-pedicure', 'Апаратен медицински педикюр').length, 0)
  assert.ok(resolve('gel-manicure', 'Френски маникюр с гел лак').some(src => src.includes('-french-gel-tip-')))
  assert.ok(resolve('yoga-class', 'Групова йога практика', { ...options, confirmedActivity: true }).some(src => src.includes('-group-yoga-')))
  assert.equal(resolve('yoga-class', 'Индивидуална йога за бременни', { ...options, confirmedActivity: true }).length, 0)
  assert.ok(resolve('auto-diagnostics', 'Компютърна диагностика на автомобил').some(src => src.includes('-auto-computer-diagnostics-')))
  assert.equal(resolve('auto-diagnostics', 'Диагностика на автомобилен климатик').length, 0)
  assert.equal(resolve('photography-session', 'Концептуален грим за фотосесия').length, 0)
  assert.ok(resolve('language-lesson', 'Бизнес английски · индивидуално обучение').every(src => !src.includes('-child-private-')))
  assert.ok(resolve('language-lesson', 'Индивидуален урок по английски за деца').every(src => !src.includes('-adult-private-')))
})
