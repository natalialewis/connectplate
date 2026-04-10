-- Social-style handle: 3-30 chars, [a-z0-9] with '.' or '_' in the middle only;
-- first and last character must be alphanumeric (not '.' or '_').
ALTER TABLE profiles
ADD COLUMN username TEXT NOT NULL
CONSTRAINT profiles_username_format_check CHECK (
    username ~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$'
    AND
    -- Ensures there are no back-to-back dots or underscores
    username !~ '[._]{2}'
);

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_key UNIQUE (username);

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;
