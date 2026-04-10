alter table "public"."profiles" add column "username" text not null;

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

alter table "public"."profiles" add constraint "profiles_username_format_check" CHECK (((username ~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$'::text) AND (username !~ '[._]{2}'::text))) not valid;

alter table "public"."profiles" validate constraint "profiles_username_format_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    meta_username text;
    chosen_username text;
BEGIN
    meta_username := nullif(trim(NEW.raw_user_meta_data->>'username'), '');
    IF meta_username IS NOT NULL
        AND meta_username ~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$'
        AND meta_username !~ '[._]{2}'
    THEN
        chosen_username := meta_username;
    ELSE
        chosen_username := 'u' || substr(md5(gen_random_uuid()::text), 1, 8);
    END IF;

    INSERT INTO public.profiles (id, email, first_name, last_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        chosen_username
    );
    RETURN NEW;
END;
$function$
;


