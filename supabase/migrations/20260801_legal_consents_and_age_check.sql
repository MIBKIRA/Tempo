-- Migration: user_consents table and server-side age enforcement
-- Description:
-- 1. Creates user_consents table to log user policy acceptances with RLS.
-- 2. Adds trigger/function on profiles table enforcing minimum age of 13.

-- ==========================================
-- 1. USER_CONSENTS TABLE & RLS SECURITY
-- ==========================================

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  policy_type text not null check (policy_type in ('terms_of_service', 'privacy_policy')),
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  user_agent text
);

-- Index for fast version lookup per user and policy
create index if not exists idx_user_consents_user_policy 
  on public.user_consents (user_id, policy_type, accepted_at desc);

-- Enable Row Level Security (RLS)
alter table public.user_consents enable row level security;

-- Drop existing policies if any to prevent duplicate policy errors
drop policy if exists "Users can view own consents" on public.user_consents;
drop policy if exists "Users can insert own consents" on public.user_consents;

-- RLS Policies: Users can ONLY select and insert their own consent records.
-- No UPDATE or DELETE policies exist for clients.
create policy "Users can view own consents" 
  on public.user_consents 
  for select 
  using (auth.uid() = user_id);

create policy "Users can insert own consents" 
  on public.user_consents 
  for insert 
  with check (auth.uid() = user_id);

-- Grants
grant select, insert on public.user_consents to authenticated;
grant select, insert on public.user_consents to anon;

-- ==========================================
-- 2. SERVER-SIDE AGE ENFORCEMENT (13+ CHECK)
-- ==========================================

create or replace function public.check_user_age_13()
returns trigger as $$
declare
  user_dob date;
  calculated_age int;
begin
  if new.date_of_birth is not null and new.date_of_birth != '' then
    begin
      user_dob := new.date_of_birth::date;
      calculated_age := extract(year from age(current_date, user_dob));
      
      if calculated_age < 13 then
        raise exception 'Users must be at least 13 years old to create an account'
          using errcode = '23514'; -- check_violation
      end if;
    exception when others then
      -- If date format invalid, re-throw or handle gracefully
      if SQLSTATE = '23514' then
        raise;
      end if;
    end;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to profiles table
drop trigger if exists trigger_enforce_user_age on public.profiles;

create trigger trigger_enforce_user_age
  before insert or update on public.profiles
  for each row
  execute function public.check_user_age_13();

-- Comment for Supabase CLI deployment:
-- To deploy this migration to your Supabase project:
--   supabase db push
-- or run this file in the Supabase SQL Editor.
