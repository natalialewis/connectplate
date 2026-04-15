INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-pdfs', 'recipe-pdfs', false)
ON CONFLICT (id) DO NOTHING;


  create table "public"."recipe_pdf_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "recipe_id" uuid not null,
    "user_id" uuid not null,
    "status" text not null,
    "storage_path" text,
    "error" text,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."recipe_pdf_jobs" enable row level security;

CREATE UNIQUE INDEX recipe_pdf_jobs_pkey ON public.recipe_pdf_jobs USING btree (id);

CREATE INDEX recipe_pdf_jobs_recipe_idx ON public.recipe_pdf_jobs USING btree (recipe_id);

CREATE INDEX recipe_pdf_jobs_user_created_idx ON public.recipe_pdf_jobs USING btree (user_id, created_at DESC);

alter table "public"."recipe_pdf_jobs" add constraint "recipe_pdf_jobs_pkey" PRIMARY KEY using index "recipe_pdf_jobs_pkey";

alter table "public"."recipe_pdf_jobs" add constraint "recipe_pdf_jobs_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_pdf_jobs" validate constraint "recipe_pdf_jobs_recipe_id_fkey";

alter table "public"."recipe_pdf_jobs" add constraint "recipe_pdf_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'ready'::text, 'failed'::text]))) not valid;

alter table "public"."recipe_pdf_jobs" validate constraint "recipe_pdf_jobs_status_check";

alter table "public"."recipe_pdf_jobs" add constraint "recipe_pdf_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_pdf_jobs" validate constraint "recipe_pdf_jobs_user_id_fkey";

grant delete on table "public"."recipe_pdf_jobs" to "anon";

grant insert on table "public"."recipe_pdf_jobs" to "anon";

grant references on table "public"."recipe_pdf_jobs" to "anon";

grant select on table "public"."recipe_pdf_jobs" to "anon";

grant trigger on table "public"."recipe_pdf_jobs" to "anon";

grant truncate on table "public"."recipe_pdf_jobs" to "anon";

grant update on table "public"."recipe_pdf_jobs" to "anon";

grant delete on table "public"."recipe_pdf_jobs" to "authenticated";

grant insert on table "public"."recipe_pdf_jobs" to "authenticated";

grant references on table "public"."recipe_pdf_jobs" to "authenticated";

grant select on table "public"."recipe_pdf_jobs" to "authenticated";

grant trigger on table "public"."recipe_pdf_jobs" to "authenticated";

grant truncate on table "public"."recipe_pdf_jobs" to "authenticated";

grant update on table "public"."recipe_pdf_jobs" to "authenticated";

grant delete on table "public"."recipe_pdf_jobs" to "service_role";

grant insert on table "public"."recipe_pdf_jobs" to "service_role";

grant references on table "public"."recipe_pdf_jobs" to "service_role";

grant select on table "public"."recipe_pdf_jobs" to "service_role";

grant trigger on table "public"."recipe_pdf_jobs" to "service_role";

grant truncate on table "public"."recipe_pdf_jobs" to "service_role";

grant update on table "public"."recipe_pdf_jobs" to "service_role";


  create policy "Users can insert own pdf jobs"
  on "public"."recipe_pdf_jobs"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view own pdf jobs"
  on "public"."recipe_pdf_jobs"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER set_updated_at_recipe_pdf_jobs BEFORE UPDATE ON public.recipe_pdf_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


  create policy "Users can read own recipe pdfs"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'recipe-pdfs'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



