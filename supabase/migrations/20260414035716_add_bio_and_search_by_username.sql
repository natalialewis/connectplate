alter table "public"."profiles" add column "bio" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_profile_card_by_username(p_username text)
 RETURNS TABLE(id uuid, username text, first_name text, last_name text, avatar_url text, bio text, is_self boolean, already_following boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    uid uuid;
    clean_username text;
BEGIN
    uid := (SELECT auth.uid());
    IF uid IS NULL THEN
        RETURN;
    END IF;

    clean_username := regexp_replace(lower(trim(p_username)), '[^a-z0-9._]', '', 'g');
    IF length(clean_username) < 3 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.bio,
        (p.id = uid) AS is_self,
        EXISTS (
            SELECT 1
            FROM follows f
            WHERE f.follower_id = uid
              AND f.following_id = p.id
        ) AS already_following
    FROM profiles p
    WHERE p.username = clean_username
    LIMIT 1;
END;
$function$
;


