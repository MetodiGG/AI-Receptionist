import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { CATEGORY_ART_ASSETS, businessArtCategory, categoryArtSource } from '../lib/category-art.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { INDUSTRY_KEYS } from '../lib/public-locale.mjs'

const read = path => readFile(new URL(`../${path}`,import.meta.url),'utf8')
test('every supported category and industry resolves to versioned local artwork, never an arbitrary URL or prototype property',()=>{
  for(const category of CATEGORY_IDS)assert.match(categoryArtSource(category),/^\/category-art\/[a-z]+-v1\.webp$/)
  for(const industry of INDUSTRY_KEYS)assert.ok(CATEGORY_IDS.includes(businessArtCategory({industry,services:[]})))
  for(const value of [undefined,null,'__proto__','constructor','https://example.com/evil.png','../../private'])assert.equal(categoryArtSource(value),'/category-art/appointments-v1.webp')
  assert.notEqual(categoryArtSource('barber'),categoryArtSource('hair'))
  assert.notEqual(categoryArtSource('nails'),categoryArtSource('beauty'))
  assert.notEqual(categoryArtSource('car_wash'),categoryArtSource('auto_repair'))
  assert.notEqual(categoryArtSource('auto_repair'),categoryArtSource('detailing'))
  assert.equal(categoryArtSource('car_wash'),'/category-art/carwash-v1.webp')
  assert.equal(categoryArtSource('auto_repair'),'/category-art/repair-v1.webp')
})
test('Zen uses a barber clipper; manicure businesses use nail art without changing stored business facts',()=>{
  const zen={id:'public-name-reference-only',name:'Zen Barbershop',industry:'beauty',services:[]},before=JSON.stringify(zen)
  assert.equal(businessArtCategory(zen),'barber');assert.match(categoryArtSource(businessArtCategory(zen)),/barber-v1/)
  assert.equal(JSON.stringify(zen),before)
  assert.equal(businessArtCategory({industry:'beauty',name:'Studio',services:[{name:'Маникюр',active:true},{name:'Педикюр',active:true}]}),'nails')
  assert.equal(businessArtCategory({industry:'beauty',name:'Studio',services:[{name:'Мъжко подстригване',active:true}]}),'hair')
  assert.equal(businessArtCategory({industry:'beauty',name:'Studio',services:[{name:'Маникюр',active:false}]}),'beauty')
  assert.equal(businessArtCategory({industry:'auto',name:'Barber Motors',services:[]}),'auto_repair')
})
test('all optimized illustrations retain genuine transparency, correct dimensions and stripped metadata within a small asset budget',async()=>{
  let total=0
  for(const name of CATEGORY_ART_ASSETS)for(const [suffix,size]of[['-sm',128],['',256]]){
    const path=new URL(`../public/category-art/${name}${suffix}-v1.webp`,import.meta.url),bytes=await readFile(path),metadata=await sharp(bytes).metadata(),statistics=await sharp(bytes).stats()
    assert.equal(metadata.format,'webp');assert.equal(metadata.width,size);assert.equal(metadata.height,size);assert.equal(metadata.hasAlpha,true)
    assert.equal(metadata.exif,undefined);assert.equal(metadata.xmp,undefined);assert.equal(statistics.channels.at(-1).min,0);assert.equal(statistics.channels.at(-1).max,255)
    assert.ok((await stat(path)).size<35000);total+=bytes.length
  }
  assert.ok(total<420000)
})
test('the five home icons are served as small responsive decorative images without changing readable category labels',async()=>{
  let small=0,large=0
  for(const category of ['hair','nails','car_wash','fitness','auto_repair'])for(const [isSmall,key]of[[true,'small'],[false,'large']]){
    const bytes=(await stat(new URL(`../public${categoryArtSource(category,isSmall)}`,import.meta.url))).size
    if(key==='small')small+=bytes;else large+=bytes
  }
  assert.ok(small<50000);assert.ok(large<125000)
  const component=await read('components/business-category-icon.js'),ui=await read('components/discovery-search.js')
  assert.match(component,/aria-hidden="true"/);assert.match(component,/alt=""/);assert.match(component,/srcSet=/);assert.match(component,/decoding="async"/)
  assert.match(ui,/<BusinessCategoryIcon category=\{id\} size=\{44\} eager\/>\{item\[locale\]\}/)
  assert.match(ui,/<Icon name="pin"/);assert.match(ui,/<Icon name="arrow"/)
})
test('the illustrative icon system remains for navigation and admin, not as a business cover',async()=>{
  const directory=await read('components/business-directory.js'),search=await read('components/discovery-business-card.js'),profile=await read('components/business-profile.js'),css=await read('app/category-art.css')
  for (const surface of [directory, search, profile]) assert.doesNotMatch(surface, /<BusinessCategoryIcon/)
  assert.match(css,/object-fit: contain/)
  assert.doesNotMatch(search,/photos:.*categoryArtSource/)
  for(const file of ['components/platform-admin.js','components/admin-application-card.js'])assert.match(await read(file),/<BusinessCategoryIcon business=/)
})
test('all prompt records are built-in transparent generations; design fixture is guarded and booking-disabled',async()=>{
  const manifest=JSON.parse(await read('docs/category-art-prompts-2026-10-30.json'))
  assert.equal(manifest.assets.length,12);assert.match(manifest.mode,/Built-in image_gen/);assert.match(manifest.mode,/transparent_background=true/)
  const page=await read('app/dev/category-art/page.js')
  assert.match(page,/\.devMock\) notFound\(\)/);assert.match(page,/partners bookingDisabled/);assert.match(page,/ЛОКАЛЕН ДИЗАЙН ТЕСТ/)
  assert.doesNotMatch(page,/fetch\(|supabase|GoogleDiscoveryList|trackProductEvent/)
})
