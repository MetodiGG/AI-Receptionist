import { exactCatalogueIntakeScope } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import receipt from './fixtures/catalogue-nadezhda-fitness-20261127.json' with { type: 'json' }
import { lyulin5DentalAllowsFileChange, lyulin5DentalAllowsNewFile,
  lyulin5DentalPriorCatalogue, lyulin5DentalPriorSource } from './catalogue-lyulin5-dental-20261127-scope.mjs'

const { allowsFileChange, allowsNewFile, priorSource, priorCatalogue } =
  exactCatalogueIntakeScope(receipt, 'Verified Nadezhda fitness intake')
export const nadezhdaAllowsFileChange = path => allowsFileChange(path) || lyulin5DentalAllowsFileChange(path)
export const nadezhdaAllowsNewFile = path => allowsNewFile(path) || lyulin5DentalAllowsNewFile(path)
export const nadezhdaAllowsPath = path => nadezhdaAllowsFileChange(path) || nadezhdaAllowsNewFile(path)
export const nadezhdaPriorSource = (path, source) => priorSource(path, lyulin5DentalPriorSource(path, source))
export const nadezhdaPriorCatalogue = rows => priorCatalogue(lyulin5DentalPriorCatalogue(rows))
