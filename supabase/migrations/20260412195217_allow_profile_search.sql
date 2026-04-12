set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_profiles_for_friend(p_query text)
 RETURNS TABLE(id uuid, username text, first_name text, last_name text, avatar_url text, already_following boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    uid uuid;
    q text;
    escaped text;
BEGIN
    uid := (SELECT auth.uid());
    IF uid IS NULL THEN
        RETURN;
    END IF;

    q := regexp_replace(lower(trim(p_query)), '[^a-z0-9._]', '', 'g');
    IF length(q) < 1 THEN
        RETURN;
    END IF;
    IF length(q) > 30 THEN
        q := left(q, 30);
    END IF;

    escaped := replace(q, '\', '\\');
    escaped := replace(escaped, '%', '\%');
    escaped := replace(escaped, '_', '\_');

    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.first_name,
        p.last_name,
        p.avatar_url,
        EXISTS (
            SELECT 1
            FROM follows f
            WHERE f.follower_id = uid AND f.following_id = p.id
        ) AS already_following
    FROM profiles p
    WHERE p.id <> uid
      AND p.username ILIKE '%' || escaped || '%' ESCAPE '\'
    ORDER BY
        CASE WHEN p.username ILIKE escaped || '%' ESCAPE '\' THEN 0 ELSE 1 END,
        char_length(p.username),
        p.username
    LIMIT 3;
END;
$function$
;


