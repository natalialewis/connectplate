set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_follow_feed_recent(max_age_days integer DEFAULT 30, max_results integer DEFAULT 100)
 RETURNS TABLE(id uuid, title text, description text, image_url text, created_at timestamp with time zone, owner_id uuid, owner_username text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    uid uuid;
BEGIN
    uid := (SELECT auth.uid());
    IF uid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.created_at,
        r.owner_id,
        p.username AS owner_username
    FROM recipes r
    JOIN follows f
      ON f.following_id = r.owner_id
     AND f.follower_id = uid
    JOIN profiles p
      ON p.id = r.owner_id
    WHERE r.is_public = true
      AND r.created_at >= (now() - make_interval(days => GREATEST(max_age_days, 1)))
    ORDER BY r.created_at DESC
    LIMIT GREATEST(max_results, 1);
END;
$function$
;


