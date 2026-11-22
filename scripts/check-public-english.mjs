import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { buildPublicEnglishInventory } from './inventory-public-english.mjs'
import { auditEnglishInventory } from '../lib/locale/english-coverage.mjs'

export async function checkPublicEnglish({ scope = 'public', checkedOn = new Date().toISOString().slice(0, 10) } = {}) {
  const [{ SOFIA_CATALOGUE }, { SERVICE_SUGGESTION_DATA }, snapshot, dictionary] = await Promise.all([
    import('../lib/discovery/sofia-catalogue.mjs'), import('../lib/service-suggestion-data.mjs'),
    readFile(new URL('../tests/fixtures/guided-public-partners-20261121.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../lib/locale/service-english.json', import.meta.url), 'utf8').then(JSON.parse),
  ])
  const inventory = buildPublicEnglishInventory({ catalogue: SOFIA_CATALOGUE, partners: snapshot.businesses, suggestions: SERVICE_SUGGESTION_DATA, checkedOn, scope })
  return { checkedOn, scope, ...auditEnglishInventory(inventory, dictionary) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkPublicEnglish({ scope: process.argv.includes('--all') ? 'all' : 'public' })
    // Keep full source strings out of routine CI output. An explicit authoring
    // inventory provides exact missing keys without querying a live account.
    process.stdout.write(JSON.stringify({ complete: result.complete, checkedOn: result.checkedOn, scope: result.scope, totals: result.totals,
      missing: result.missing.length, invalid: result.invalid.length, quantityChanges: result.quantityChanges.length, qualificationChanges: result.qualificationChanges.length, limitation: result.limitation }, null, 2) + '\n')
    if (!result.complete) process.exitCode = 1
  } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1 }
}
