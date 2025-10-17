-- Create guard_tracks table for real-time guard route tracking
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS guard_tracks (
  id BIGSERIAL PRIMARY KEY,
  guard_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_guard_tracks_guard_name ON guard_tracks(guard_name);
CREATE INDEX IF NOT EXISTS idx_guard_tracks_created_at ON guard_tracks(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE guard_tracks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert and select
CREATE POLICY "Allow authenticated users to insert guard tracks" ON guard_tracks
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select guard tracks" ON guard_tracks
  FOR SELECT TO authenticated
  USING (true);

-- Optional: Create policy to allow users to delete their own tracks (if needed)
-- CREATE POLICY "Allow users to delete their own tracks" ON guard_tracks
--   FOR DELETE TO authenticated
--   USING (auth.jwt() ->> 'email' = guard_name);
