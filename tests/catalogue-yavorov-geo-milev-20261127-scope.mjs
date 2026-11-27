import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-yavorov-geo-milev-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: yavorovAllowsFileChange, allowsNewFile: yavorovAllowsNewFile, allowsPath: yavorovAllowsPath,
  priorSource: yavorovPriorSource, priorCatalogue: yavorovPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Yavorov Geo Milev intake')
