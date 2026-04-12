-- Directed follow graph: follower_id follows following_id (both reference profiles.id).
-- When either profile is removed (user deleted), edges involving that id CASCADE away.
--
-- Query patterns:
--   Followers of @user:     WHERE following_id = user_id  (join profiles on follower_id for "who")
--   Accounts @user follows: WHERE follower_id = user_id   (join profiles on following_id for "who")
--   Counts: COUNT(*) on those filters; partial unique PK prevents duplicate follows.

CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id)
);

-- PK (follower_id, following_id) already supports "who does this user follow?" by follower_id.
CREATE INDEX follows_following_id_idx ON follows (following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Counts and lists on profile pages for visitors who are not signed in.
CREATE POLICY "Follows are viewable by everyone"
ON follows
FOR SELECT
USING (true);

CREATE POLICY "Users can create follows as themselves"
ON follows
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = follower_id);

CREATE POLICY "Users can delete their own follows"
ON follows
FOR DELETE
TO authenticated
USING ((select auth.uid()) = follower_id);
