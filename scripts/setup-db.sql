-- Full Supabase schema
-- Auto-generated; placeholder for reference

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  batch_id UUID REFERENCES batches(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  zoom_meeting_id TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance (
  session_id UUID REFERENCES live_sessions(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  present BOOLEAN DEFAULT false,
  marked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, student_id)
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  mux_asset_id TEXT,
  playback_id TEXT,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  answers JSONB NOT NULL,
  score NUMERIC,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
