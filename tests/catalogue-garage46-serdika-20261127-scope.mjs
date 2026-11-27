import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-garage46-serdika-20261127.json' with { type: 'json' }
import { auraGrowthAllowsFileChange, auraGrowthAllowsNewFile, auraGrowthPriorCatalogue, auraGrowthPriorSource } from './catalogue-aura-b19-growth-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Garage46 Serdika')

export const garage46AllowsFileChange = path => allowsFileChange(path) || auraGrowthAllowsFileChange(path)
export const garage46AllowsNewFile = path => allowsNewFile(path) || auraGrowthAllowsNewFile(path)
export const garage46AllowsPath = path => garage46AllowsFileChange(path) || garage46AllowsNewFile(path)
export const garage46PriorSource = (path, source) => priorSource(path, auraGrowthPriorSource(path, source))
export const garage46PriorCatalogue = rows => priorCatalogue(auraGrowthPriorCatalogue(rows))
