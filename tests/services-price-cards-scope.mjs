import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mobileCataloguePriorSource } from './mobile-catalogue-hotfix-scope.mjs'

// Independent, exact-byte presentation stage. No historic authorization,
// catalogue/price/translation baseline or media inventory is widened.
export const SERVICE_PRICE_CARDS_BASE = '021e525041bcc7a3d479fa0dda668c94c3eeac78'
export const SERVICE_PRICE_CARDS_HASHES = Object.freeze({
  "app/businesses/catalogue/[id]/page.js": "ac188abe50c21264976aaea66ce33f0478b2ddf3da5f15edf4bec1d80908af6f",
  "app/premium-discovery-cards.css": "de94a8d96d413fce2966dd17f2cae3c695499a01706825f2cf6a258bc0d988fc",
  "components/discovery-business-card.js": "780f73501a0bc47940ee2e60acbc5bff3979b5536889441da32562a1dad93b05",
  "components/discovery-business-details.js": "763ec1513eb1b5b3bc981c10666eb6b91b3024cd2af0777e566f7ad7bae373ae",
  "lib/discovery/copy.mjs": "1127e02b2c0e36ada9e9d7dcdb423c2db655f08ecdd1061e069fe253d7573036"
})
export const SERVICE_PRICE_CARDS_NEW_HASHES = Object.freeze({
  "components/public-service-menu.js": "79247ef843886824e704fb098459097b3f23e07bd40a729786e1f1fcaa37fe36",
  "components/public-service-menu.module.css": "57a4f1c9e64f98d1a1070f2ac90bf893bb14f2025771b43da5e69a22d6d0e44f",
  "lib/discovery/service-description-disclosure.mjs": "58b664cc5a444fc875ff50799903c1c1f0a5ac8a578936a2748d97e13ad3822c"
})
function matches(path, hashes) {
  if (!Object.hasOwn(hashes, path)) return false
  try {
    const current = readFileSync(new URL('../' + path, import.meta.url))
    return createHash('sha256').update(mobileCataloguePriorSource(path, current)).digest('hex') === hashes[path]
  }
  catch { return false }
}
export const servicePriceCardsAllowsFileChange = path => matches(path, SERVICE_PRICE_CARDS_HASHES)
export const servicePriceCardsAllowsNewFile = path => matches(path, SERVICE_PRICE_CARDS_NEW_HASHES)
