import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-verified-neighborhood-additions-20261127.json' with { type: 'json' }
import { branchLocationFollowupAllowsFileChange, branchLocationFollowupAllowsNewFile,
  branchLocationFollowupPriorCatalogue, branchLocationFollowupPriorSource } from './catalogue-branch-location-followup-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } = exactCatalogueIntakeScope(receipt, 'Verified neighborhood additions')

// Historical guards unwind the latest exact successor before this receipt.
export const neighborhoodAdditionsAllowsFileChange = path => allowsFileChange(path) || branchLocationFollowupAllowsFileChange(path)
export const neighborhoodAdditionsAllowsNewFile = path => allowsNewFile(path) || branchLocationFollowupAllowsNewFile(path)
export const neighborhoodAdditionsPriorSource = (path, source) => priorSource(path, branchLocationFollowupPriorSource(path, source))
export const neighborhoodAdditionsPriorCatalogue = rows => priorCatalogue(branchLocationFollowupPriorCatalogue(rows))
