-- Student Representation Portal - Supabase Schema

-- Students / Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  roll_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_roll_number ON submissions(roll_number);
CREATE INDEX IF NOT EXISTS idx_submissions_department ON submissions(department);
CREATE INDEX IF NOT EXISTS idx_submissions_year ON submissions(year);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for student submissions)
CREATE POLICY "Allow public inserts" ON submissions
  FOR INSERT WITH CHECK (true);

-- Allow public reads for stats only (limited)
CREATE POLICY "Allow public count reads" ON submissions
  FOR SELECT USING (true);

-- Activity logs - service role only
CREATE POLICY "Service role only" ON activity_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Storage bucket for signatures
-- Run this in Supabase dashboard: Storage > New bucket > "signatures" (public)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT DO NOTHING;

-- Storage policy for signatures
CREATE POLICY "Allow public signature uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Allow public signature reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'signatures');
