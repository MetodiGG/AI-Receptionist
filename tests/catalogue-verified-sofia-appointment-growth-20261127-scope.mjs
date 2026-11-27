import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-sofia-appointment-growth-20261127.json' with { type: 'json' }

export const {
  allowsFileChange: appointmentGrowthAllowsFileChange, allowsNewFile: appointmentGrowthAllowsNewFile,
  allowsPath: appointmentGrowthAllowsPath, priorSource: appointmentGrowthPriorSource,
  priorCatalogue: appointmentGrowthPriorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Sofia appointment growth')
