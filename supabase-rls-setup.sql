-- Supabase RLS (Row Level Security) Setup
-- Run this in your Supabase SQL Editor to fix security alerts

-- =====================================================
-- TABLE 1: schedules
-- =====================================================

-- Enable RLS on schedules table
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for API operations)
CREATE POLICY "Service role can manage all schedules" ON schedules
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can only see their own scheduled posts
-- (You'll need to add user_id column to schedules table first)
-- CREATE POLICY "Users can view own schedules" ON schedules
-- FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own schedules
-- CREATE POLICY "Users can insert own schedules" ON schedules
-- FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE 2: users
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for Stripe webhooks)
CREATE POLICY "Service role can manage all users" ON users
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- OPTIONAL: Add user_id to schedules table
-- =====================================================

-- If you want user-specific schedules, add this column:
-- ALTER TABLE schedules ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Then update the policies above to use user_id instead of auth.uid()

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('schedules', 'users');

-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('schedules', 'users');