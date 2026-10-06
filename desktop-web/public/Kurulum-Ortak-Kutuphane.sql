-- NutriPeer shared food library (Supabase SQL Editor)
-- Run once in the Supabase project used by your team.

create table if not exists public.nutripeer_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.nutripeer_shared_foods (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  food_data jsonb not null,
  source text not null default 'NutriPeer topluluk katkısı',
  status text not null default 'pending' check (status in ('pending','approved')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint nutripeer_food_data_has_name check (
    jsonb_typeof(food_data) = 'object'
    and coalesce(length(food_data->>'name'), 0) between 1 and 180
  )
);

create unique index if not exists nutripeer_shared_food_barcode_approved
  on public.nutripeer_shared_foods (barcode)
  where barcode is not null and status = 'approved';

alter table public.nutripeer_shared_foods enable row level security;
alter table public.nutripeer_moderators enable row level security;

revoke all on public.nutripeer_moderators from anon, authenticated;
grant select, insert, update on public.nutripeer_shared_foods to authenticated;
grant select on public.nutripeer_shared_foods to anon;

create or replace function public.nutripeer_is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.nutripeer_moderators
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.nutripeer_is_moderator() from public;
grant execute on function public.nutripeer_is_moderator() to authenticated;

drop policy if exists "approved NutriPeer foods are readable" on public.nutripeer_shared_foods;
create policy "approved NutriPeer foods are readable"
  on public.nutripeer_shared_foods for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "contributors can read own pending foods" on public.nutripeer_shared_foods;
create policy "contributors can read own pending foods"
  on public.nutripeer_shared_foods for select to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists "moderators can read all foods" on public.nutripeer_shared_foods;
create policy "moderators can read all foods"
  on public.nutripeer_shared_foods for select to authenticated
  using (public.nutripeer_is_moderator());

drop policy if exists "signed in users can submit pending foods" on public.nutripeer_shared_foods;
create policy "signed in users can submit pending foods"
  on public.nutripeer_shared_foods for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'pending'
  );

drop policy if exists "moderators can approve shared foods" on public.nutripeer_shared_foods;
create policy "moderators can approve shared foods"
  on public.nutripeer_shared_foods for update to authenticated
  using (public.nutripeer_is_moderator())
  with check (public.nutripeer_is_moderator());

-- Contributors may update only their own pending food, and cannot publish it themselves.
drop policy if exists "contributors can edit own pending foods" on public.nutripeer_shared_foods;
create policy "contributors can edit own pending foods"
  on public.nutripeer_shared_foods for update to authenticated
  using (created_by = (select auth.uid()) and status = 'pending')
  with check (created_by = (select auth.uid()) and status = 'pending');

-- In-app messages sent automatically after moderation decisions.
create table if not exists public.nutripeer_shared_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_food_id uuid,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists nutripeer_shared_notifications_unread
  on public.nutripeer_shared_notifications (user_id, created_at desc)
  where read_at is null;
alter table public.nutripeer_shared_notifications enable row level security;
revoke all on public.nutripeer_shared_notifications from anon;
revoke update on public.nutripeer_shared_notifications from anon, authenticated;
grant select on public.nutripeer_shared_notifications to authenticated;
grant update (read_at) on public.nutripeer_shared_notifications to authenticated;
drop policy if exists "users can read own NutriPeer messages" on public.nutripeer_shared_notifications;
create policy "users can read own NutriPeer messages"
  on public.nutripeer_shared_notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "users can mark own NutriPeer messages read" on public.nutripeer_shared_notifications;
create policy "users can mark own NutriPeer messages read"
  on public.nutripeer_shared_notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.nutripeer_notify_food_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status and new.status = 'approved' then
    insert into public.nutripeer_shared_notifications(user_id, shared_food_id, message)
    values (new.created_by, new.id,
      coalesce(new.food_data->>'name', 'Besin') || ' ortak kütüphanede onaylandı.');
  end if;
  return new;
end;
$$;
drop trigger if exists nutripeer_food_approved_notification on public.nutripeer_shared_foods;
create trigger nutripeer_food_approved_notification
  after update of status on public.nutripeer_shared_foods
  for each row execute function public.nutripeer_notify_food_approved();

