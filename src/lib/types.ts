export type FontSizePreset = 'xs' | 'sm' | 'lg' | 'xl';
export type FontFamilyPreset = 'sans' | 'serif' | 'mono' | 'dyslexia';
export type FontColorPreset = 'white' | 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
export type ListeningMode = 'wordTracking' | 'classic' | 'silencePaused';

export interface Settings {
  id?: string;
  font_size: FontSizePreset;
  font_family: FontFamilyPreset;
  font_color: FontColorPreset;
  listening_mode: ListeningMode;
  scroll_speed: number;
  show_elapsed_time: boolean;
  auto_next_page: boolean;
  auto_next_page_delay: number;
  speech_locale: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const FONT_SIZE_VALUES: Record<FontSizePreset, number> = {
  xs: 18,
  sm: 24,
  lg: 32,
  xl: 42,
};

export const FONT_SIZE_LABELS: Record<FontSizePreset, string> = {
  xs: 'XS',
  sm: 'SM',
  lg: 'LG',
  xl: 'XL',
};

export const FONT_FAMILY_CSS: Record<FontFamilyPreset, string> = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  dyslexia: "'OpenDyslexic', 'Comic Sans MS', cursive, sans-serif",
};

export const FONT_FAMILY_LABELS: Record<FontFamilyPreset, string> = {
  sans: 'Sans',
  serif: 'Serif',
  mono: 'Mono',
  dyslexia: 'Dyslexia',
};

export const FONT_COLOR_VALUES: Record<FontColorPreset, string> = {
  white: '#ffffff',
  yellow: 'rgb(255, 214, 10)',
  green: 'rgb(51, 214, 74)',
  blue: 'rgb(79, 140, 255)',
  pink: 'rgb(255, 97, 145)',
  orange: 'rgb(255, 158, 10)',
};

export const FONT_COLOR_LABELS: Record<FontColorPreset, string> = {
  white: 'White',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
  orange: 'Orange',
};

export const LISTENING_MODE_LABELS: Record<ListeningMode, string> = {
  wordTracking: 'Word Tracking',
  classic: 'Classic',
  silencePaused: 'Voice-Activated',
};

export const LISTENING_MODE_DESCRIPTIONS: Record<ListeningMode, string> = {
  wordTracking: 'Tracks each word you say and highlights it in real time.',
  classic: 'Auto-scrolls at a constant speed. No microphone needed.',
  silencePaused: 'Scrolls while you speak, pauses when you are silent.',
};

export const DEFAULT_SETTINGS: Settings = {
  font_size: 'lg',
  font_family: 'sans',
  font_color: 'white',
  listening_mode: 'wordTracking',
  scroll_speed: 3,
  show_elapsed_time: true,
  auto_next_page: false,
  auto_next_page_delay: 3,
  speech_locale: 'en-US',
};
