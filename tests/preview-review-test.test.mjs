import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { buildStagingBootstrap, STAGING_PROJECT_REF } from '../scripts/prepare-staging.mjs'
import { REVIEW_TEST as fixture, previewReviewTestEnabled, previewReviewPayloadAllowed, createPreviewReviewTestHandler } from '../lib/preview-review-test.mjs'

const now = Date.parse('2026-10-30T12:00:00Z')
const secret = 'OFFLINE-TEST-SECRET-NOT-A-REAL-CREDENTIAL-20261030'
const env = { VERCEL_ENV:'preview', VERCEL_GIT_COMMIT_REF:fixture.branch, PREVIEW_REVIEW_TEST_ENABLED:'true',
  NEXT_PUBLIC_SUPABASE_URL:`https://${fixture.project}.supabase.co`, PREVIEW_REVIEW_TEST_SECRET:secret,
  RESEND_API_KEY:'OFFLINE_PROVIDER_KEY', EMAIL_NOTIFICATIONS_ENABLED:'false', EMAIL_REMINDERS_ENABLED:'false' }
const token = '74000000-0000-4000-8000-000000000001'
function harness(options={}) {
  const row = { id:'74000000-0000-4000-8000-000000000002',appointment_id:fixture.appointment,business_id:fixture.business,kind:'review_request',recipient:fixture.recipient,status:'pending',locale:'bg',appointment_revision:2,scheduled_for:new Date(now).toISOString(),created_at:new Date(now).toISOString(),attempts:1,claim_token:'OFFLINE_CLAIM',...options.row }
  const appointment = { id:fixture.appointment,business_id:fixture.business,status:'done',starts_at:new Date(now-3*3600000).toISOString(),ends_at:new Date(now-2*3600000).toISOString(),notification_revision:2,email_notifications_requested:true,cancellation_token:'PRIVATE_BOOKING_LINK',
    business:{ name:fixture.name,slug:fixture.slug,active:true,platform_status:'enabled',email_notifications_enabled:true,review_requests_enabled:true,timezone:'Europe/Sofia' },
    customer:{ email:fixture.recipient,name:'[TEST] QA' },service:{name:'[TEST] Тестова услуга'},staff:{name:'[TEST] Specialist'},
    review_invitation:{token,appointment_revision:2,available_at:new Date(now).toISOString(),expires_at:new Date(now+86400000).toISOString()},...options.appointment }
  let current = {...row}, claimed = false, inspections = 0
  const sent = [], finishes = []
  const handler = createPreviewReviewTestHandler({env:{...env,...options.env},now:()=>now,
    inspect:async()=>{ inspections++;return {appointment,rows:options.rows||[current]} },allowAttempt:async()=>options.allowed!==false,
    store:{
      claim:async(id,reminders)=>{assert.equal(id,fixture.appointment);assert.equal(reminders,false);if(claimed||current.status==='sent')return null;claimed=true;return {...current,...(options.payload?{payload:options.payload}:{})}},
      appointment:async()=>appointment,prepare:async()=>true,current:async()=>true,
      finish:async(_row,patch)=>{finishes.push(patch);current={...current,...patch}},
    },
    fetcher:async(url,request)=>{sent.push({url,request});return options.response||Response.json({id:'OFFLINE_ACCEPTED'})},
  })
  const request = (overrides={}) => new Request(`${fixture.origin}/api/operator/preview-review-test`,{method:'POST',headers:{origin:fixture.origin,'content-type':'application/x-www-form-urlencoded',...overrides.headers},body:overrides.body??new URLSearchParams({secret}).toString()})
  return {handler,request,sent,finishes,inspections:()=>inspections}
}

