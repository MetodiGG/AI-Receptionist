import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-nadezhda-fitness-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: nadezhdaAllowsFileChange, allowsNewFile: nadezhdaAllowsNewFile,
  allowsPath: nadezhdaAllowsPath, priorSource: nadezhdaPriorSource, priorCatalogue: nadezhdaPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Nadezhda fitness intake')
