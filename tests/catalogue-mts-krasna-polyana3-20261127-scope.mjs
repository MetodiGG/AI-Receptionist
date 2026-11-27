import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-mts-krasna-polyana3-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: mtsIntakeAllowsFileChange, allowsNewFile: mtsIntakeAllowsNewFile,
  allowsPath: mtsIntakeAllowsPath, priorSource: mtsIntakePriorSource,
  priorCatalogue: mtsIntakePriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified MTs Krasna Polyana 3 intake')
