import { lookup } from 'node:dns/promises'
import { isIP, BlockList } from 'node:net'
import { safeBookingUrl } from './booking-mode.mjs'
const blocked=new BlockList()
const globalV6=new BlockList(),blockedV6=new BlockList()
globalV6.addSubnet('2000::',3,'ipv6')
// Conservative special-purpose/documentation/transition exclusions. BlockList
// normalizes compressed and fully expanded forms instead of matching text.
for(const [address,prefix] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20]])blockedV6.addSubnet(address,prefix,'ipv6')
for(const [address,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]])blocked.addSubnet(address,prefix,'ipv4')
export function publicDestinationAddress(address) {
 const type=isIP(address)
 if(type===4)return !blocked.check(address,'ipv4')
 return type===6&&globalV6.check(address,'ipv6')&&!blockedV6.check(address,'ipv6')
}
// Only DNS lookup; no HTTP fetch, redirect following or content ingestion.
export async function verifyBookingDestination(value,resolve=lookup) {
 const url=safeBookingUrl(value);if(!url)throw new Error('UNSAFE_DESTINATION')
 let timer
 try {
  const addresses=await Promise.race([resolve(new URL(url).hostname,{all:true,verbatim:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('UNSAFE_DESTINATION')),2000)})])
  if(!addresses.length||addresses.some(row=>!publicDestinationAddress(row.address)))throw new Error('UNSAFE_DESTINATION')
 }catch{throw new Error('UNSAFE_DESTINATION')}finally{clearTimeout(timer)}
 return url
}
