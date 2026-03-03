import { useSettingsStore } from '../../stores/settingsStore';
import {
  FONT_SIZE_LABELS,
  FONT_FAMILY_LABELS,
  FONT_FAMILY_CSS,
  FONT_COLOR_VALUES,
  FONT_COLOR_LABELS,
  LISTENING_MODE_LABELS,
  LISTENING_MODE_DESCRIPTIONS,
} from '../../lib/types';
import type {
  FontSizePreset,
  FontFamilyPreset,
  FontColorPreset,
  ListeningMode,
} from '../../lib/types';
import clsx from 'clsx';

const FONT_SIZES: FontSizePreset[] = ['xs', 'sm', 'lg', 'xl'];
const FONT_FAMILIES: FontFamilyPreset[] = ['sans', 'serif', 'mono', 'dyslexia'];
const FONT_COLORS: FontColorPreset[] = [
  'white',
  'yellow',
  'green',
  'blue',
  'pink',
  'orange',
];
const LISTENING_MODES: ListeningMode[] = [
  'wordTracking',
  'silencePaused',
  'classic',
];

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (BR)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'tr-TR', label: 'Turkish' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'hi-IN', label: 'Hindi' },
];

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useSettingsStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] bg-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Section title="Speech Engine">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    settings.deepgram_api_key ? 'bg-emerald-400' : 'bg-neutral-600'
                  )}
                />
                <span className="text-sm text-neutral-300">
                  {settings.deepgram_api_key ? 'Deepgram Nova-3' : 'Browser (fallback)'}
                </span>
              </div>
              <input
                type="password"
                placeholder="Deepgram API key"
                value={settings.deepgram_api_key}
                onChange={(e) =>
                  settings.update({ deepgram_api_key: e.target.value })
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Paste your Deepgram API key for higher-accuracy speech recognition.
                Without a key, the browser's built-in speech engine is used.
              </p>
            </div>
          </Section>

          <Section title="Listening Mode">
            <div className="space-y-2">
              {LISTENING_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => settings.update({ listening_mode: mode })}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border transition-all',
                    settings.listening_mode === mode
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-neutral-700/50 bg-neutral-800/50 hover:bg-neutral-800'
                  )}
                >
                  <div className="text-sm font-medium text-white">
                    {LISTENING_MODE_LABELS[mode]}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {LISTENING_MODE_DESCRIPTIONS[mode]}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {settings.listening_mode !== 'wordTracking' && (
            <Section title="Scroll Speed">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={settings.scroll_speed}
                  onChange={(e) =>
                    settings.update({
                      scroll_speed: parseFloat(e.target.value),
                    })
                  }
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm text-neutral-300 font-mono w-12 text-right">
                  {settings.scroll_speed} w/s
                </span>
              </div>
            </Section>
          )}

          <Section title="Font Size">
            <div className="flex gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => settings.update({ font_size: size })}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                    settings.font_size === size
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  )}
                >
                  {FONT_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Font Family">
            <div className="grid grid-cols-4 gap-2">
              {FONT_FAMILIES.map((family) => (
                <button
                  key={family}
                  onClick={() => settings.update({ font_family: family })}
                  className={clsx(
                    'py-3 rounded-lg transition-all flex flex-col items-center gap-1',
                    settings.font_family === family
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  )}
                >
                  <span
                    className="text-lg"
                    style={{ fontFamily: FONT_FAMILY_CSS[family] }}
                  >
                    Aa
                  </span>
                  <span className="text-xs">{FONT_FAMILY_LABELS[family]}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Font Color">
            <div className="flex gap-2">
              {FONT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => settings.update({ font_color: color })}
                  className={clsx(
                    'flex-1 py-2 rounded-lg flex flex-col items-center gap-1.5 transition-all',
                    settings.font_color === color
                      ? 'bg-neutral-700 ring-2 ring-white/30'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: FONT_COLOR_VALUES[color] }}
                  />
                  <span className="text-[10px] text-neutral-400">
                    {FONT_COLOR_LABELS[color]}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Language">
            <select
              value={settings.speech_locale}
              onChange={(e) =>
                settings.update({ speech_locale: e.target.value })
              }
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Display">
            <Toggle
              label="Show elapsed time"
              checked={settings.show_elapsed_time}
              onChange={(val) => settings.update({ show_elapsed_time: val })}
            />
          </Section>

          <Section title="Pages">
            <Toggle
              label="Auto-advance to next page"
              checked={settings.auto_next_page}
              onChange={(val) => settings.update({ auto_next_page: val })}
            />
            {settings.auto_next_page && (
              <div className="flex items-center gap-3 mt-3">
                <label className="text-sm text-neutral-400">Delay</label>
                <select
                  value={settings.auto_next_page_delay}
                  onChange={(e) =>
                    settings.update({
                      auto_next_page_delay: parseInt(e.target.value),
                    })
                  }
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                  {[1, 2, 3, 5, 10].map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-neutral-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-blue-500' : 'bg-neutral-600'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
            checked && 'translate-x-4'
          )}
        />
      </button>
    </label>
  );
}
