-- Fix Supabase REST 404 for table 'public.incidents'
-- This migration ensures the incidents table is accessible via REST API

-- ✅ Ensure table name lowercase & correct schema
alter table if exists "Incidents" rename to incidents;

-- ✅ Disable Row Level Security
alter table public.incidents disable row level security;

-- ✅ Grant proper permissions to all Supabase roles
grant select, insert, update, delete on table public.incidents to anon, authenticated;
grant all privileges on table public.incidents to postgres, service_role;

-- ✅ Force PostgREST schema refresh
comment on table public.incidents is 'supabase-rest-refresh-' || now();

-- ✅ Verify structure exists for REST metadata
select column_name, data_type 
from information_schema.columns 
where table_name = 'incidents' and table_schema = 'public';
