-- Google OAuth creates auth.users immediately. Email/password signUp sends username in
-- raw_user_meta_data on insert, so those profiles are complete. OAuth users get a temporary
-- username until they finish the in-app signup step; proxy and /auth/callback gate on this flag.
-- Google photo URL is stored in profiles.avatar_url from raw_user_meta_data (avatar_url or picture).
ALTER TABLE profiles
ADD COLUMN signup_completed BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    meta_username text;
    chosen_username text;
    profile_ready boolean;
BEGIN
    meta_username := nullif(trim(NEW.raw_user_meta_data->>'username'), '');
    profile_ready := meta_username IS NOT NULL
        AND meta_username ~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$'
        AND meta_username !~ '[._]{2}';

    IF profile_ready THEN
        chosen_username := meta_username;
    ELSE
        chosen_username := 'u' || substr(md5(gen_random_uuid()::text), 1, 8);
    END IF;

    INSERT INTO public.profiles (id, email, first_name, last_name, username, signup_completed, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), ''),
            ''
        ),
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), ''),
            ''
        ),
        chosen_username,
        profile_ready,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), ''),
            NULL
        )
    );
    RETURN NEW;
END;
$$;
