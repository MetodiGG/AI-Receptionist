import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, lstat, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import manifest from './fixtures/pr81-location-only-approval.json' with {type:'json'}
import { pr81LocationAllowsFileChange, pr81LocationAllowsNewFile, pr81LocationPriorSource } from './pr81-location-only-scope.mjs'

const root = fileURLToPath(new URL('../',import.meta.url))
const git = (...args) => execFileSync('git',args,{cwd:root,maxBuffer:16*1024*1024})
const pathUrl = path => new URL('../'+path,import.meta.url)
const runtime = path => !path.startsWith('tests/') && path !== 'node_modules'
const oldMigrations = '90ecc8ea7fd74517f2c956ef93269072039f9995'

test('only pinned address/directions files differ from PR #81; original styles, images, catalogue and booking code do not',async()=>{
  assert.equal(manifest.baseline,'136d99c8fd546f30a42dd0fbbefe1727f3949032')
  const baseline = git('ls-tree','-r','-z',manifest.baseline).toString('utf8').split('\0').filter(Boolean).map(item=>{
    const [meta,path] = item.split('\t'), [mode,type,oid] = meta.split(' ')
    return {mode,type,oid,path}
  }).filter(({path})=>runtime(path))
  const actual = git('ls-files','--cached','--others','--exclude-standard','-z').toString('utf8').split('\0').filter(path=>path && runtime(path))
  assert.deepEqual([...new Set(actual)].sort(),[...baseline.map(x=>x.path),...Object.keys(manifest.added)].sort())
  for (const path of [...Object.keys(manifest.changed),...Object.keys(manifest.added)]) {
    assert.doesNotMatch(path,/^public\/|\.css$|^app\/api\/public\/\[slug\]\/bookings\/|^app\/api\/customer\/|^lib\/public-booking\.js$|^lib\/booking-engine\.mjs$|^lib\/discovery\/catalogue-data\//u)
  }
  for (const path of Object.keys(manifest.changed)) {
    assert.equal(pr81LocationAllowsFileChange(path),true,path)
    const source=await readFile(pathUrl(path))
    assert.throws(()=>pr81LocationPriorSource(path,Buffer.concat([source,Buffer.from('\n')])),/Unreviewed PR #81/u)
  }
  for(const path of Object.keys(manifest.added)) {
    assert.equal(pr81LocationAllowsNewFile(path),true,path)
    const stat=await lstat(pathUrl(path))
    assert.ok(stat.isFile() && !(stat.mode & 0o111),path)
    if(path.startsWith('supabase/migrations/')) {
      assert.deepEqual(await readFile(pathUrl(path)),git('show',oldMigrations+':'+path),'retain the already-deployed migration unchanged')
    }
  }
  for(let offset=0;offset<baseline.length;offset+=32) await Promise.all(baseline.slice(offset,offset+32).map(async item=>{
    const {mode,type,oid,path}=item, stat=await lstat(pathUrl(path))
    const currentMode=stat.isSymbolicLink()?'120000':stat.isFile() ? stat.mode & 0o111 ? '100755':'100644':null
    assert.equal(type,'blob',path)
    assert.equal(currentMode,mode,path)
    const current=stat.isSymbolicLink()?Buffer.from(await readlink(pathUrl(path))):await readFile(pathUrl(path))
    const source=pr81LocationPriorSource(path,current)
    assert.equal(createHash('sha1').update('blob '+source.length+'\0').update(source).digest('hex'),oid,path)
  }))
})
