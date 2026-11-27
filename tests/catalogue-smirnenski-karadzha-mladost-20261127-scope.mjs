import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-smirnenski-karadzha-mladost-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew,
  priorSource as nextPriorSource, priorCatalogue as nextPriorCatalogue } from './catalogue-izgrev-hladilnika-20261127-scope.mjs'

const here = exactCatalogueIntakeScope(receipt, 'Verified Smirnenski, Karadzha and Mladost intake')
export const allowsFileChange = path => here.allowsFileChange(path) || nextChange(path)
export const allowsNewFile = path => here.allowsNewFile(path) || nextNew(path)
export const priorSource = (path, source) => here.priorSource(path,nextPriorSource(path,source))
export const priorCatalogue = rows => here.priorCatalogue(nextPriorCatalogue(rows))
