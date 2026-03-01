-- Create storage buckets for screenshots and audio files

-- Create screenshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for screenshots bucket
CREATE POLICY "Users can upload their own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for audio bucket
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_url column to scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_url column to voice_scans table
ALTER TABLE voice_scans ADD COLUMN IF NOT EXISTS file_url TEXT;
