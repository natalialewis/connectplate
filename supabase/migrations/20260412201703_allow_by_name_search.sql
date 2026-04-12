set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_profiles_for_friend(p_query text)
 RETURNS TABLE(id uuid, username text, first_name text, last_name text, avatar_url text, already_following boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    uid uuid;
    user_q text;
    name_q text;
    esc_user text;
    esc_name text;
BEGIN
    uid := (SELECT auth.uid());
    IF uid IS NULL THEN
        RETURN;
    END IF;

    user_q := regexp_replace(lower(trim(p_query)), '[^a-z0-9._]', '', 'g');
    name_q := regexp_replace(lower(trim(p_query)), '[^a-z[:space:]''\-]', '', 'g');
    name_q := regexp_replace(trim(name_q), '\s+', ' ', 'g');

    IF length(user_q) < 1 AND length(name_q) < 1 THEN
        RETURN;
    END IF;

    IF length(user_q) > 30 THEN
        user_q := left(user_q, 30);
    END IF;
    IF length(name_q) > 60 THEN
        name_q := left(name_q, 60);
    END IF;

    esc_user := '';
    IF length(user_q) >= 1 THEN
        esc_user := replace(user_q, '\', '\\');
        esc_user := replace(esc_user, '%', '\%');
        esc_user := replace(esc_user, '_', '\_');
    END IF;

    esc_name := '';
    IF length(name_q) >= 1 THEN
        esc_name := replace(name_q, '\', '\\');
        esc_name := replace(esc_name, '%', '\%');
        esc_name := replace(esc_name, '_', '\_');
    END IF;

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
      AND (
          (length(user_q) >= 1 AND p.username ILIKE '%' || esc_user || '%' ESCAPE '\')
          OR (
              length(name_q) >= 1
              AND (
                  lower(p.first_name) ILIKE '%' || esc_name || '%' ESCAPE '\'
                  OR lower(p.last_name) ILIKE '%' || esc_name || '%' ESCAPE '\'
                  OR lower(
                      regexp_replace(
                          trim(p.first_name) || ' ' || trim(p.last_name),
                          '\s+',
                          ' ',
                          'g'
                      )
                  ) ILIKE '%' || esc_name || '%' ESCAPE '\'
              )
          )
      )
    ORDER BY
        CASE
            WHEN length(user_q) >= 1 AND p.username ILIKE esc_user || '%' ESCAPE '\' THEN 0
            WHEN length(name_q) >= 1 AND lower(
                regexp_replace(trim(p.first_name) || ' ' || trim(p.last_name), '\s+', ' ', 'g')
            ) ILIKE esc_name || '%' ESCAPE '\' THEN 1
            WHEN length(name_q) >= 1 AND lower(p.first_name) ILIKE esc_name || '%' ESCAPE '\' THEN 2
            WHEN length(name_q) >= 1 AND lower(p.last_name) ILIKE esc_name || '%' ESCAPE '\' THEN 3
            WHEN length(user_q) >= 1 THEN 4
            ELSE 5
        END,
        char_length(p.username),
        p.username
    LIMIT 3;
END;
$function$
;


