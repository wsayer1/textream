/*
  # Add Deepgram API key to settings

  1. Modified Tables
    - `settings`
      - Added `deepgram_api_key` (text, nullable) - stores the user's Deepgram API key for Nova-3 speech-to-text

  2. Notes
    - Column is nullable with no default, so existing rows are unaffected
    - When null or empty, the app falls back to browser-built-in speech recognition
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'deepgram_api_key'
  ) THEN
    ALTER TABLE settings ADD COLUMN deepgram_api_key text;
  END IF;
END $$;
