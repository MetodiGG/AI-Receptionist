import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-mts-krasna-polyana3-20261127.json' with { type: 'json' }
import { northDogAllowsFileChange, northDogAllowsNewFile,
  northDogPriorCatalogue, northDogPriorSource } from './catalogue-north-dog-branch-point-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified MTs Krasna Polyana 3 intake')
export const mtsIntakeAllowsFileChange = path => allowsFileChange(path) || northDogAllowsFileChange(path)
export const mtsIntakeAllowsNewFile = path => allowsNewFile(path) || northDogAllowsNewFile(path)
export const mtsIntakeAllowsPath = path => mtsIntakeAllowsFileChange(path) || mtsIntakeAllowsNewFile(path)
export const mtsIntakePriorSource = (path, source) => priorSource(path, northDogPriorSource(path, source))
export const mtsIntakePriorCatalogue = rows => priorCatalogue(northDogPriorCatalogue(rows))
