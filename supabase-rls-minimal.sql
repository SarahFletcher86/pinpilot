-- MINIMAL Supabase RLS Fix
-- Run this FIRST if you want the quickest solution

-- Enable RLS on both tables
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (this is what your API uses)
CREATE POLICY "Service role full access on schedules" ON schedules
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on users" ON users
FOR ALL USING (auth.role() = 'service_role');

-- That's it! This should stop the security alerts.
-- Your API will continue working because it uses the service role key.