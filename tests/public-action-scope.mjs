import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Separate owner-approved compact-card / shared-action stage. Historical
// authorizations, baseline commits, image inventories and data remain frozen.
export const PUBLIC_ACTION_BASE = '49ecbc6e86ab60e46639caddb2083541ebcb8ccc'
export const PUBLIC_ACTION_HASHES = Object.freeze({
  'app/businesses/catalogue/[id]/page.js': 'de42fd2d262d4dac39dcfcbdb6142bef59fdc4706d61306588969ee1b7f835c5',
  'app/premium-discovery-cards.css': 'b390b47cdffd13f944cdaa90693fda0bb8b03a1e5789698145934170d77f125d',
  'components/booking-button-content.js': 'dcfca9e575ef03b8f020f9af8883b0f41e1c3f54eab02f44176b547596f68929',
  'components/business-directory.js': '71b0c43f1cecbda7590e54313f32a834bd20c656e624f2498ee4be8f553e91e4',
  'components/business-profile.js': '1e2757553b6386d8a42f2644f8cfd2fcbe5d2b09cfe43db669cb54110fde7561',
  'components/discovery-business-card.js': '3897b7b72f6daee656cff275adddd3a3e8368c239b369e10e1f2b63bea57a1f7',
  'components/discovery-distance-badge.js': '51435601c32715289d99c846d829b46325983cf6b1c465038fc433f4dc2fe8f7',
  'components/google-business-card.js': '1ff48c3ce0b64bd6f52a373c57071331cc213ecd9bc85c064852a1364078edc6',
  'components/google-card-local-preview.js': 'bf579b5d71ecb0d3a3ad0fbd2fbbb9fdd2ff8111528237d726f132da017c3115',
  'components/icon.js': '756e4b9294ae783ad3b8e5e6a7dfb75dc7dae04c0a70e0cac34126d74643bed4',
  'components/outbound-booking-button.js': '5a22fae2306591b9593bee4d94548ca4334ae30c19a456a7157fdbd0e7c3825e',
  'components/public-booking-page.js': 'fd4e88fceb66518cf587e4fe26b4a337102d0e0047f4eeee4a8e16bc1dec5caa',
})
export const PUBLIC_ACTION_NEW_HASHES = Object.freeze({
  'components/public-action.js': '51457a8f15a57104b4c25fed412164584273f86e3126545f3918df06542ed7cb',
  'components/public-action.module.css': 'eb09123c2eb9cb571c348c3ed62c94c12f4cbc57c9438f5319f736b34d8d5fe0',
})
function matches(path, hashes) {
  if (!Object.hasOwn(hashes,path)) return false
  try { return createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex') === hashes[path] }
  catch { return false }
}
export const publicActionAllowsFileChange = path => matches(path,PUBLIC_ACTION_HASHES)
export const publicActionAllowsNewFile = path => matches(path,PUBLIC_ACTION_NEW_HASHES)
