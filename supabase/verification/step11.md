# Step 11 live migration verification

Verified on 08/10/2026 against the existing Supabase project `rihnuowhkzrpfkvrsxej` (Japan Winter 2027 Sync), after explicit approval of the exact SQL.

## Applied migration

- `supabase/migrations/20261008135932_step11_checklist_client_clock.sql`
- SQL SHA-256: `dd7737b5f7dfd695cc5df3550ced00f37889c05481a910ad0134725819012d55`
- Created using Supabase CLI 2.81.3 `migration new step11_checklist_client_clock`. The original generated timestamp was `20261008113657`; the source filename was aligned to the migration history version recorded by Supabase's successful `apply_migration` call, `20261008135932`. SQL content did not change.
- Source-controlled foundation baseline remains historical and unapplied; it was not rewritten or executed against the live project.
- No other live schema changes, backfill, blanket UPDATE, real-user test writes, or V1 mutations were performed.

## Read-only catalog results

- `public.v2_checklist_state.client_updated_at`: timestamp with time zone, NOT NULL, default `now()`.
- Checklist RLS remains enabled; the same four authenticated ownership policies remain in place (SELECT / INSERT / UPDATE / DELETE, requiring own user and parent trip).
- Browser table grants remain authenticated SELECT / INSERT / UPDATE / DELETE, with no anonymous checklist access. No table privileges were broadened.
- `v2_checklist_state_accept_client_change`: BEFORE INSERT OR UPDATE, replacing only this table's `v2_checklist_state_set_updated_at` trigger.
- `private.v2_checklist_accept_client_change()` is SECURITY INVOKER (`prosecdef = false`), with empty search_path and no anonymous/authenticated direct execution permission.
- Guard compares `(client_updated_at, coalesce(device_id, '') COLLATE "C")`; stale/equal UPDATE returns NULL; accepted INSERT/UPDATE sets server `updated_at = now()`.
- `v2_trips_set_updated_at` and `v2_user_preferences_set_updated_at` remain unchanged, using the existing invoker `private.v2_set_updated_at()` function.
- V2 checklist rows: **0** after verification. No live checklist test data was inserted.

V1 counts matched before and after:

| Table | Before | After |
| --- | ---: | ---: |
| trip_checklist_state | 39 | 39 |
| trip_checklist_shared | 0 | 0 |
| trip_sync_config | 1 | 1 |

## Advisors

Security and performance findings matched the preflight results exactly after removing observation timestamps. **No new V2 security warnings.** Existing findings were left untouched:

- Security: two V1 [RLS-enabled/no-policy informational findings](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy); existing project-wide [leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Performance: four existing V1 [auth RLS initialization-plan warnings](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan); two existing V2 [unused-index informational findings](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Isolated conflict proof

Playwright uses pinned dev-only PGlite 0.5.8 to execute the actual migration against an in-memory PostgreSQL database with mock ownership/RLS. Stale/equal upserts are skipped, newer timestamps and deterministic larger-device ties win, accepted server timestamps cannot be replaced by client input, and another owner/anonymous role cannot write/read checklist state. This engine never connects to live Supabase. Browser Auth/REST tests likewise use interception only and no real passwords.
