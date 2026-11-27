import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-yavorov-geo-milev-20261127.json' with { type: 'json' }
import { ivonAllowsFileChange, ivonAllowsNewFile, ivonPriorCatalogue, ivonPriorSource } from './catalogue-ivon-gorna-banya-mladost3-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } = exactCatalogueIntakeScope(receipt, 'Verified Yavorov Geo Milev intake')
export const yavorovAllowsFileChange = path => allowsFileChange(path) || ivonAllowsFileChange(path)
export const yavorovAllowsNewFile = path => allowsNewFile(path) || ivonAllowsNewFile(path)
export const yavorovAllowsPath = path => yavorovAllowsFileChange(path) || yavorovAllowsNewFile(path)
export const yavorovPriorSource = (path, source) => priorSource(path, ivonPriorSource(path, source))
export const yavorovPriorCatalogue = rows => priorCatalogue(ivonPriorCatalogue(rows))
