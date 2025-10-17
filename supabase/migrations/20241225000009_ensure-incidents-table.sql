-- Ensure incidents table exists with correct structure and REST access
-- This migration fixes the 404 error for /rest/v1/incidents

-- Create table if it doesn't exist with proper structure
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  description text,
  photo_url text,
  guard_name text,
  plate_no text,
  created_at timestamptz default now()
);

-- Ensure all required columns exist
alter table public.incidents
  add column if not exists description text,
  add column if not exists photo_url text,
  add column if not exists guard_name text,
  add column if not exists plate_no text,
  add column if not exists created_at timestamptz default now();

-- Disable Row Level Security to allow public access
alter table public.incidents disable row level security;

-- Grant proper permissions to all Supabase roles
grant select, insert, update, delete on table public.incidents to anon, authenticated;
grant all privileges on table public.incidents to postgres, service_role;

-- Force PostgREST schema refresh
comment on table public.incidents is 'supabase-rest-refresh';

-- Verify table structure
select column_name, data_type, is_nullable 
from information_schema.columns 
where table_name = 'incidents' and table_schema = 'public';
