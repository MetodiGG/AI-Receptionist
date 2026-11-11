import { boundedForm } from './media-handlers.mjs'
import { MAX_APPLICATION_BYTES } from './business-media.mjs'
import { APPLICATION_JSON_CHAR_LIMIT } from './business-application-limits.mjs'

export async function readApplicationPhotos(request) {
  const form = await boundedForm(request, MAX_APPLICATION_BYTES)
  const payload = form.get('payload'), files = [], keys = [...form.keys()]
  if (typeof payload !== 'string' || payload.length > APPLICATION_JSON_CHAR_LIMIT || new Set(keys).size !== keys.length) throw new Error('VALIDATION_ERROR')
  for (const key of keys) {
    if (key === 'payload' || key === 'photoConsent') continue
    if (!/^(gallery|staff)_(0|[1-9]\d?)$/.test(key)) throw new Error('VALIDATION_ERROR')
    const file = form.get(key)
    if (!file || typeof file.arrayBuffer !== 'function') throw new Error('INVALID_IMAGE')
    files.push({ staffIndex: key.startsWith('staff_') ? Number(key.slice(6)) : null, file })
  }
  if (files.length > 32 || files.filter(row => row.staffIndex === null).length > 12 || (files.length && form.get('photoConsent') !== 'true')) throw new Error('VALIDATION_ERROR')
  return { value: JSON.parse(payload), files }
}
export async function prepareApplicationPhotos(files, staffCount, normalize) {
  const images = []
  for (const row of files) {
    if (row.staffIndex !== null && row.staffIndex >= staffCount) throw new Error('INVALID_IMAGE')
    images.push({ staffIndex: row.staffIndex, image: await normalize(row.file) })
  }
  return images
}
