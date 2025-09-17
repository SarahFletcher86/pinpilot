# Supabase RLS (Row Level Security) Setup

## 🚨 Security Alert Fix

Your Supabase project is showing security alerts because **Row Level Security (RLS)** is not enabled on your tables. This is a critical security issue that needs to be fixed immediately.

## 📋 Quick Fix (Recommended)

### Step 1: Go to Supabase Dashboard
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run the Minimal Fix
Copy and paste this SQL into the SQL Editor and click **Run**:

```sql
-- Enable RLS on both tables
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (this is what your API uses)
CREATE POLICY "Service role full access on schedules" ON schedules
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on users" ON users
FOR ALL USING (auth.role() = 'service_role');
```

### Step 3: Verify the Fix
After running the SQL, check that the security alerts disappear from your dashboard.

## 🔍 What This Does

- **Enables RLS** on `schedules` and `users` tables
- **Creates policies** that allow your API (service role) to access the data
- **Maintains functionality** - your app will continue working exactly as before
- **Fixes security alerts** - Supabase will stop warning you

## 📁 Files in This Directory

- `supabase-rls-minimal.sql` - Quick fix (recommended)
- `supabase-rls-setup.sql` - Complete setup with user-specific policies

## ⚠️ Important Notes

1. **Your API uses service role** - This bypasses RLS, so functionality won't change
2. **Security is improved** - RLS prevents unauthorized access via anon keys
3. **No breaking changes** - Your existing code will continue working

## 🧪 Testing

After applying the fix:
1. Test your app's functionality
2. Check that scheduled posts still work
3. Verify Stripe webhooks still process subscriptions
4. Confirm security alerts are gone

## 🔐 Why This Happened

- Supabase requires RLS for security
- Your tables were created without RLS enabled
- This is common during development but needs to be fixed for production

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase logs in your dashboard
2. Verify your service role key is correct in environment variables
3. Make sure you're running the SQL in the correct project