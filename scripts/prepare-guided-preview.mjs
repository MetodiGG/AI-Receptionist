// One bounded, read-only public snapshot for local design review. No auth,
// customer data, booking, image editing or production write is involved.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const origin = 'https://www.gorez.co'
const response = await fetch(origin + '/api/public/businesses', { signal: AbortSignal.timeout(20000) })
if (!response.ok) throw Error('Public directory unavailable: ' + response.status)
const { businesses } = await response.json()
const allowedIds = ['450c5c2f-db41-476b-a21e-98cf5ee29194','f309d060-d96d-4237-8fa6-00db10b7ac3d','e5b029ba-3586-485b-ac19-978a8386922d','09f6d770-cdd5-40d2-8e82-d7e2cc9e263a','2ddceca9-1716-4ba2-bf63-2beaf0857afb','c6efda2d-a2c1-4ff5-93f6-9b9d4cf8bf7e','6b57b901-acd8-494b-a992-2cec551b4b00']
const rows = businesses.filter(row => allowedIds.includes(row.id))
if (rows.length !== allowedIds.length) throw Error('Expected public preview businesses changed')
await mkdir(new URL('../public/businesses/guided-preview/', import.meta.url), { recursive: true })
const localPhotos = {}, images = []
for (const row of rows) {
  if (row.id === allowedIds[0] || !row.photos?.length) continue
  const photo = row.photos[0]
  if (!/^\/api\/business-media\/[a-f0-9-]{36}$/.test(photo.src)) throw Error('Unrecognised public image')
  const imageResponse = await fetch(origin + photo.src, { signal: AbortSignal.timeout(20000) })
  if (!imageResponse.ok || !imageResponse.headers.get('content-type')?.startsWith('image/webp')) throw Error('Original WebP unavailable')
  const bytes = Buffer.from(await imageResponse.arrayBuffer())
  const filename = row.id + '.webp'
  await writeFile(new URL('../public/businesses/guided-preview/' + filename, import.meta.url), bytes, { flag: 'wx' })
  const local = '/businesses/guided-preview/' + filename
  localPhotos[row.id] = [{ ...photo, src: local }]
  images.push({ businessId: row.id, source: origin + photo.src, local, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), transformation: 'none; byte-for-byte original public response', width: photo.width, height: photo.height })
}
const snapshot = { checkedOn: '2026-11-21', source: origin + '/api/public/businesses', purpose: 'Local preview only. Public metadata snapshot; booking actions disabled. First uploaded photo copied unchanged for five partners; both checked-in VESI originals reused in original order. No current square partner upload exists in this snapshot.', businesses: rows, localPhotos, images }
await writeFile(new URL('../tests/fixtures/guided-public-partners-20261121.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ businesses: rows.length, originalImagesCopied: images.length, originalBytes: images.reduce((sum, image) => sum + image.bytes, 0), imageShapes: images.map(({width,height}) => [width,height]), noSquarePartnerAvailable: !rows.some(row => row.photos?.some(photo => photo.width === photo.height)) }))
