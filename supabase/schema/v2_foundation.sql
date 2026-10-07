-- SOURCE-CONTROL BASELINE — reference only, not a migration.
-- The live Step 5 schema already exists in Japan Winter 2027 Sync.
-- Do not auto-apply this file to the current project.
-- Future schema changes must use proper migrations.
-- Reconstructed from read-only catalog inspection during Step 6; no DDL was run.
-- Contains schema metadata only, no credentials, rows or V1 DDL.

create table public.v2_trips (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  slug text not null,
  title text not null,
  destination_label text,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint v2_trips_date_order CHECK ((start_date <= end_date)),
  constraint v2_trips_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  constraint v2_trips_owner_slug_key UNIQUE (owner_id, slug),
  constraint v2_trips_pkey PRIMARY KEY (id),
  constraint v2_trips_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text))
);
alter table public.v2_trips enable row level security;

create table public.v2_trip_versions (
  id uuid default gen_random_uuid() not null,
  trip_id uuid not null,
  data_version text not null,
  schema_version integer not null,
  payload jsonb not null,
  checksum text,
  status text default 'draft'::text not null,
  is_current boolean default false not null,
  created_at timestamp with time zone default now() not null,
  published_at timestamp with time zone,
  notes text,
  constraint v2_trip_versions_current_requires_published CHECK (((NOT is_current) OR (status = 'published'::text))),
  constraint v2_trip_versions_payload_check CHECK ((jsonb_typeof(payload) = 'object'::text)),
  constraint v2_trip_versions_pkey PRIMARY KEY (id),
  constraint v2_trip_versions_published_at CHECK (((status <> 'published'::text) OR (published_at IS NOT NULL))),
  constraint v2_trip_versions_schema_version_check CHECK ((schema_version > 0)),
  constraint v2_trip_versions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
  constraint v2_trip_versions_trip_data_version_key UNIQUE (trip_id, data_version),
  constraint v2_trip_versions_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES v2_trips(id) ON DELETE CASCADE
);
alter table public.v2_trip_versions enable row level security;

create table public.v2_checklist_state (
  user_id uuid not null,
  trip_id uuid not null,
  checklist_item_id text not null,
  checked boolean default false not null,
  updated_at timestamp with time zone default now() not null,
  device_id text,
  constraint v2_checklist_state_pkey PRIMARY KEY (user_id, trip_id, checklist_item_id),
  constraint v2_checklist_state_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES v2_trips(id) ON DELETE CASCADE,
  constraint v2_checklist_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.v2_checklist_state enable row level security;

create table public.v2_user_preferences (
  user_id uuid not null,
  font_size text default 'medium'::text not null,
  language text default 'zh-HK'::text not null,
  auto_update boolean default true not null,
  updated_at timestamp with time zone default now() not null,
  constraint v2_user_preferences_font_size_check CHECK ((font_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text]))),
  constraint v2_user_preferences_pkey PRIMARY KEY (user_id),
  constraint v2_user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
alter table public.v2_user_preferences enable row level security;

create table public.v2_app_versions (
  app_version text not null,
  released_at timestamp with time zone default now() not null,
  minimum_schema_version integer,
  notes text,
  published boolean default false not null,
  constraint v2_app_versions_minimum_schema_version_check CHECK (((minimum_schema_version IS NULL) OR (minimum_schema_version > 0))),
  constraint v2_app_versions_pkey PRIMARY KEY (app_version)
);
alter table public.v2_app_versions enable row level security;

CREATE INDEX v2_checklist_state_trip_id_idx ON public.v2_checklist_state USING btree (trip_id);
CREATE UNIQUE INDEX v2_trip_versions_one_current_per_trip ON public.v2_trip_versions USING btree (trip_id) WHERE is_current;
CREATE INDEX v2_trip_versions_trip_id_idx ON public.v2_trip_versions USING btree (trip_id);

-- Ordinary browser roles have only these privileges; content is admin-only.
revoke all on public.v2_trips from public, anon, authenticated;
grant all on public.v2_trips to service_role;
revoke all on public.v2_trip_versions from public, anon, authenticated;
grant all on public.v2_trip_versions to service_role;
revoke all on public.v2_checklist_state from public, anon, authenticated;
grant all on public.v2_checklist_state to service_role;
revoke all on public.v2_user_preferences from public, anon, authenticated;
grant all on public.v2_user_preferences to service_role;
revoke all on public.v2_app_versions from public, anon, authenticated;
grant all on public.v2_app_versions to service_role;
grant select on public.v2_trips to authenticated;
grant select on public.v2_trip_versions to authenticated;
grant insert, select, update, delete on public.v2_checklist_state to authenticated;
grant insert, select, update, delete on public.v2_user_preferences to authenticated;
grant select on public.v2_app_versions to anon;
grant select on public.v2_app_versions to authenticated;

create policy v2_app_versions_select_published on public.v2_app_versions
  as permissive for select to anon, authenticated
  using ((published = true));

create policy v2_checklist_state_delete_own on public.v2_checklist_state
  as permissive for delete to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_checklist_state.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))));

create policy v2_checklist_state_insert_own on public.v2_checklist_state
  as permissive for insert to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_checklist_state.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))));

create policy v2_checklist_state_select_own on public.v2_checklist_state
  as permissive for select to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_checklist_state.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))));

create policy v2_checklist_state_update_own on public.v2_checklist_state
  as permissive for update to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_checklist_state.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_checklist_state.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))));

create policy v2_trip_versions_select_own on public.v2_trip_versions
  as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM v2_trips t
  WHERE ((t.id = v2_trip_versions.trip_id) AND (t.owner_id = ( SELECT auth.uid() AS uid))))));

create policy v2_trips_select_own on public.v2_trips
  as permissive for select to authenticated
  using ((owner_id = ( SELECT auth.uid() AS uid)));

create policy v2_user_preferences_delete_own on public.v2_user_preferences
  as permissive for delete to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

create policy v2_user_preferences_insert_own on public.v2_user_preferences
  as permissive for insert to authenticated
  with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy v2_user_preferences_select_own on public.v2_user_preferences
  as permissive for select to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));

create policy v2_user_preferences_update_own on public.v2_user_preferences
  as permissive for update to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)))
  with check ((user_id = ( SELECT auth.uid() AS uid)));

create schema if not exists private;
CREATE OR REPLACE FUNCTION private.v2_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
revoke all on function private.v2_set_updated_at() from public, anon, authenticated, service_role;
CREATE TRIGGER v2_checklist_state_set_updated_at BEFORE UPDATE ON public.v2_checklist_state FOR EACH ROW EXECUTE FUNCTION private.v2_set_updated_at();
CREATE TRIGGER v2_trips_set_updated_at BEFORE UPDATE ON public.v2_trips FOR EACH ROW EXECUTE FUNCTION private.v2_set_updated_at();
CREATE TRIGGER v2_user_preferences_set_updated_at BEFORE UPDATE ON public.v2_user_preferences FOR EACH ROW EXECUTE FUNCTION private.v2_set_updated_at();

