-- Create users table for tracking daily rewards
CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    last_daily_claim TIMESTAMP WITH TIME ZONE,
    free_shakes INTEGER DEFAULT 1,
    free_blasts INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid()::text = wallet_address OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Service role can update (for API routes)
-- Note: In a real app, you'd want stricter policies or handle updates via API only.
