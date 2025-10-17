-- Update attendance_log table to remove plate_no column for standalone attendance
-- This makes the table independent of registration/route data

-- First, drop the plate_no column if it exists
alter table attendance_log drop column if exists plate_no;

-- Ensure the table has the correct structure for standalone attendance
create table if not exists attendance_log (
  id uuid primary key default gen_random_uuid(),
  guard_name text,
  selfie_url text,
  lat double precision,
  long double precision,
  created_at timestamptz default now()
);

-- Update RLS policies to reflect the simplified structure
drop policy if exists "Guards can insert their own attendance records" on attendance_log;
drop policy if exists "Guards can view their own attendance records" on attendance_log;
drop policy if exists "Admins can view all attendance records" on attendance_log;

-- Create new policies for the simplified structure
create policy "Guards can insert attendance records" on attendance_log
  for insert with check (true);

create policy "Guards can view attendance records" on attendance_log
  for select using (true);

create policy "Admins can view all attendance records" on attendance_log
  for all using (true);
