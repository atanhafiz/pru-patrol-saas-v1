-- Enable replication for realtime events (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'incidents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
    END IF;
END $$;

-- Link function to incident table
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

drop trigger if exists on_new_incident on public.incidents;
create trigger on_new_incident
after insert on public.incidents
for each row
execute procedure public.handle_new_incident();
