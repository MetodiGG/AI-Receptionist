import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// A separate, phone-only forward delta. Historical scope maps stay untouched.
export const SPORTS_MOBILE_PHOTO_FIT_BASE = 'c29e577c1dce772115446df4bd2bb56375b1eda9'
export const SPORTS_MOBILE_PHOTO_FIT_HASHES = Object.freeze({
  'app/inline-discovery.css': 'a14c351450cfaac256facabe5c67faf7f6e46ccdc2878fb16ae5bc044daef9d1',
})
const previousCssHash = 'e05645c9899792da6de60fcdb0d19601cb5fca869d77c5e810e6c5643180ab38'
export const SPORTS_MOBILE_PHOTO_FIT_DELTA = `/* Keep the footballer's head, boots and ball above the mobile caption.
   Crop spare sky/grass, not the player; every other tile stays unchanged. */
@media (max-width:699px) {
  .inline-category-photo-frame .inline-category-photo[src="/category-photos/fitness-large-v3.webp"] {
    height: calc(100% - 2.25rem); object-fit: cover; object-position: 50% 62%;
  }
  .inline-category-option:hover .inline-category-photo[src="/category-photos/fitness-large-v3.webp"] { transform: none; }
}
`
const sha256 = source => createHash('sha256').update(source).digest('hex')

export function sportsMobilePhotoFitAllowsFileChange(path) {
  if (!Object.hasOwn(SPORTS_MOBILE_PHOTO_FIT_HASHES, path)) return false
  try {
    return sha256(readFileSync(new URL('../' + path, import.meta.url))) === SPORTS_MOBILE_PHOTO_FIT_HASHES[path]
  } catch { return false }
}

// Reconstruct only the exact prior bytes, not a selector-based exemption.
// Unknown/duplicated/altered deltas cannot hide unrelated changes from a proof.
export function sportsMobilePhotoFitPriorCss(source) {
  if (sha256(source) === previousCssHash) return source
  if (sha256(source) !== SPORTS_MOBILE_PHOTO_FIT_HASHES['app/inline-discovery.css']
    || source.split(SPORTS_MOBILE_PHOTO_FIT_DELTA).length !== 2) throw new Error('Unreviewed sports mobile CSS delta')
  const previous = source.replace(SPORTS_MOBILE_PHOTO_FIT_DELTA, '')
  if (sha256(previous) !== previousCssHash) throw new Error('Sports mobile CSS must restore the exact prior stylesheet')
  return previous
}