-- Approving a resubmitted barcode updates its approved catalogue entry instead of
-- violating the unique approved-barcode index.
create or replace function public.nutripeer_approve_shared_food(p_food_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  pending_row public.nutripeer_shared_foods%rowtype;
  existing_id uuid;
begin
  if not public.nutripeer_is_moderator() then raise exception 'Moderator access required'; end if;
  select * into pending_row from public.nutripeer_shared_foods
    where id = p_food_id and status = 'pending' for update;
  if not found then raise exception 'Pending shared food not found'; end if;
  if pending_row.barcode is not null then
    perform pg_advisory_xact_lock(hashtext(pending_row.barcode));
    select id into existing_id from public.nutripeer_shared_foods
      where barcode = pending_row.barcode and status = 'approved' and id <> pending_row.id
      limit 1 for update;
  end if;
  if existing_id is not null then
    update public.nutripeer_shared_foods
      set food_data = pending_row.food_data, source = pending_row.source, reviewed_at = now()
      where id = existing_id;
    delete from public.nutripeer_shared_foods where id = pending_row.id;
    insert into public.nutripeer_shared_notifications(user_id, shared_food_id, message)
    values (pending_row.created_by, existing_id,
      coalesce(pending_row.food_data->>'name', 'Besin') || ' ortak kütüphanedeki kaydı güncellendi ve onaylandı.');
  else
    update public.nutripeer_shared_foods set status = 'approved', reviewed_at = now()
      where id = pending_row.id;
  end if;
end;
$$;
revoke all on function public.nutripeer_approve_shared_food(uuid) from public, anon;
grant execute on function public.nutripeer_approve_shared_food(uuid) to authenticated;

-- Members request removal; only the moderator can approve the deletion.
create table if not exists public.nutripeer_shared_food_delete_requests (
  id uuid primary key default gen_random_uuid(),
  shared_food_id uuid references public.nutripeer_shared_foods(id) on delete set null,
  food_snapshot jsonb not null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create unique index if not exists nutripeer_one_pending_food_delete_request
  on public.nutripeer_shared_food_delete_requests(shared_food_id)
  where status = 'pending' and shared_food_id is not null;
alter table public.nutripeer_shared_food_delete_requests enable row level security;
grant select, insert on public.nutripeer_shared_food_delete_requests to authenticated;
drop policy if exists "requesters can read own food removal requests" on public.nutripeer_shared_food_delete_requests;
create policy "requesters can read own food removal requests"
  on public.nutripeer_shared_food_delete_requests for select to authenticated
  using (requested_by = (select auth.uid()));
drop policy if exists "moderators can read food removal requests" on public.nutripeer_shared_food_delete_requests;
create policy "moderators can read food removal requests"
  on public.nutripeer_shared_food_delete_requests for select to authenticated
  using (public.nutripeer_is_moderator());
drop policy if exists "members can request shared food removal" on public.nutripeer_shared_food_delete_requests;
create policy "members can request shared food removal"
  on public.nutripeer_shared_food_delete_requests for insert to authenticated
  with check (requested_by = (select auth.uid()) and status = 'pending');

create or replace function public.nutripeer_notify_food_delete_decision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status in ('approved','rejected') then
    insert into public.nutripeer_shared_notifications(user_id, shared_food_id, message)
    values (new.requested_by, new.shared_food_id,
      coalesce(new.food_snapshot->>'name', 'Besin') ||
      case when new.status = 'approved' then ' için silme isteğin onaylandı.'
           else ' için silme isteğin reddedildi.' end);
  end if;
  return new;
end;
$$;
drop trigger if exists nutripeer_food_delete_decision_notification on public.nutripeer_shared_food_delete_requests;
create trigger nutripeer_food_delete_decision_notification
  after update of status on public.nutripeer_shared_food_delete_requests
  for each row execute function public.nutripeer_notify_food_delete_decision();

create or replace function public.nutripeer_review_shared_food_delete(p_request_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare request_row public.nutripeer_shared_food_delete_requests%rowtype;
begin
  if not public.nutripeer_is_moderator() then raise exception 'Moderator access required'; end if;
  select * into request_row from public.nutripeer_shared_food_delete_requests
    where id = p_request_id and status = 'pending' for update;
  if not found then raise exception 'Pending delete request not found'; end if;
  update public.nutripeer_shared_food_delete_requests
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_at = now(), reviewed_by = auth.uid()
    where id = p_request_id;
  if p_approve and request_row.shared_food_id is not null then
    delete from public.nutripeer_shared_foods where id = request_row.shared_food_id;
  end if;
end;
$$;
revoke all on function public.nutripeer_review_shared_food_delete(uuid, boolean) from public, anon;
grant execute on function public.nutripeer_review_shared_food_delete(uuid, boolean) to authenticated;

-- Shared exchanges and recipes, reviewed by the same moderator team.
create table if not exists public.nutripeer_shared_library_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('exchange','recipe')),
  client_key text not null,
  item_data jsonb not null,
  source text not null default 'NutriPeer topluluk katkısı',
  status text not null default 'pending' check (status in ('pending','approved')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint nutripeer_library_item_has_name check (
    jsonb_typeof(item_data) = 'object'
    and coalesce(length(item_data->>'name'), 0) between 1 and 180
  )
);
create index if not exists nutripeer_shared_library_type_status
  on public.nutripeer_shared_library_items (item_type, status, created_at desc);
alter table public.nutripeer_shared_library_items enable row level security;
grant select, insert, update on public.nutripeer_shared_library_items to authenticated;
grant select on public.nutripeer_shared_library_items to anon;
drop policy if exists "approved NutriPeer library items are readable" on public.nutripeer_shared_library_items;
create policy "approved NutriPeer library items are readable"
  on public.nutripeer_shared_library_items for select to anon, authenticated
  using (status = 'approved');
drop policy if exists "contributors can read own pending library items" on public.nutripeer_shared_library_items;
create policy "contributors can read own pending library items"
  on public.nutripeer_shared_library_items for select to authenticated
  using (created_by = (select auth.uid()));
drop policy if exists "moderators can read all library items" on public.nutripeer_shared_library_items;
create policy "moderators can read all library items"
  on public.nutripeer_shared_library_items for select to authenticated
  using (public.nutripeer_is_moderator());
drop policy if exists "members can submit library items" on public.nutripeer_shared_library_items;
create policy "members can submit library items"
  on public.nutripeer_shared_library_items for insert to authenticated
  with check (created_by = (select auth.uid()) and status = 'pending');
drop policy if exists "contributors can edit own pending library items" on public.nutripeer_shared_library_items;
create policy "contributors can edit own pending library items"
  on public.nutripeer_shared_library_items for update to authenticated
  using (created_by = (select auth.uid()) and status = 'pending')
  with check (created_by = (select auth.uid()) and status = 'pending');
drop policy if exists "moderators can moderate library items" on public.nutripeer_shared_library_items;
create policy "moderators can moderate library items"
  on public.nutripeer_shared_library_items for update to authenticated
  using (public.nutripeer_is_moderator())
  with check (public.nutripeer_is_moderator());

create or replace function public.nutripeer_approve_library_item(p_item_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item_row public.nutripeer_shared_library_items%rowtype;
begin
  if not public.nutripeer_is_moderator() then raise exception 'Moderator access required'; end if;
  select * into item_row from public.nutripeer_shared_library_items
    where id = p_item_id and status = 'pending' for update;
  if not found then raise exception 'Pending library item not found'; end if;
  update public.nutripeer_shared_library_items set status = 'approved', reviewed_at = now()
    where id = p_item_id;
  insert into public.nutripeer_shared_notifications(user_id, shared_food_id, message)
  values (item_row.created_by, p_item_id,
    coalesce(item_row.item_data->>'name', 'Kayıt') ||
    case when item_row.item_type = 'exchange' then ' değişimin ortak kütüphanede onaylandı.'
         else ' yemeğin ortak kütüphanede onaylandı.' end);
end;
$$;
revoke all on function public.nutripeer_approve_library_item(uuid) from public, anon;
grant execute on function public.nutripeer_approve_library_item(uuid) to authenticated;

-- To make the first moderator:
-- 1. Create a community account from NutriPeer.
-- 2. Find its UUID under Supabase Dashboard > Authentication > Users.
-- 3. Run this statement after replacing the UUID:
-- insert into public.nutripeer_moderators(user_id)
-- values ('00000000-0000-0000-0000-000000000000');

-- Desktop builds read NUTRIPEER_SUPABASE_URL and
-- NUTRIPEER_SUPABASE_ANON_KEY from the owner's build environment.
-- Legacy browser builds save the public URL/key in the in-app settings panel.
-- Never put a Supabase secret/service-role key in a distributed app.

notify pgrst, 'reload schema';
