import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-levski-karpuzitsa-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue,
  priorSource as nextPriorSource } from './catalogue-zaharna-suhata-20261127-scope.mjs'

const intake = exactCatalogueIntakeScope(receipt, 'Verified Levski and Karpuzitsa intake')
export const allowsFileChange = path => intake.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => intake.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, source) => intake.priorSource(path, nextPriorSource(path, source))
export const priorCatalogue = rows => intake.priorCatalogue(nextPriorCatalogue(rows))
