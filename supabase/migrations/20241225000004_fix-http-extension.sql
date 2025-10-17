-- Fix HTTP extension and net.http_post function
-- This migration enables the HTTP extension and creates a compatible net.http_post function

-- Enable HTTP extension if not already enabled
create extension if not exists http with schema extensions;

-- Drop and recreate net schema
drop schema if exists net cascade;
create schema net;

-- Create compatible net.http_post function that works with current HTTP extension
create or replace function net.http_post(url text, body json)
returns void as $$
declare
  res json;
begin
  -- Perform the HTTP POST request using the correct http_request function
  select content::json into res
  from extensions.http_request(
    method := 'POST',
    url := url,
    headers := json_build_object('Content-Type','application/json'),
    body := body::text
  );
end;
$$ language plpgsql security definer;

-- Grant execute permissions on the function
grant execute on function net.http_post(text, json) to authenticated;
grant execute on function net.http_post(text, json) to service_role;
