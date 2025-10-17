-- Add status column to incidents table for archiving system
alter table incidents add column if not exists status text default 'active';

-- Set existing records older than 30 days to 'archived'
update incidents
set status = 'archived'
where created_at < now() - interval '30 days';

-- Create index for better performance on status filtering
create index if not exists idx_incidents_status on incidents(status);
create index if not exists idx_incidents_status_created_at on incidents(status, created_at);
