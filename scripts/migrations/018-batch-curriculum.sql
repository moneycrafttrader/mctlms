-- Batch Recording Curriculum
-- Each batch can have its own curriculum: ordered categories of recordings.
-- A recording can appear in multiple batches with different positions/categories.

CREATE TABLE IF NOT EXISTS batch_recording_curriculum (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL DEFAULT 'General',
  module_name   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A recording cannot be added twice to the same batch
  UNIQUE (batch_id, recording_id)
);

CREATE INDEX idx_batch_curriculum_batch ON batch_recording_curriculum(batch_id);
CREATE INDEX idx_batch_curriculum_ordering ON batch_recording_curriculum(batch_id, category_name, sort_order);
