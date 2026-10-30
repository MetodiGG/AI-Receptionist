// Synthetic technical fixtures only; never use a real customer's photo.
import sharp from 'sharp'
import { randomFillSync } from 'node:crypto'
import { mkdtemp, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'gorez-photo-upload-qa-'))
const noise = randomFillSync(Buffer.alloc(6000 * 4000 * 3))
await sharp(noise, { raw: { width: 6000, height: 4000, channels: 3 } }).jpeg({ quality: 96 }).toFile(join(directory, 'phone-24mp-large.jpg'))
await sharp(noise, { raw: { width: 6000, height: 4000, channels: 3 } }).resize(2400, 1600).png().toFile(join(directory, 'large-screenshot.png'))
await sharp({ create: { width: 8064, height: 6048, channels: 3, background: '#ed783d' } }).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toFile(join(directory, 'phone-48mp.jpg'))
await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#a0c8d4' } }).webp().toFile(join(directory, 'business-photo.webp'))
for (const name of ['phone-24mp-large.jpg', 'large-screenshot.png', 'phone-48mp.jpg', 'business-photo.webp']) console.log(JSON.stringify({ path: join(directory, name), bytes: (await stat(join(directory, name))).size }))