test('review mail operator fixture fails closed outside exact staging Preview and branch',async()=>{
  assert.equal(previewReviewTestEnabled(env),true)
  for(const changed of [{VERCEL_ENV:'production'},{VERCEL_ENV:'development'},{VERCEL_GIT_COMMIT_REF:'main'},{PREVIEW_REVIEW_TEST_ENABLED:'false'},{NEXT_PUBLIC_SUPABASE_URL:'https://ilpdtvbymxqgimrboyvh.supabase.co'}]){
    const h=harness({env:changed});assert.equal((await h.handler(h.request())).status,404);assert.equal(h.inspections(),0);assert.equal(h.sent.length,0)
  }
})
test('operator requires exact origin, bounded strict form and independent test secret',async()=>{
  for(const [override,status] of [[{headers:{origin:'https://example.com'}},403],[{headers:{'sec-fetch-site':'cross-site'}},403],[{headers:{'content-type':'application/json'}},422],[{body:'secret=wrong'},401],[{body:new URLSearchParams({secret,recipient:'other@example.com'}).toString()},422],[{body:'secret='+secret+'&secret='+secret},422],[{body:'x'.repeat(2049)},422]]){
    const h=harness();assert.equal((await h.handler(h.request(override))).status,status);assert.equal(h.sent.length,0);assert.equal(h.inspections(),0)
  }
  const short=harness({env:{PREVIEW_REVIEW_TEST_SECRET:'short'}});assert.equal((await short.handler(short.request())).status,401)
})
test('missing sender and exhausted test request quota cannot send',async()=>{
  for(const [options,status] of [[{env:{RESEND_API_KEY:''}},503],[{allowed:false},429]]){const h=harness(options);assert.equal((await h.handler(h.request())).status,status);assert.equal(h.sent.length,0)}
})
test('wrong visit, tenant, recipient, kind, test label or extra queued message fails before send',async()=>{
  for(const options of [{row:{recipient:'other@example.com'}},{row:{kind:'booking_confirmation'}},{row:{business_id:fixture.owner}},{appointment:{status:'confirmed'}},{appointment:{business:{name:'Real business',slug:fixture.slug}}},{appointment:{customer:{email:'other@example.com'}}},{rows:[]},{rows:[{},{}]}]){
    const h=harness(options);assert.equal((await h.handler(h.request())).status,409);assert.equal(h.sent.length,0)
  }
})
test('actual worker sends exactly one real review template to approved recipient and uses Preview review link',async()=>{
  const h=harness(),response=await h.handler(h.request()),result=await response.json()
  assert.equal(response.status,200);assert.equal(result.accepted,1);assert.equal(h.sent.length,1)
  const payload=JSON.parse(h.sent[0].request.body)
  assert.deepEqual(payload.to,[fixture.recipient]);assert.equal(payload.from,`GoRez <${fixture.recipient}>`)
  assert.match(payload.subject,/\[TEST\]/);assert.ok(payload.text.includes(`${fixture.origin}/review/${token}?lang=bg`))
  assert.match(payload.html,/Остави оценка/);assert.equal(h.sent[0].request.headers['Idempotency-Key'],'gorez/74000000-0000-4000-8000-000000000002')
  assert.equal(h.finishes[0].status,'sent');assert.equal(env.EMAIL_NOTIFICATIONS_ENABLED,'false')
  assert.doesNotMatch(JSON.stringify(result),new RegExp(token+'|OFFLINE_PROVIDER_KEY|PRIVATE_BOOKING_LINK'))
  assert.match(response.headers.get('cache-control'),/no-store/)
  const again=await (await h.handler(h.request())).json();assert.equal(again.alreadyAccepted,true);assert.equal(h.sent.length,1)
})
test('stale or already-used invitation is skipped by the existing current-state validator',async()=>{
  const h=harness({appointment:{review_invitation:{token,used_at:new Date(now).toISOString()}}})
  const result=await (await h.handler(h.request())).json();assert.equal(result.skipped,1);assert.equal(h.sent.length,0)
})
test('even a frozen payload cannot add recipients or use Production links',async()=>{
  const good={from:`GoRez <${fixture.recipient}>`,to:[fixture.recipient],subject:`Review ${fixture.name}`,text:`${fixture.origin}/review/${token}`}
  assert.equal(previewReviewPayloadAllowed(good),true)
  for(const payload of [{...good,cc:['other@example.com']},{...good,bcc:['other@example.com']},{...good,to:[fixture.recipient,'other@example.com']},{...good,reply_to:'other@example.com'},{...good,attachments:[{}]},{...good,text:`https://www.gorez.co/review/${token}`}]){
    const h=harness({payload});assert.equal(previewReviewPayloadAllowed(payload),false);assert.equal((await h.handler(h.request())).status,502);assert.equal(h.sent.length,0)
  }
})
test('provider failure is reported as unconfirmed, never as inbox delivery',async()=>{
  const h=harness({response:Response.json({error:'offline'}, {status:500})}),res=await h.handler(h.request())
  assert.equal(res.status,502);const result=await res.json();assert.equal(result.failed,1);assert.equal(result.accepted,0)
})
test('real isolated fixture SQL queues one review through completion and refuses any populated database or rerun',async()=>{
  const db=new PGlite({extensions:{btree_gist}})
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;`)
    await db.exec((await buildStagingBootstrap(STAGING_PROJECT_REF)).sql)
    const sql=await readFile(new URL('../supabase/operations/seed-preview-review-test.sql',import.meta.url),'utf8')
    await db.exec("insert into auth.users(id,email) values(gen_random_uuid(),'existing@fixture.invalid')")
    await assert.rejects(db.exec(sql),/REVIEW_TEST_REQUIRES_EMPTY_ISOLATED_STAGING/);await db.exec('rollback')
    assert.equal((await db.query('select count(*)::int n from businesses')).rows[0].n,0)
    await db.exec('delete from auth.users')
    const reply=await db.exec(sql);assert.deepEqual(reply.at(-1).rows[0],{fixture:'isolated-review-test-v1',completed_test_visits:1,pending_test_review_messages:1,unused_test_invitations:1})
    assert.deepEqual((await db.query('select kind,recipient,status from notification_outbox')).rows,[{kind:'review_request',recipient:fixture.recipient,status:'pending'}])
    assert.equal((await db.query("select banned_until='infinity'::timestamptz as banned from auth.users")).rows[0].banned,true)
    await assert.rejects(db.exec(sql),/REVIEW_TEST_REQUIRES_EMPTY_ISOLATED_STAGING/);await db.exec('rollback')
    assert.equal((await db.query('select count(*)::int n from review_invitations')).rows[0].n,1)
  }finally{await db.close()}
})
