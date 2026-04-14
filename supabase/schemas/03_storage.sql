-- Create the avatars bucket which is public
insert into storage.buckets
  (id, name, public)
values
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- RLS on storage.objects: allow authenticated users to upload/update/delete only their own files
create policy "Authenticated users can upload own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Authenticated users can update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Authenticated users can delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

-- Public read so avatar URLs work when displayed
create policy "Avatars are publicly readable"
on storage.objects for select to public
using (bucket_id = 'avatars');
