import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-garage46-serdika-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: garage46AllowsFileChange,
  allowsNewFile: garage46AllowsNewFile,
  allowsPath: garage46AllowsPath,
  priorSource: garage46PriorSource,
  priorCatalogue: garage46PriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Garage46 Serdika')
