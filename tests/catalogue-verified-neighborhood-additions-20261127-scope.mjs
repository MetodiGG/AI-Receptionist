import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-neighborhood-additions-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: neighborhoodAdditionsAllowsFileChange,
  allowsNewFile: neighborhoodAdditionsAllowsNewFile,
  priorSource: neighborhoodAdditionsPriorSource,
  priorCatalogue: neighborhoodAdditionsPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified neighborhood additions')
