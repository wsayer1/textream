import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Settings } from '../lib/types';
import { DEFAULT_SETTINGS } from '../lib/types';

interface SettingsStore extends Settings {
  settingsId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  settingsId: null,
  loaded: false,

  load: async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      set({
        settingsId: data.id,
        font_size: data.font_size,
        font_family: data.font_family,
        font_color: data.font_color,
        listening_mode: data.listening_mode,
        scroll_speed: data.scroll_speed,
        show_elapsed_time: data.show_elapsed_time,
        auto_next_page: data.auto_next_page,
        auto_next_page_delay: data.auto_next_page_delay,
        speech_locale: data.speech_locale,
        deepgram_api_key: data.deepgram_api_key || '',
        loaded: true,
      });
    } else {
      const { data: inserted } = await supabase
        .from('settings')
        .insert(DEFAULT_SETTINGS)
        .select()
        .single();

      if (inserted) {
        set({ settingsId: inserted.id, loaded: true });
      } else {
        set({ loaded: true });
      }
    }
  },

  update: async (partial) => {
    set(partial);
    const { settingsId } = get();
    if (settingsId) {
      await supabase
        .from('settings')
        .update({ ...partial, updated_at: new Date().toISOString() })
        .eq('id', settingsId);
    }
  },
}));
