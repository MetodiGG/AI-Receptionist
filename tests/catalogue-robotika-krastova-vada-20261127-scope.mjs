import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import { allowsFileChange as laterChange, allowsNewFile as laterNew, priorCatalogue as removeLater, priorSource as restoreLater } from './catalogue-levski-karpuzitsa-20261127-scope.mjs'
import receipt from './fixtures/catalogue-robotika-krastova-vada-20261127.json' with { type: 'json' }

const robotika = exactCatalogueIntakeScope(receipt, 'Verified Robotika branch intake')
export const allowsFileChange = path => robotika.allowsFileChange(path) || laterChange(path)
export const allowsNewFile = path => robotika.allowsNewFile(path) || laterNew(path)
export const priorSource = (path, source) => robotika.priorSource(path, restoreLater(path, source))
export const priorCatalogue = rows => robotika.priorCatalogue(removeLater(rows))
