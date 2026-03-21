-- Fix missing columns in incident_reports table
-- Run this in Supabase SQL Editor if you get errors when marking incidents as resolved

-- Add resolved_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_reports' AND column_name = 'resolved_at'
    ) THEN
        ALTER TABLE incident_reports ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add resolution_notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_reports' AND column_name = 'resolution_notes'
    ) THEN
        ALTER TABLE incident_reports ADD COLUMN resolution_notes TEXT;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incident_reports' 
AND column_name IN ('resolved_at', 'resolution_notes');
