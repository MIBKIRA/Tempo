-- Migration: Set explicit search_path on check_user_age_13 SECURITY DEFINER function
-- Description:
-- Adds `set search_path = ''` to prevent search_path hijacking on SECURITY DEFINER functions,
-- addressing Supabase database linter warning (Function Search Path Mutable).

create or replace function public.check_user_age_13()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_dob date;
  calculated_age int;
begin
  if new.date_of_birth is not null and new.date_of_birth != '' then
    begin
      user_dob := new.date_of_birth::date;
      calculated_age := extract(year from pg_catalog.age(current_date, user_dob));
      
      if calculated_age < 13 then
        raise exception 'Users must be at least 13 years old to create an account'
          using errcode = '23514'; -- check_violation
      end if;
    exception
      when SQLSTATE '23514' then
        raise;
      when others then
        raise exception 'Invalid date of birth format: %', new.date_of_birth
          using errcode = '22007'; -- invalid_datetime_format
    end;
  end if;
  return new;
end;
$$;
