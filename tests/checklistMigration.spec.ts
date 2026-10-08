import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { test, expect } from './fixtures'

const name = readdirSync('supabase/migrations').find((file) => file.endsWith('_step11_checklist_client_clock.sql'))!
const migration = readFileSync(`supabase/migrations/${name}`, 'utf8')
const owner = '00000000-0000-4000-8000-000000000001', trip = '00000000-0000-4000-8000-000000000002'
async function database() {
  // Real Postgres engine, entirely in memory. Never connects to live Supabase.
  const db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;`)
  await db.exec(readFileSync('supabase/schema/v2_foundation.sql', 'utf8'))
  await db.query('insert into auth.users values ($1)', [owner])
  await db.query("insert into public.v2_trips(id,owner_id,slug,title,start_date,end_date) values ($1,$2,'sql-proof','Local SQL proof','2030-01-01','2030-01-02')", [trip, owner])
  await db.exec(migration)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner])
  await db.exec('set role authenticated')
  return db
}
async function write(db: PGlite, time: string, device: string, checked: boolean) {
  await db.query(`insert into public.v2_checklist_state(user_id,trip_id,checklist_item_id,checked,client_updated_at,device_id,updated_at)
    values($1,$2,'item-proof',$3,$4,$5,'2099-01-01') on conflict(user_id,trip_id,checklist_item_id)
    do update set checked=excluded.checked,client_updated_at=excluded.client_updated_at,device_id=excluded.device_id,updated_at=excluded.updated_at`, [owner, trip, checked, time, device])
  return (await db.query<{ checked: boolean; device_id: string; client_updated_at: Date; updated_at: Date }>('select * from public.v2_checklist_state')).rows[0]
}
test('migration rejects stale/equal upserts, accepts newer tuples and owns server timestamps atomically', async () => {
  const db = await database()
  try {
    const first = await write(db, '2026-01-01T10:05:00Z', 'B', true)
    expect(first.updated_at.getUTCFullYear()).not.toBe(2099)
    const stale = await write(db, '2026-01-01T10:00:00Z', 'Z', false)
    expect(stale).toEqual(first)
    expect(await write(db, '2026-01-01T10:05:00Z', 'A', false)).toEqual(first)
    expect(await write(db, '2026-01-01T10:05:00Z', 'B', false)).toEqual(first)
    const tieWinner = await write(db, '2026-01-01T10:05:00Z', 'C', false)
    expect(tieWinner.checked).toBe(false); expect(tieWinner.device_id).toBe('C')
    const later = await write(db, '2026-01-01T10:06:00Z', 'A', true)
    expect(later.checked).toBe(true); expect(later.device_id).toBe('A')
    expect(later.updated_at.getUTCFullYear()).not.toBe(2099)
  } finally { await db.close() }
})
test('migration preserves ownership/RLS/grants and other V2 timestamp triggers without definer security', async () => {
  const db = await database()
  try {
    const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid='public.v2_checklist_state'::regclass")
    expect(rls.rows[0].relrowsecurity).toBe(true)
    const policies = await db.query("select policyname from pg_policies where tablename='v2_checklist_state'")
    expect(policies.rows).toHaveLength(4)
    await db.exec('reset role')
    const functions = await db.query<{ prosecdef: boolean; proconfig: string[] }>("select prosecdef,proconfig from pg_proc where oid='private.v2_checklist_accept_client_change()'::regprocedure")
    expect(functions.rows[0]).toMatchObject({ prosecdef: false, proconfig: ['search_path=""'] })
    expect((await db.query("select tgname from pg_trigger where tgname in ('v2_trips_set_updated_at','v2_user_preferences_set_updated_at')")).rows).toHaveLength(2)
    await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',false)"); await db.exec('set role authenticated')
    await expect(write(db, '2026-01-01T10:07:00Z', 'A', true)).rejects.toThrow(/row-level security/)
    await db.exec('set role anon'); await expect(db.query('select * from public.v2_checklist_state')).rejects.toThrow(/permission denied/)
  } finally { await db.close() }
})
test('CLI migration is narrowly scoped and does not rewrite the historical baseline or V1 objects', () => {
  expect(name).toMatch(/^\d{14}_step11_checklist_client_clock\.sql$/)
  expect(migration).toContain('add column client_updated_at timestamptz not null default now()')
  expect(migration).toContain('return null;'); expect(migration).toContain('NEW.updated_at = now();')
  expect(migration).not.toMatch(/security definer|public\.trip_checklist|trip_sync_config|alter table public\.v2_trips|delete from|drop table/i)
  expect(readFileSync('supabase/schema/v2_foundation.sql','utf8')).not.toContain('client_updated_at')
})
