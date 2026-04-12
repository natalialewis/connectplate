
  create table "public"."follows" (
    "follower_id" uuid not null,
    "following_id" uuid not null,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."follows" enable row level security;

CREATE INDEX follows_following_id_idx ON public.follows USING btree (following_id);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (follower_id, following_id);

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."follows" add constraint "follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_id_fkey";

alter table "public"."follows" add constraint "follows_following_id_fkey" FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_following_id_fkey";

alter table "public"."follows" add constraint "follows_no_self_follow" CHECK ((follower_id <> following_id)) not valid;

alter table "public"."follows" validate constraint "follows_no_self_follow";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant references on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant trigger on table "public"."follows" to "anon";

grant truncate on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant references on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant trigger on table "public"."follows" to "authenticated";

grant truncate on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant references on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant trigger on table "public"."follows" to "service_role";

grant truncate on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";


  create policy "Follows are viewable by everyone"
  on "public"."follows"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create follows as themselves"
  on "public"."follows"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = follower_id));



  create policy "Users can delete their own follows"
  on "public"."follows"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = follower_id));



