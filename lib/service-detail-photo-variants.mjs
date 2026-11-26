import expansion from './service-detail-photo-expansion-20261126.json' with { type: 'json' }

// Approved, distinct service-detail scenes. Keys refer to the already-vetted
// primary activity image; they are not category-level or name-only guesses.
// The original images stay on the navigation tiles and business covers.
const local = key => `/service-photos/${key}-v1.webp`
const generated = (slug, options = {}) => ({ ...options, src: local(`go-detail-${slug}-20261126`) })
const library = (key, options = {}) => ({ ...options, src: local(key) })

const laser = generated('laser-equipment', {
  skip: /(?:ipl|фотоепилац|тату|перманент|подмлад|rejuvenat|tattoo|pigment)/iu,
  alt: { bg: 'Примерна снимка на апарат за лазерна епилация, не е апаратът на бизнеса',
    en: "Illustrative photo of laser hair removal equipment, not the business's own equipment" },
})

const shots = Object.freeze({
  'gel-manicure': [generated('gel-manicure', {
    skip: /(?:френск|декорац|рисунк|свалян|укрепван|изгражда|поддръжк|педикюр|french|nail art|remov|extension|refill|pedicure)/iu,
  })],
  'nail-gel-removal': [generated('gel-removal', {
    skip: /(?:фрез|апарат|машин|ноктопласт|педикюр|с укрепван|с маникюр|drill|e-file|extension|pedicure|with manicure)/iu,
  })],
  'one-to-one-yoga': [generated('individual-yoga', {
    skip: /(?:групов|двама|онлайн|бремен|въздуш|group|two people|online|prenatal|aerial)/iu,
  })],
  'laser-hair-removal': [laser],
  'laser-equipment': [laser],
  'womens-haircut': [
    library('sx-hair-seq-adult-cut-style', { only: /(?:сешоар|стайлинг|оформяне|blow.?dry|styling)/iu, skip: /(?:дете|детск|момич|мъжк|боядис|бал[еая]+ж|child|men's|colour)/iu }),
    generated('womens-haircut', { skip: /(?:дете|детск|момич|мъжк|бретон|боядис|подравняване на бретон|child|bangs|fringe|men's|colour)/iu }),
  ],
  'mens-haircut': [
    library('sx-barber-cut-wash', { only: /(?:изм[ие]в|миене|wash)/iu, skip: /(?:стайлинг|ножица|брада|детск|дете|style|scissors|beard|child)/iu }),
    library('sx-hair-male-scissor-cut', { only: /(?:ножиц|scissor)/iu, skip: /(?:машинк|измиван|булк|комбо|брада|детск|дете|clipper|wash|beard|child)/iu }),
    generated('mens-haircut', { skip: /(?:ножиц|бръснен|нулев|брада|детск|дете|дълга коса|scissor|shave|beard|child|long hair)/iu }),
  ],
  'psychology-consultation': [generated('psychology', {
    skip: /(?:детск|деца|дете|тийн|юнош|семей|родител|двойк|партньор|груп|онлайн|дистанц|психиат|child|youth|teen|family|parent|coupl|group|online|remote|psychiatr)/iu,
  })],
  'dental-exam': [
    library('sx-dental-exam-plan', { only: /(?:статус|картон|лечебен план|treatment plan|chart)/iu, skip: /(?:детск|дете|зъбен камък|child|cleaning)/iu }),
    generated('dental-exam', { skip: /(?:детск|дете|деца|зъбен камък|кариес|рентген|брекет|избел|child|cleaning|caries|x-ray|whiten)/iu }),
  ],
  'language-lesson': [generated('language-lesson', {
    only: /(?:индивидуал|частен|частни|private|one.to.one)/iu,
    skip: /(?:детск|дете|деца|учени|музик|пеен|пиано|актьор|груп|онлайн|дистанц|child|group|online|music|singing|piano|acting)/iu,
  })],
  'reformer-pilates': [
    library('sx-reformer-duet-session', { only: /(?:двама|двойк|дует|duet|for two)/iu, skip: /(?:бремен|prenatal)/iu }),
    library('sx-reformer-group', { only: /(?:групов|group)/iu, skip: /(?:само за жени|дамск|бремен|индивидуал|двама|за двама|детск|women only|prenatal|individual|duet|for two|children)/iu }),
  ],
  'dog-full-grooming': [library('sx-pet-full-grooming-equipment', {
    only: /(?:груминг|grooming)/iu,
    skip: /(?:подстригване без|само къпане|само подстригване|bath only|haircut only)/iu,
  })],
  'male-manicure': [library('sx-nails-male-natural-manicure', {
    only: /(?:мъжк|men's|male)/iu,
    skip: /(?:гел|ноктопласт|педикюр|gel|extension|pedicure)/iu,
  })],
  'sofa-cleaning': [library('sx-home-upholstery-washing-detail', {
    only: /(?:диван|канапе|мека мебел|sofa|couch|upholster)/iu,
    skip: /(?:авто|кожен|матрак|car seat|leather|mattress)/iu,
  })],
})

const addedShots = new Map()
for (const { src, primaryKeys, only, skip, alt } of expansion) {
  const preview = { src, only: only ? new RegExp(only, 'iu') : null, skip: skip ? new RegExp(skip, 'iu') : null, alt }
  for (const key of primaryKeys) {
    if (!addedShots.has(key)) addedShots.set(key, [])
    addedShots.get(key).push(preview)
  }
}

export const serviceDetailAlternates = (primary, service, { expansionOnly = false, confirmedActivity = true } = {}) => {
  const activity = primary?.match(/^\/service-photos\/([a-z0-9-]+)-v1\.webp$/u)?.[1]
  if (!activity) return []
  const name = service?.name?.normalize('NFC').trim() || ''
  const eligible = variant => (!variant.only || variant.only.test(name)) && !variant.skip?.test(name)
  if (!expansionOnly) return confirmedActivity && Object.hasOwn(shots, activity) ? shots[activity].filter(eligible) : []
  // Without a checked-in exact association, an additional scene requires
  // both a matching underlying activity and an explicit name qualification.
  return (addedShots.get(activity) || []).filter(variant => (confirmedActivity || variant.only) && eligible(variant))
}
