import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { SERVICE_PHOTO_QA_FIXTURES, qaService, qaBusiness } from '../app/dev/service-photos/fixtures.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS, generatedCatalogueServicePhotoKind } from '../lib/service-photos-catalogue-expansion.mjs'

test('local photo QA page is production-disabled/noindex and exercises all 35 real component families plus safe fallbacks', async () => {
  const source = await readFile(new URL('../app/dev/service-photos/page.js', import.meta.url), 'utf8')
  assert.match(source, /if \(process\.env\.NODE_ENV === 'production'\) notFound\(\)/)
  assert.match(source, /robots: \{ index: false, follow: false \}/)
  assert.match(source, /import \{ ServiceThumbnail \} from '\.\.\/\.\.\/\.\.\/components\/service-thumbnail'/)
  assert.match(source, /data-qa-photo="neutral"/)
  assert.match(source, /data-qa-photo="broken-trusted"/)
  assert.match(source, /src: '\/businesses\/qa-fixture\/missing-service-photo\.webp'/)
  assert.doesNotMatch(source, /fetch\(|supabase|\/api\/|https?:|onSubmit|<form|booking/)
  assert.equal(SERVICE_PHOTO_QA_FIXTURES.length, 35)
  assert.deepEqual(SERVICE_PHOTO_QA_FIXTURES.map(row => row[0]).sort(), [...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS].sort())
  for (const fixture of SERVICE_PHOTO_QA_FIXTURES) assert.equal(generatedCatalogueServicePhotoKind(qaService(fixture), qaBusiness(fixture)), fixture[0], fixture[1])
})
