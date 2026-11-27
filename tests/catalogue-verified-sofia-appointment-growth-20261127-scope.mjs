import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-sofia-appointment-growth-20261127.json' with { type: 'json' }
import { lateOwnerPointsPriorCatalogue, lateOwnerPointsPriorSource } from './catalogue-verified-owner-civic-points-20261127-scope.mjs'

export const {
  allowsFileChange: appointmentGrowthAllowsFileChange, allowsNewFile: appointmentGrowthAllowsNewFile,
  allowsPath: appointmentGrowthAllowsPath, priorSource, priorCatalogue,
} = exactCatalogueIntakeScope(receipt, 'Verified Sofia appointment growth')

// Retain the exact appointment-growth receipt; unwind the next point-only
// release before attempting to reconstruct snapshots for earlier consumers.
export const appointmentGrowthPriorSource = (path, source) => priorSource(path, lateOwnerPointsPriorSource(path, source))
export const appointmentGrowthPriorCatalogue = rows => priorCatalogue(lateOwnerPointsPriorCatalogue(rows))
