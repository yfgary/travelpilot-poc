-- Step 11: only V2 checklist state and its dedicated private trigger change.
-- Historical foundation baseline and all V1 objects remain untouched.
alter table public.v2_checklist_state
  add column client_updated_at timestamptz not null default now();

create function private.v2_checklist_accept_client_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' then
    -- C collation makes device ordering deterministic, independent of locale.
    -- Equal tuples are idempotent; a retry must not bump server updated_at.
    if (NEW.client_updated_at, coalesce(NEW.device_id, '') collate "C")
       <= (OLD.client_updated_at, coalesce(OLD.device_id, '') collate "C") then
      return null;
    end if;
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;
revoke all on function private.v2_checklist_accept_client_change()
  from public, anon, authenticated, service_role;

-- Replace only this table's timestamp trigger; other V2 triggers keep using
-- private.v2_set_updated_at(). INSERT also enforces server-owned updated_at.
drop trigger v2_checklist_state_set_updated_at on public.v2_checklist_state;
create trigger v2_checklist_state_accept_client_change
before insert or update on public.v2_checklist_state
for each row execute function private.v2_checklist_accept_client_change();
