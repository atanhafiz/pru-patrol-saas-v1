-- Create table if it doesn't exist
create table if not exists public.incidents (
  id bigint generated always as identity primary key,
  guard_name text,
  plate_no text,
  description text,
  photo_url text,
  created_at timestamptz default now()
);

-- Ensure all required columns exist
alter table public.incidents
  add column if not exists guard_name text,
  add column if not exists plate_no text,
  add column if not exists description text,
  add column if not exists photo_url text,
  add column if not exists created_at timestamptz default now();

-- Remove any stray 'value' column if it exists
alter table public.incidents drop column if exists value;

-- Disable RLS for now to allow public insert
alter table public.incidents disable row level security;

-- Optional: confirm structure
comment on table public.incidents is 'Stores all guard incident reports (auto-created by Cursor patch)';
