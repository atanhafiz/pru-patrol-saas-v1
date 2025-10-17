-- Create trigger function for incident alerts
create or replace function public.handle_new_incident()
returns trigger as $$
declare
  payload json;
begin
  payload := json_build_object('record', row_to_json(NEW));
  perform
    net.http_post(
      (select value from vault.secrets where name = 'incident_alert_function_url'),
      payload
    );
  return NEW;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_new_incident on public.incidents;

-- Create new trigger
create trigger on_new_incident
after insert on public.incidents
for each row
execute procedure public.handle_new_incident();
