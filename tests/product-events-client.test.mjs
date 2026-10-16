import test from 'node:test'
import assert from 'node:assert/strict'

test('new measurement is consent-only, PII-free, deduplicated and revocable',async()=>{
  const prior=process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED,originalFetch=globalThis.fetch,originalStorage=globalThis.localStorage
  const stored=new Map(),sent=[]
  process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED='true'
  globalThis.localStorage={getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)}
  globalThis.fetch=async (...args)=>{sent.push(args);return new Response(null,{status:204})}
  try{
    const client=await import('../lib/product-events-client.js?consent-test')
    client.trackProductEvent('form_start','for-businesses','bg');assert.equal(sent.length,0)
    client.setProductMeasurementConsent(true)
    client.trackProductEvent('form_start','for-businesses','bg');client.trackProductEvent('form_start','for-businesses','bg')
    client.trackProductEvent('form_submit','for-businesses','bg')
    assert.equal(sent.length,2)
    const first=JSON.parse(sent[0][1].body),second=JSON.parse(sent[1][1].body)
    assert.equal(first.flowKey,second.flowKey)
    assert.deepEqual(Object.keys(first).sort(),['event','page','locale','flowKey','consent'].sort())
    assert.equal(stored.size,1);assert.equal([...stored.values()][0],'yes')
    client.trackProductEvent('unknown','for-businesses','bg');assert.equal(sent.length,2)
    client.setProductMeasurementConsent(false)
    client.trackProductEvent('business_signup_success','for-businesses','bg');assert.equal(sent.length,2)
    process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED='false'
    const disabled=await import('../lib/product-events-client.js?disabled-test')
    disabled.setProductMeasurementConsent(true);disabled.trackProductEvent('form_start','home','en');assert.equal(sent.length,2)
  }finally{globalThis.fetch=originalFetch;if(originalStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originalStorage;if(prior===undefined)delete process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED;else process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=prior}
})
