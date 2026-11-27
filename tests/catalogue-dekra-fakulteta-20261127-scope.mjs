import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-dekra-fakulteta-20261127.json' with { type: 'json' }
import * as later from './catalogue-sofia-west-appointments-20261127-scope.mjs'

const scope = exactCatalogueIntakeScope(receipt, 'Verified DEKRA Fakulteta intake')
export const allowsFileChange = path => later.allowsFileChange(path) || scope.allowsFileChange(path)
export const allowsNewFile = path => later.allowsNewFile(path) || scope.allowsNewFile(path)
export const priorCatalogue = rows => scope.priorCatalogue(later.priorCatalogue(rows))
export const priorSource = (path, source) => scope.priorSource(path, later.priorSource(path, source))
