import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PreviewChecklistManager, INTENT_PREFIX } from '../preview/checklistIntents.ts'
import { compareChanges } from '../src/data/checklistState.ts'

class MemoryStorage {
  values = new Map()
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.get(k) ?? null }
  setItem(k, v) { this.values.set(k, v) }
  removeItem(k) { this.values.delete(k) }
}
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b}); return {promise,resolve,reject} }
const definition = { trip:{id:'generic-trip'}, checklists:[{groups:[{items:[{id:'first'},{id:'second'}]}]}] }
function setup() {
  const storage = new MemoryStorage(), rows = new Map(), commits=[]
  const control = { beforeCommit: async () => {} }
  let sequence=0, serial=Promise.resolve()
  const store={read:async()=>[...rows.values()],commit:async row=>{
    await control.beforeCommit(row)
    const old=rows.get(row.checklistItemId),winner=old&&compareChanges(old,row)>0?old:row
    rows.set(row.checklistItemId,winner);commits.push({...winner});return winner
  }}
  const dependencies={storage,store,exclusive:task=>{const next=serial.then(task);serial=next.catch(()=>{});return next},now:()=>1000,id:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`}
  const manager=()=>{const m=new PreviewChecklistManager(dependencies);m.register(definition,null);return m}
  const intents=()=>[...storage.values].filter(([k])=>k.startsWith(INTENT_PREFIX)).map(([,v])=>JSON.parse(v))
  return {storage,rows,commits,control,manager,intents}
}
test('accepted UI is backed synchronously; failed pending write survives and replays before ready',async()=>{
  const f=setup(),m=f.manager();await m.initialize()
  const started=deferred(),blocked=deferred();f.control.beforeCommit=()=>{started.resolve();return blocked.promise}
  m.mutate(null,'generic-trip','first',true)
  assert.equal(f.intents()[0].checked,true);assert.equal(m.row(null,'generic-trip','first').checked,true)
  await started.promise;assert.equal(m.snapshot().saving,true);assert.equal(m.snapshot().saved,false)
  blocked.reject(new Error('AbortError'));await m.refresh()
  assert.equal(m.snapshot().error,true);assert.equal(f.intents().length,1)
  f.control.beforeCommit=async()=>{}
  const restored=f.manager(),initializing=restored.initialize();assert.equal(restored.snapshot().ready,false)
  await initializing;assert.equal(restored.snapshot().ready,true);assert.equal(restored.row(null,'generic-trip','first').checked,true)
  assert.equal(f.intents().length,0);assert.equal(restored.snapshot().saved,true)
})
test('delayed reset(false) acknowledgement cannot delete or overwrite newer recheck(true)',async()=>{
  const f=setup(),m=f.manager();await m.initialize();m.mutate(null,'generic-trip','first',true);await m.refresh()
  const started=deferred(),blocked=deferred();f.control.beforeCommit=async row=>{if(!row.checked){started.resolve();await blocked.promise}}
  m.mutate(null,'generic-trip','first',false);await started.promise
  m.mutate(null,'generic-trip','first',true);m.mutate(null,'generic-trip','second',true)
  const revisions=f.intents().map(x=>x.revision);assert.equal(new Set(revisions).size,3)
  blocked.resolve();await m.refresh()
  assert.equal(f.rows.get('first').checked,true);assert.equal(f.rows.get('second').checked,true);assert.equal(f.intents().length,0)
  const restored=f.manager();await restored.initialize();assert.equal(restored.row(null,'generic-trip','first').checked,true)
})
test('two managers serialize distinct operation IDs and converge with monotonic same-item revisions',async()=>{
  const f=setup(),a=f.manager(),b=f.manager();await Promise.all([a.initialize(),b.initialize()])
  a.mutate(null,'generic-trip','first',true);b.mutate(null,'generic-trip','first',false);a.mutate(null,'generic-trip','first',true)
  assert.equal(f.intents().length,3)
  await Promise.all([a.refresh(),b.refresh()]);await Promise.all([a.refresh(),b.refresh()])
  assert.equal(a.row(null,'generic-trip','first').checked,true);assert.equal(b.row(null,'generic-trip','first').checked,true)
  assert.equal(f.intents().length,0)
})
test('quota failure rejects optimism; invalid owner/item never records intent',async()=>{
  const f=setup(),m=f.manager();await m.initialize()
  f.storage.setItem=()=>{throw new Error('QuotaExceededError')}
  m.mutate(null,'generic-trip','first',true)
  assert.equal(m.row(null,'generic-trip','first'),undefined);assert.equal(m.snapshot().error,true);assert.equal(m.snapshot().saved,false)
  m.mutate('other-owner','generic-trip','first',true);m.mutate(null,'generic-trip','unknown',true)
  assert.equal(f.intents().length,0)
})
test('malformed and old-format journal fail closed without deleting data or becoming ready',async()=>{
  for(const value of ['{','{}',JSON.stringify({format:0,checked:true})]){
    const f=setup();f.storage.setItem(`${INTENT_PREFIX}v0.invalid`,value)
    const m=f.manager();await m.initialize()
    assert.equal(m.snapshot().ready,false);assert.equal(m.snapshot().error,true);assert.equal(f.storage.getItem(`${INTENT_PREFIX}v0.invalid`),value)
  }
})
test('newer committed IDB state wins over stale pending intent during replay',async()=>{
  const f=setup(),m=f.manager();await m.initialize()
  const started=deferred(),blocked=deferred();f.control.beforeCommit=()=>{started.resolve();return blocked.promise}
  m.mutate(null,'generic-trip','first',false);await started.promise
  const intent=f.intents()[0]
  f.rows.set('first',{scope:'local-demo',ownerId:null,tripId:'generic-trip',checklistItemId:'first',checked:true,clientUpdatedAt:new Date(intent.revision+1).toISOString(),deviceId:'00000000-0000-4000-8000-999999999999',dirty:false})
  blocked.resolve();await m.refresh()
  assert.equal(f.rows.get('first').checked,true);assert.equal(f.intents().length,0);assert.equal(m.row(null,'generic-trip','first').checked,true)
})
test('cleanup failure after IDB commit retains exact intent and recovers idempotently',async()=>{
  const f=setup(),m=f.manager();await m.initialize()
  const remove=f.storage.removeItem.bind(f.storage);f.storage.removeItem=()=>{throw new Error('SecurityError')}
  m.mutate(null,'generic-trip','first',true);await m.refresh()
  const committed=f.rows.get('first');assert.equal(committed.checked,true)
  assert.equal(f.intents().length,1);assert.equal(m.snapshot().error,true);assert.equal(m.snapshot().saved,false)
  f.storage.removeItem=remove;const restored=f.manager();await restored.initialize()
  assert.deepEqual(f.rows.get('first'),committed);assert.equal(f.intents().length,0);assert.equal(restored.snapshot().saved,true)
})
