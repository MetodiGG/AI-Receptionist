import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-sofia-cross-quarter-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: crossQuarterAllowsFileChange, allowsNewFile: crossQuarterAllowsNewFile,
  allowsPath: crossQuarterAllowsPath, priorSource: crossQuarterPriorSource,
  priorCatalogue: crossQuarterPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Sofia cross-quarter intake')
