-- Feed Social Features Schema
-- Run this migration to add posts, likes, comments, reposts, and follows

-- Posts Table (unencrypted for speed)
CREATE TABLE IF NOT EXISTS professional.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    link_media_url TEXT,
    link_preview JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS professional.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES professional.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS professional.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES professional.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Reposts Table
CREATE TABLE IF NOT EXISTS professional.post_reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES professional.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- User Follows Table
CREATE TABLE IF NOT EXISTS professional.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES professional.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON professional.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON professional.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON professional.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON professional.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON professional.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON professional.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON professional.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON professional.user_follows(following_id);

-- Grant permissions to service_role
GRANT ALL ON professional.posts TO service_role;
GRANT ALL ON professional.post_likes TO service_role;
GRANT ALL ON professional.post_comments TO service_role;
GRANT ALL ON professional.post_reposts TO service_role;
GRANT ALL ON professional.user_follows TO service_role;
