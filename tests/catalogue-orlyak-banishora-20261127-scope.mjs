import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-orlyak-banishora-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew,
  priorSource as nextPriorSource, priorCatalogue as nextPriorCatalogue } from './catalogue-aslan-sfdent-20261127-scope.mjs'

const here = exactCatalogueIntakeScope(receipt, 'Verified Orlyak intake')
export const allowsFileChange = path => here.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => here.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, input) => here.priorSource(path, nextPriorSource(path, input))
export const priorCatalogue = rows => here.priorCatalogue(nextPriorCatalogue(rows))
