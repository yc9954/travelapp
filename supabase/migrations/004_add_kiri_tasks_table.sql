-- KIRI Engine processing tasks table
-- This table stores the status of video processing tasks from KIRI Engine

CREATE TABLE IF NOT EXISTS kiri_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  serialize TEXT UNIQUE NOT NULL, -- KIRI Engine task identifier
  video_uri TEXT, -- Original video URI
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0, -- 0-100
  download_url TEXT, -- Final 3D model download URL
  error_message TEXT, -- Error message if failed
  metadata JSONB, -- Additional metadata (modelQuality, textureQuality, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kiri_tasks_user_id ON kiri_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_kiri_tasks_serialize ON kiri_tasks(serialize);
CREATE INDEX IF NOT EXISTS idx_kiri_tasks_status ON kiri_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kiri_tasks_created_at ON kiri_tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE kiri_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own tasks" ON kiri_tasks;
CREATE POLICY "Users can view own tasks"
  ON kiri_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON kiri_tasks;
CREATE POLICY "Users can insert own tasks"
  ON kiri_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON kiri_tasks;
CREATE POLICY "Users can update own tasks"
  ON kiri_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
DROP TRIGGER IF EXISTS update_kiri_tasks_updated_at ON kiri_tasks;
CREATE TRIGGER update_kiri_tasks_updated_at
  BEFORE UPDATE ON kiri_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to allow webhook updates (by serialize, not user_id)
-- This allows KIRI Engine webhook to update tasks without authentication
DROP POLICY IF EXISTS "Webhook can update tasks by serialize" ON kiri_tasks;
CREATE POLICY "Webhook can update tasks by serialize"
  ON kiri_tasks FOR UPDATE
  USING (true); -- Note: In production, add webhook secret validation

-- Note: For production, you should:
-- 1. Create a service role function that validates webhook signature
-- 2. Use Supabase Edge Functions to handle webhooks securely
-- 3. Update tasks using service role, not anon key
