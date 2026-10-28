import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PRICING_COPY,PRICE_LABEL,MONTHLY_PRICE_EUR,TRIAL_DAYS,companyIdentity} from '../lib/product-config.mjs'
import {fetchDirectory,directoryCategories} from '../lib/directory.mjs'
import {leadSubmissionSchema,leadDatabaseRecord} from '../lib/partner-submission.mjs'
import {createPartnerSubmissionHandler} from '../lib/partner-submission-handler.mjs'
import {pageMetadata,businessStructuredData,safeJsonLd,languageAlternates} from '../lib/seo.mjs'
import {createProductEventHandler,productEventSchema} from '../lib/product-events.mjs'

const lead={businessName:'Test Workshop',phone:'+359 888 123 456',email:'TEST@EXAMPLE.COM',category:'auto',locale:'bg',company:''}
const request=(body=lead,headers={})=>new Request('https://www.gorez.co/api/public/partner-leads',{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)})
test('existing internal price and trial retain their numeric source and localized labels',()=>{
  assert.equal(MONTHLY_PRICE_EUR,19.99);assert.equal(TRIAL_DAYS,30)
  assert.equal(PRICE_LABEL.bg,'19,99 €');assert.equal(PRICE_LABEL.en,'€19.99')
})
test('public subscription copy omits the amount but keeps the trial, direct discussion and explicit paid consent in both languages',async()=>{
  assert.equal(PRICING_COPY.bg.summary,'30 дни безплатно. Абонаментните условия уточняваме лично. Без данни за плащане и без автоматично таксуване.')
  assert.equal(PRICING_COPY.en.summary,'30 days free. We discuss subscription terms with you directly. No payment details required. No automatic charges.')
  assert.equal(PRICING_COPY.bg.trial,'30 дни безплатно');assert.equal(PRICING_COPY.en.trial,'30 days free')
  assert.match(PRICING_COPY.bg.afterTrial,/Платено продължаване.*изрично съгласие.*без автоматично таксуване/)
  assert.match(PRICING_COPY.en.afterTrial,/Paid continuation requires your explicit consent.*no automatic charges/)
  assert.doesNotMatch(JSON.stringify(PRICING_COPY),/19[.,]99|€|free forever|безплатно завинаги/i)
  for(const file of ['components/business-onboarding.js','components/business-landing.js','app/share-image/route.js']){
    const source=await readFile(new URL(`../${file}`,import.meta.url),'utf8')
    assert.match(source,/PRICING_COPY/);assert.doesNotMatch(source,/PRICE_LABEL|MONTHLY_PRICE_EUR|\.monthly\b|19[.,]99/)
  }
  const landing=await readFile(new URL('../components/business-landing.js',import.meta.url),'utf8')
  assert.match(landing,/PRICING_COPY\[locale\]\.contact/)
  const home=await readFile(new URL('../components/home-page.js',import.meta.url),'utf8')
  assert.doesNotMatch(home,/PRICING_COPY|PRICE_LABEL|MONTHLY_PRICE_EUR|19[.,]99/)
})
test('public page, Open Graph and Twitter metadata never quote the subscription amount',()=>{
  for(const locale of ['bg','en'])for(const path of ['/','/for-businesses']){
    const metadata=pageMetadata(path,locale)
    assert.doesNotMatch(JSON.stringify(metadata),/19[.,]99|€|free forever|безплатно завинаги/i)
    if(path==='/for-businesses'){
      assert.match(metadata.description,locale==='bg'?/условия уточняваме лично/:/subscription terms with you directly/)
      assert.equal(metadata.openGraph.description,metadata.description);assert.equal(metadata.twitter.description,metadata.description)
    }
  }
})
test('unconfigured company identity and DPA never fabricate legal information',()=>{
  assert.deepEqual(companyIdentity({}),{company:null,dpaUrl:null})
  assert.equal(companyIdentity({COMPANY_NAME:'Not enough'}).company,null)
  assert.equal(companyIdentity({DPA_URL:'javascript:alert(1)'}).dpaUrl,null)
  assert.deepEqual(companyIdentity({COMPANY_NAME:'Real name',COMPANY_EIK:'123',COMPANY_ADDRESS:'Real address'}).company,{name:'Real name',eik:'123',address:'Real address'})
})
test('directory handles real results, empty, malformed, error and timeout without indefinite loading',async()=>{
  for(const rows of [[],[{id:'example',slug:'example',name:'Example',industry:'auto',services:[]}]])assert.deepEqual(await fetchDirectory({fetcher:async()=>Response.json({businesses:rows})}),rows)
  for(const fetcher of [async()=>new Response('x',{status:503}),async()=>Response.json({wrong:[]}),async()=>Response.json({businesses:[null]}),async()=>Response.json({businesses:[{name:'Malformed'}]}),async()=>new Response('not-json'),()=>new Promise(()=>{})])await assert.rejects(fetchDirectory({fetcher,timeoutMs:10}))
  assert.deepEqual(directoryCategories([{industry:'beauty'},{industry:'beauty'},{industry:'auto'}]),['beauty','auto'])
})
test('short application requires four fields and validates optional values, phones, email and honeypot',()=>{
  const parsed=leadSubmissionSchema.parse(lead)
  assert.equal(parsed.email,'test@example.com');assert.equal(parsed.contactName,'');assert.equal(parsed.city,'')
  const row=leadDatabaseRecord(parsed,'hash');assert.equal(row.contact_name,null);assert.equal(row.city,null)
  for(const patch of [{phone:'letters'},{phone:'123'},{phone:'1'.repeat(16)},{email:'invalid'},{company:'spam'},{category:'invalid'},{contactName:'x'},{websiteUrl:'javascript:alert(1)'},{websiteUrl:'https://user:password@example.com'},{owner_id:'forged'}])assert.equal(leadSubmissionSchema.safeParse({...lead,...patch}).success,false)
})
test('application API persists only valid leads, deduplicates and never falsely promises mail or activation',async()=>{
  for(const duplicate of [false,true]){
    const saved=[],sent=[]
    const handler=createPartnerSubmissionHandler({allowAttempt:async()=>true,save:async input=>{saved.push(input);return {duplicate}},notify:async input=>{sent.push(input);throw new Error('Offline mail failure')}})
    const response=await handler(request());assert.equal(response.status,duplicate?200:201);assert.deepEqual(await response.json(),{ok:true});assert.equal(saved.length,1);assert.equal(sent.length,duplicate?0:1)
    assert.match(response.headers.get('cache-control'),/no-store/)
  }
  for(const [body,headers,allowed,status] of [['{',{},true,422],[{...lead,company:'bot'}, {},true,422],[lead,{origin:'https://evil.example'},true,403],[lead,{},false,429]]){
    const handler=createPartnerSubmissionHandler({allowAttempt:async()=>allowed,save:async()=>{assert.fail('must not write')},notify:async()=>assert.fail('must not send')})
    assert.equal((await handler(request(body,headers))).status,status)
  }
  const failed=createPartnerSubmissionHandler({allowAttempt:async()=>true,save:async()=>{throw Error('private database detail')},notify:async()=>{}})
  const response=await failed(request());assert.equal(response.status,503);assert.doesNotMatch(JSON.stringify(await response.json()),/private database/)
})
test('SEO has localized canonicals/hreflang and never invents profile ratings, contacts or hours',()=>{
  const en=pageMetadata('/for-businesses','en');assert.match(en.alternates.canonical,/lang=en$/);assert.match(en.alternates.languages['bg-BG'],/lang=bg$/);assert.ok(en.alternates.languages['x-default'])
  assert.notEqual(pageMetadata('/','bg').title.absolute,en.title.absolute)
  assert.equal(en.openGraph.images[0].width,1200);assert.equal(en.openGraph.images[0].height,630)
  for(const patch of [{active:false,platform_status:'enabled'},{active:true,platform_status:'pending'},{active:true,platform_status:'archived'},{active:true,platform_status:'suspended'}])assert.equal(businessStructuredData({...patch,name:'Private'}),null)
  const data=businessStructuredData({active:true,platform_status:'enabled',name:'Real Profile',slug:'real-profile',industry:'auto'})
  assert.equal(data['@type'],'AutomotiveBusiness');for(const field of ['aggregateRating','review','openingHours','address','telephone'])assert.equal(field in data,false)
  assert.doesNotMatch(safeJsonLd({name:'</script><script>bad'}),/<script|<\/script/)
  assert.ok(languageAlternates('/').languages.en)
})
test('product events reject PII, arbitrary URLs, absent consent, cross-site writes and unknown names',async()=>{
  const event={event:'booking_completed',page:'book',locale:'en',flowKey:'00000000-0000-4000-8000-000000000001',consent:true}
  for(const patch of [{email:'person@example.com'},{page:'/booking/private-token'},{consent:false},{event:'unknown'},{customerName:'Person'}])assert.equal(productEventSchema.safeParse({...event,...patch}).success,false)
  const writes=[],handler=createProductEventHandler({enabled:()=>true,allowAttempt:async()=>true,write:async value=>writes.push(value)})
  assert.equal((await handler(request(event))).status,204);assert.equal(writes.length,1)
  assert.equal((await handler(request(event,{origin:'https://evil.example'}))).status,403)
  assert.equal((await handler(request('{'))).status,422)
  const disabled=createProductEventHandler({enabled:()=>false,allowAttempt:async()=>assert.fail(),write:async()=>assert.fail()})
  assert.equal((await disabled(request(event))).status,204)
})
test('login extraction preserves recovery links and legacy login bookmarks, keeps credentials out of marketing home',async()=>{
  const home=await readFile(new URL('../components/home-page.js',import.meta.url),'utf8'),login=await readFile(new URL('../components/business-login.js',import.meta.url),'utf8')
  assert.doesNotMatch(home,/signInWithPassword|type="password"/);assert.match(home,/url\.hash === '#business'/);assert.match(home,/router\.replace\(`\/login/)
  assert.match(login,/signInWithPassword/);assert.match(login,/forgot-password\?lang=/);assert.match(login,/api\/admin\/access/)
  const booking=await readFile(new URL('../components/public-booking-page.js',import.meta.url),'utf8');assert.match(booking,/<input required type="email"/)
  const privateRoutes=await readFile(new URL('../next.config.mjs',import.meta.url),'utf8');assert.match(privateRoutes,/\/dashboard\/:path\*/);assert.match(privateRoutes,/noindex, nofollow/)
})
