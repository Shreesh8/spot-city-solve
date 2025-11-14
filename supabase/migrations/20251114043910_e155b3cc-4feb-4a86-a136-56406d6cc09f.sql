-- Add indexes for frequently queried columns to improve performance

-- Index on issues.reporter_id for filtering user's own issues
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON public.issues(reporter_id);

-- Index on issues.status for filtering by status (open, in_progress, resolved)
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);

-- Index on issues.created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);

-- Index on issues.is_public for filtering public vs private issues
CREATE INDEX IF NOT EXISTS idx_issues_is_public ON public.issues(is_public);

-- Composite index for common query patterns (status + created_at)
CREATE INDEX IF NOT EXISTS idx_issues_status_created_at ON public.issues(status, created_at DESC);

-- Index on user_roles.user_id for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Index on profiles.user_id for profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);