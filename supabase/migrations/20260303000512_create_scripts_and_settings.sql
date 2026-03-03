/*
  # Create scripts and settings tables

  1. New Tables
    - `scripts`
      - `id` (uuid, primary key) - unique script identifier
      - `title` (text) - script title
      - `content` (text) - full script text (pages separated by ---)
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp
    - `settings`
      - `id` (uuid, primary key) - unique settings row identifier
      - `font_size` (text) - font size preset (xs, sm, lg, xl)
      - `font_family` (text) - font family preset (sans, serif, mono, dyslexia)
      - `font_color` (text) - font color preset (white, yellow, green, blue, pink, orange)
      - `listening_mode` (text) - listening mode (wordTracking, classic, silencePaused)
      - `scroll_speed` (double precision) - words per second for classic/voice-activated modes
      - `show_elapsed_time` (boolean) - whether to show elapsed time counter
      - `auto_next_page` (boolean) - auto-advance pages
      - `auto_next_page_delay` (integer) - delay in seconds before auto-advancing
      - `speech_locale` (text) - language locale for speech recognition
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp
  2. Security
    - Enable RLS on both tables
    - Add permissive policies for anonymous access (no auth required per user request)
*/

CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to scripts"
  ON scripts FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert access to scripts"
  ON scripts FOR INSERT
  TO anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anonymous update access to scripts"
  ON scripts FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anonymous delete access to scripts"
  ON scripts FOR DELETE
  TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  font_size text NOT NULL DEFAULT 'lg',
  font_family text NOT NULL DEFAULT 'sans',
  font_color text NOT NULL DEFAULT 'white',
  listening_mode text NOT NULL DEFAULT 'wordTracking',
  scroll_speed double precision NOT NULL DEFAULT 3,
  show_elapsed_time boolean NOT NULL DEFAULT true,
  auto_next_page boolean NOT NULL DEFAULT false,
  auto_next_page_delay integer NOT NULL DEFAULT 3,
  speech_locale text NOT NULL DEFAULT 'en-US',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to settings"
  ON settings FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert access to settings"
  ON settings FOR INSERT
  TO anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anonymous update access to settings"
  ON settings FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);
