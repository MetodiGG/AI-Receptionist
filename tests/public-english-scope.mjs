import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Separate exact-byte English display / approved shared-button narrow-width
// follow-up. No historical authorization, source data, price or media baseline
// is widened. Every later edit needs another explicit review.
export const PUBLIC_ENGLISH_BASE = 'f908fe398fe3c09da80a27ddea9fcbab34a10fcd'
export const PUBLIC_ENGLISH_HASHES = Object.freeze({
  "app/api/customer/bookings/route.js": "4a042f93b57bcbe5d833c6b7bb6981478d34ddf77975b95b26001b20e5d328b2",
  "app/api/public/[slug]/bookings/route.js": "587c77441a21ec809c6ca17dca6f24553ee15e5ed8d5167a9bee1e15d7103684",
  "app/api/public/[slug]/chat/route.js": "c2165bcf4e4ef97d03b29ec3ac4c4f8ffc82be94c3c43c2dc39ade3096199af7",
  "app/api/public/[slug]/route.js": "c3068aaa19d02666b96edbd090ab234f6068c4442ab17961632e5ce355b3cd2d",
  "app/api/public/appointments/[token]/route.js": "f294cb953ba567dcc277c6153f66483e8ff430a8d480c5932603a24c4e6ec421",
  "app/api/public/businesses/route.js": "e01ce96a44bf800179edac0c5843ff531756b6a3a211100503fb0bd76c30b921",
  "app/booking/[token]/page.js": "8273e877a95fc582ead601f781083611ec51da868d6186dde2c3b3845a12a3cb",
  "app/businesses/catalogue/[id]/page.js": "9c3e436c597075251ff7560c3efad2faf2917f064020db03f92fb8c29d836ee5",
  "app/dev/button-states/page.js": "1b8944021f058df3799cd14bac55bf4d12da9d37bdd9a024ed1e33497baf5666",
  "app/dev/guided-discovery/page.js": "749d3061cf0e3fb315932e899a5c90e60287947e16ae9821ffc3b98347090d8a",
  "app/dev/guided-discovery/preview.js": "7140be60c794fad2017e9e0344c6437ecaefad3fe56e78c679b7a079dfd3d687",
  "app/dev/guided-discovery/search/route.js": "a8f2e8877c60e2101584ed0b1df36f1f6a00ff7c65c207302c6be870ba941e5f",
  "app/dev/inline-discovery/page.js": "1b67f7c4e1b28a013d0e91a32c7f18d84c15668c27d4f884aac36938bb24e4c0",
  "components/booking-confirmation-actions.js": "21587640d36568cb70452a8fd84bc49fbee4f47ce2fcf212b9f980933e7baa28",
  "components/business-directory.js": "20450d6d3ba0e39b87a9813fbafebe04a5b61622c1eaa82462124ed8e3fd06fa",
  "components/business-photo-gallery.js": "b0cb2bbef9045a0ad24a4620a6954b1169766695d6a9728e5e069a0649e590bb",
  "components/business-profile.js": "eea39dfcd898563b1293128bb53574aef3a230c9681db91f130a41a5095bb882",
  "components/customer-account.js": "76e9564e721c95dac1e2fbfb27c0fce87d084af796d411119ed6ee61787f7dc1",
  "components/directory-filters.js": "a33cfe4ed0506b3fd4cab98f4f3b085be78b45d26375887e06f57cdb0cf96570",
  "components/discovery-business-card.js": "6ad6c7a02b9e2ffe9b636bab92727df265da62daba8ddc42d7ba7d798436182a",
  "components/discovery-business-details.js": "d6b811a1e00c0c04b9a6101bf5a8be9d725b83d2d2d0095f8872e6510d16f4f0",
  "components/discovery-filter-sheet.js": "35a6f243d2ece70948f585e9f36629adb6d610159be1d6360a92e4d8c27a493c",
  "components/discovery-search.js": "ef9dc81d6ce93c8152e12680da0a8027324bc93eae5afc942e5006ed74f014c6",
  "components/guided-booking-chat.js": "71ce78767e686fd485928a3d690a9fafeb9039eb51cafa20cc1fdcbf9f8f94c0",
  "components/public-action.module.css": "63ac064c1096794f1424d06656f3c3a4e52d20f047466416901482da1755826e",
  "components/public-booking-page.js": "03430e044c63829506f3e9e64c7216232bc0282b02b17e90febc17557c9fd48a",
  "lib/business-profile.mjs": "d9b4366e4a64baad45f35d1659adb4b1378584199853fb83e0e0886986e7d95e",
  "lib/catalogue-profile.mjs": "f91a3a50c5f3415958d8a110f76b655b2e1d6a192d2af39fb7e664fe04592b20",
  "lib/customer-account.mjs": "e6e4a984bd2b63c682c2666404546b2d09cb56a98003e45e7dde58c4babcb78c",
  "lib/directory.mjs": "c311b7218b557f870956282a3f128a620ff87cd7da391300d762b12f4360f0c6",
  "lib/discovery/business-details.mjs": "06f174672c8bbd282a3096c0cf4edc95d7441a61915475e5905206d10c242b5a",
  "lib/discovery/handler.mjs": "218d1d2eb59533cc8a956e11f280abe47a8f0bf9c1ecb334d2e43d4c7f4fc630",
  "lib/discovery/public-details.mjs": "968c418952b245e2472a948cea5d045eedbbe6a31a140abe9cbdab80e6666b04",
  "lib/discovery/service-presentation.mjs": "4e8144a3de11caa299d211d09c859563a9100bafb0c8c71f344620a22b7c0dbb",
  "lib/discovery/suggestions.mjs": "80984305cb6a4c48ab5da34bee0831b549eb69bf3136a265a45f9440f365488b",
  "lib/guided-assistant.mjs": "24c2f1360436776b044909928eb0be1b23b0018e6874bfc17d1691a31454c4cc",
  "lib/public-directory.mjs": "eab058396862c366ebb9b07fdb54ecefb8544d3dda1175e1a9d08dfbc870d0a7",
  "lib/seo.mjs": "833c97e8552f7c1469a561cc966377c88ad4f02216b17fc8b2ed4a74b7cda439",
  "lib/service-thumbnail.mjs": "f95cc044155f03d24c0c9ddfe989072482e46022ac3aeeba402a9abe01b67d55",
  "scripts/inventory-public-english.mjs": "7cb159ffa93207622ad51cf2aee6bb6ecbcefbdd49eabba4c30587fc36497151"
})
export const PUBLIC_ENGLISH_NEW_HASHES = Object.freeze({
  "lib/locale/english-coverage.mjs": "19101ba143312a434be8453a5b341f0e2e6ff618f6e403f9c7d26791f4c13af9",
  "lib/locale/public-content-resolver.mjs": "9966b4fcc0068a9351a8b354ed45b64665136a689730abecb6f354320ffd9f20",
  "lib/locale/public-content-server.mjs": "ff0a81dc53b4db27af258fe6e21f4906f190c101a69e288bbc7ee4b65ab3c212",
  "lib/locale/public-content.mjs": "9f3c45ffd47f8e3f4be37cbeb8e027fef7bf02ed92ae59ecc72e0763df42bbf5",
  "lib/locale/service-english.json": "3bfbf944c654cbd2df57412be6b7fb99d25bbc0fee14fb98c308545be035ef02",
  "scripts/check-public-english.mjs": "e6638255a1184364c8c475c56f57d4bf4ef9f124374599453345241896d63f93"
})
function matches(path, hashes) {
  if (!Object.hasOwn(hashes, path)) return false
  try { return createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex') === hashes[path] }
  catch { return false }
}
export const publicEnglishAllowsFileChange = path => matches(path, PUBLIC_ENGLISH_HASHES)
export const publicEnglishAllowsNewFile = path => matches(path, PUBLIC_ENGLISH_NEW_HASHES)

// Only text-label calls introduced by this exact display layer are stripped.
// Historical form hashes still cover every element, input value and handler.
export function publicEnglishSearchSource(source) {
  return source.replace("import { postalDisplay } from '../lib/locale/public-content.mjs'\n\n", '')
    .replaceAll('postalDisplay(city.region, locale)', 'city.region')
    .replaceAll('postalDisplay(name, locale)', 'name')
}
