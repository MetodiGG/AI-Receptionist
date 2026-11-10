// Read-only inventory export. No database credentials or writes.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute } from 'node:path'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const { values } = parseArgs({ options: { output: { type: 'string' }, registered: { type: 'string' } } })
if (!values.output || !isAbsolute(values.output)) throw Error('Absolute output path required')
const catalogue = SOFIA_CATALOGUE.map(row => ({ ...row, source: 'catalogue', ownerManaged: false }))
const registered = values.registered ? JSON.parse(await readFile(values.registered, 'utf8')) : []
if (!Array.isArray(registered) || registered.some(row => !row.id || row.ownerManaged !== true)) throw Error('Expected a read-only owner-managed business inventory')
const records = [...catalogue, ...registered.map(row => ({ ...row, officialWebsite: row.website || null,
  website: row.website || row.bookingUrl || null, websiteKind: row.website ? 'official_website' : row.bookingUrl ? 'owner_configured_booking_platform' : 'none', source: 'gorez' }))]
if (new Set(records.map(row => `${row.source}:${row.id}`)).size !== records.length) throw Error('Duplicate inventory identifiers')
await mkdir(dirname(values.output), { recursive: true })
await writeFile(values.output, JSON.stringify({ checkedAt: new Date().toISOString(), records }, null, 2) + '\n')
console.log(JSON.stringify({ catalogue: catalogue.length, registered: registered.length, records: records.length, output: values.output }))
