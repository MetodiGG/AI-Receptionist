import assert from 'node:assert/strict'
import test from 'node:test'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { publicBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { historicalPhotoModule, historicalPublicDetailServiceThumbnail } from './provider-role-photo-history.mjs'

test('historical image approvals execute exact predecessor behavior without hiding or contaminating current provider-role imports', async () => {
  const now = Date.parse('2026-11-27T12:00:00Z')
  const male = catalogueProfileView(findPublicCatalogueEntry('sofia-nikolay-vivianov-vasilev-lavele16'), { now })
  const female = catalogueProfileView(findPublicCatalogueEntry('sofia-lidia-manova'), { now })
  assert.ok(male && female)
  const old = await historicalPhotoModule('lib/public-business-cover-photo.mjs')
  assert.equal(old.publicBusinessCoverPhoto(male).src, '/business-cover-photos/other-v1.webp')
  assert.notEqual(publicBusinessCoverPhoto(male).src, old.publicBusinessCoverPhoto(male).src)
  const service = female.details.services.find(service => /правна/iu.test(service.name))
  assert.ok(service)
  const oldPhoto = historicalPublicDetailServiceThumbnail(service, { business: female })
  assert.equal(oldPhoto.src, '/service-photos/go-detail-law-office-in-person-20261126-v2.webp')
  assert.notEqual(publicDetailServiceThumbnail(service, { business: female }).src, oldPhoto.src)
  assert.equal(old.publicBusinessCoverPhoto(male).src, '/business-cover-photos/other-v1.webp')
  assert.notEqual(publicBusinessCoverPhoto, old.publicBusinessCoverPhoto)
  assert.notEqual(publicDetailServiceThumbnail, historicalPublicDetailServiceThumbnail)
})

test('historical photo imports cannot escape the repository or replace current tests and configuration', async () => {
  for (const path of ['../outside.mjs', 'lib/../../outside.mjs', 'tests/provider-role-illustrations.test.mjs', 'package.json']) {
    await assert.rejects(historicalPhotoModule(path), /only repository photo modules|stays in the repository/u)
  }
})
