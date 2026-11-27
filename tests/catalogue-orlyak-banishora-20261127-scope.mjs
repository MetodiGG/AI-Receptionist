import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-orlyak-banishora-20261127.json' with { type: 'json' }

export const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Orlyak intake')
