import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-dekra-fakulteta-20261127.json' with { type: 'json' }

export const { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } =
  exactCatalogueIntakeScope(receipt, 'Verified DEKRA Fakulteta intake')
