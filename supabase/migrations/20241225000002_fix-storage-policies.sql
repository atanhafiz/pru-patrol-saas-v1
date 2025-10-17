-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('patrol-photos', 'patrol-photos', true)
on conflict (id) do update set public = true;

-- Drop any restrictive policy first
drop policy if exists allow_upload_patrol_photos on storage.objects;

-- Create policy to allow all uploads for patrol-photos bucket
create policy allow_upload_patrol_photos
on storage.objects
for all
to anon, authenticated
using (bucket_id = 'patrol-photos')
with check (bucket_id = 'patrol-photos');
