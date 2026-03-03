import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Script } from '../lib/types';

interface ScriptsStore {
  scripts: Script[];
  loading: boolean;
  load: () => Promise<void>;
  save: (title: string, content: string) => Promise<Script | null>;
  update: (id: string, title: string, content: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useScriptsStore = create<ScriptsStore>((set, get) => ({
  scripts: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('scripts')
      .select('*')
      .order('updated_at', { ascending: false });

    set({ scripts: data ?? [], loading: false });
  },

  save: async (title, content) => {
    const { data } = await supabase
      .from('scripts')
      .insert({ title, content })
      .select()
      .single();

    if (data) {
      set({ scripts: [data, ...get().scripts] });
    }
    return data;
  },

  update: async (id, title, content) => {
    await supabase
      .from('scripts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id);

    set({
      scripts: get().scripts.map((s) =>
        s.id === id ? { ...s, title, content, updated_at: new Date().toISOString() } : s
      ),
    });
  },

  remove: async (id) => {
    await supabase.from('scripts').delete().eq('id', id);
    set({ scripts: get().scripts.filter((s) => s.id !== id) });
  },
}));
