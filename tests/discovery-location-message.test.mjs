import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { DISCOVERY_COPY, discoveryLocationMessage } from '../lib/discovery/copy.mjs'
import * as locations from '../lib/business-location.mjs'
import * as categories from '../lib/discovery/categories.mjs'
import * as intent from '../lib/discovery/intent.mjs'
import * as defaults from '../lib/discovery/defaults.mjs'
import * as searchUi from '../lib/discovery/search-ui.mjs'
import * as home from '../lib/discovery/home.mjs'
import * as labs from '../lib/discovery/laboratories.mjs'
import * as pagination from '../lib/discovery/catalogue-pagination.mjs'

for(const locale of ['bg','en'])test(`${locale}: denied and manually disabled location have exactly one requested message, while technical errors remain specific`,()=>{
 const copy=DISCOVERY_COPY[locale]
 assert.equal(discoveryLocationMessage('LOCATION_DENIED',{},locale),copy.locationDenied)
 assert.equal(discoveryLocationMessage('LOCATION_DENIED',{disabled:true},locale),copy.locationDenied)
 assert.equal(discoveryLocationMessage('',{disabled:true},locale),copy.locationDenied)
 assert.equal(discoveryLocationMessage('',{disabled:false},locale),'')
 for(const [code,key] of [['LOCATION_TIMEOUT','locationTimeout'],['LOCATION_OUTSIDE','locationOutside'],['LOCATION_UNAVAILABLE','locationUnavailable'],['LOCATION_UNSUPPORTED','locationUnavailable'],['LOCATION_INSECURE','locationUnavailable']]){
  assert.equal(discoveryLocationMessage(code,{disabled:true},locale),copy[key])
  assert.notEqual(discoveryLocationMessage(code,{disabled:true},locale),copy.locationDenied)
 }
})

const require=createRequire(import.meta.url),{loadBindings,transform}=require('next/dist/build/swc')
await loadBindings()
const filename='components/discovery-search.js'
const {code}=await transform(await readFile(new URL(`../${filename}`,import.meta.url),'utf8'),{filename,jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}})
function elements(node,predicate,result=[]){
 if(Array.isArray(node))node.forEach(child=>elements(child,predicate,result))
 else if(React.isValidElement(node)){if(predicate(node))result.push(node);elements(node.props.children,predicate,result)}
 return result
}
function fixture(locale){
 const states=[],refs=[],drafts=[],navigations=[]
 let stateIndex=0,refIndex=0,failure='LOCATION_DENIED',providerCalls=0
 const react={...React,useState(initial){const at=stateIndex++;if(!(at in states))states[at]=typeof initial==='function'?initial():initial;return[states[at],value=>{states[at]=typeof value==='function'?value(states[at]):value}]},useRef(initial){const at=refIndex++;return refs[at]??(refs[at]={current:initial})},useMemo:fn=>fn(),useEffect(){},useId:()=> 'offline-location-test'}
 const imports={react,'next/link':()=>null,'next/navigation':{useRouter:()=>({push:url=>navigations.push(url)})},'../lib/business-location.mjs':locations,'../lib/discovery/categories.mjs':categories,'../lib/discovery/intent.mjs':intent,'../lib/discovery/copy.mjs':{DISCOVERY_COPY,discoveryLocationMessage},'../lib/discovery/defaults.mjs':defaults,'../lib/discovery/draft.mjs':{peekDiscoveryDraft:()=>null,clearDiscoveryDraft(){},setDiscoveryDraft:value=>drafts.push(value)},'../lib/discovery/search-ui.mjs':searchUi,'../lib/discovery/results-navigation.mjs':{focusDiscoveryResults(){}},'../lib/discovery/home.mjs':home,'../lib/discovery/laboratories.mjs':labs,'../lib/discovery/catalogue-pagination.mjs':pagination}
 const mod={exports:{}}
 new Function('require','module','exports','window','navigator',code)(name=>{
  if(name in imports)return imports[name]
  if(name.startsWith('./'))return new Proxy({},{get:()=>function Stub(){return null}})
  return require(name)
 },mod,mod.exports,{isSecureContext:true},{geolocation:{}})
 const f={tree:null,drafts,navigations,
  render(){stateIndex=0;refIndex=0;f.tree=mod.exports.DiscoverySearch({locale,home:true,compact:true,locationProvider:async()=>{providerCalls++;throw Error(failure)}})},
  statuses(){return elements(f.tree,node=>node.props.role==='status').map(node=>node.props.children).filter(Boolean)},
  async toggle(){const button=elements(f.tree,node=>node.type==='button'&&node.props.className?.includes('home-inline-location'))[0];assert.ok(button);await button.props.onClick();f.render()},
  failure(value){failure=value},providerCalls:()=>providerCalls,
 }
 f.render();return f
}

// Actual SWC-compiled component handlers, not a duplicate rendering algorithm.
// Hooks and child boundaries are local; compact navigation is captured so no
// location prompt, browser coordinates, HTTP request or search is performed.
for(const locale of ['bg','en'])test(`${locale}: actual OFF and DENIED UI contain only the requested paragraph, not a second hidden OFF/city summary`,async()=>{
 const f=fixture(locale),copy=DISCOVERY_COPY[locale]
 assert.deepEqual(f.statuses(),[])
 await f.toggle() // Deliberately turn the initially enabled control OFF.
 assert.equal(f.providerCalls(),0)
 assert.deepEqual(f.statuses(),[copy.locationDenied])
 assert.equal(f.drafts.at(-1).request.coordinates,undefined,'manual OFF clears coordinates and keeps city-based search')
 assert.equal(f.drafts.at(-1).request.cityCode,'68134')
 await f.toggle() // Retry permission; the controlled provider denies it.
 assert.equal(f.providerCalls(),1)
 assert.deepEqual(f.statuses(),[copy.locationDenied])
 assert.equal(f.drafts.at(-1).request.coordinates,undefined,'denied permission cannot leak a previous point')
 assert.equal(f.drafts.at(-1).request.cityCode,'68134')
 const rendered=f.statuses().join(' ')
 assert.equal(rendered.includes(home.HOME_DISCOVERY_COPY[locale].locationDisabled),false)
 f.failure('LOCATION_TIMEOUT');await f.toggle()
 assert.deepEqual(f.statuses(),[copy.locationTimeout],'technical failure is not hidden behind generic permission advice')
 f.failure('LOCATION_UNAVAILABLE');await f.toggle()
 assert.deepEqual(f.statuses(),[copy.locationUnavailable])
})
