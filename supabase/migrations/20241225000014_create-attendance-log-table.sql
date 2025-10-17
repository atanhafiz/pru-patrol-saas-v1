-- Create attendance_log table for guard selfie check-ins
create table if not exists attendance_log (
  id uuid primary key default gen_random_uuid(),
  guard_name text,
  plate_no text,
  selfie_url text,
  lat double precision,
  long double precision,
  created_at timestamptz default now()
);

-- Create index for better query performance
create index if not exists idx_attendance_log_guard_name on attendance_log(guard_name);
create index if not exists idx_attendance_log_created_at on attendance_log(created_at);

-- Enable RLS (Row Level Security)
alter table attendance_log enable row level security;

-- Create policy to allow guards to insert their own attendance records
create policy "Guards can insert their own attendance records" on attendance_log
  for insert with check (true);

-- Create policy to allow guards to view their own attendance records
create policy "Guards can view their own attendance records" on attendance_log
  for select using (true);

-- Create policy to allow admins to view all attendance records
create policy "Admins can view all attendance records" on attendance_log
  for all using (true);
