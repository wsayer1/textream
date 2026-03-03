import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useScriptsStore } from '../stores/scriptsStore';
import { usePrompterStore } from '../stores/prompterStore';
import { splitPages } from '../lib/textUtils';
import ScriptEditor from '../components/editor/ScriptEditor';
import ScriptList from '../components/editor/ScriptList';
import SettingsPanel from '../components/settings/SettingsPanel';

export default function EditorPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const scripts = useScriptsStore();
  const prompter = usePrompterStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  useEffect(() => {
    settings.load();
    scripts.load();
  }, []);

  const pages = splitPages(content);
  const pageCount = pages.filter((p) => p.trim()).length;

  const handleSelectScript = useCallback(
    (id: string) => {
      const script = scripts.scripts.find((s) => s.id === id);
      if (script) {
        setActiveScriptId(id);
        setTitle(script.title);
        setContent(script.content);
        setSaveStatus('idle');
      }
    },
    [scripts.scripts]
  );

  const handleDeleteScript = useCallback(
    async (id: string) => {
      await scripts.remove(id);
      if (activeScriptId === id) {
        setActiveScriptId(null);
        setTitle('');
        setContent('');
      }
    },
    [scripts, activeScriptId]
  );

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    if (activeScriptId) {
      await scripts.update(activeScriptId, title || 'Untitled', content);
    } else {
      const created = await scripts.save(title || 'Untitled', content);
      if (created) {
        setActiveScriptId(created.id);
      }
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [activeScriptId, title, content, scripts]);

  const handleNew = useCallback(() => {
    setActiveScriptId(null);
    setTitle('');
    setContent('');
    setSaveStatus('idle');
  }, []);

  const handleStart = useCallback(() => {
    if (!content.trim()) return;
    const validPages = pages.filter((p) => p.trim());
    if (validPages.length === 0) return;
    prompter.setPages(validPages);
    prompter.startPage(0);
    navigate('/prompter');
  }, [content, pages, prompter, navigate]);

  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors lg:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-blue-400"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7 8h10M7 12h7M7 16h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-semibold text-white tracking-tight hidden sm:block">
              Textream
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="9" r="2.5" />
              <path d="M14.7 11.1a1.2 1.2 0 00.2 1.3l.1.1a1.5 1.5 0 11-2.1 2.1l-.1-.1a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.7 1.1v.1a1.5 1.5 0 11-3 0v-.1a1.2 1.2 0 00-.8-1.1 1.2 1.2 0 00-1.3.2l-.1.1a1.5 1.5 0 11-2.1-2.1l.1-.1a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.7h-.1a1.5 1.5 0 010-3h.1a1.2 1.2 0 001.1-.8 1.2 1.2 0 00-.2-1.3l-.1-.1a1.5 1.5 0 112.1-2.1l.1.1a1.2 1.2 0 001.3.2h.1a1.2 1.2 0 00.7-1.1v-.1a1.5 1.5 0 013 0v.1a1.2 1.2 0 00.7 1.1 1.2 1.2 0 001.3-.2l.1-.1a1.5 1.5 0 112.1 2.1l-.1.1a1.2 1.2 0 00-.2 1.3v.1a1.2 1.2 0 001.1.7h.1a1.5 1.5 0 010 3h-.1a1.2 1.2 0 00-1.1.7z" />
            </svg>
          </button>

          <button
            onClick={handleStart}
            disabled={!content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <path d="M3 1.5v11l9-5.5-9-5.5z" />
            </svg>
            Start
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <aside className="w-64 border-r border-neutral-800/80 bg-neutral-950 flex flex-col shrink-0">
            <div className="p-3 border-b border-neutral-800/50">
              <button
                onClick={handleNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200 font-medium rounded-lg transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M7 3v8M3 7h8" />
                </svg>
                New Script
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ScriptList
                activeId={activeScriptId}
                onSelect={handleSelectScript}
                onDelete={handleDeleteScript}
              />
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Script title..."
                className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-neutral-600 focus:outline-none"
              />
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                {pageCount > 1 && (
                  <span>
                    {pageCount} pages (separated by ---)
                  </span>
                )}
                <span>
                  {content.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                {saveStatus === 'saving' && <span>Saving...</span>}
                {saveStatus === 'saved' && (
                  <span className="text-green-400">Saved</span>
                )}
              </div>
            </div>

            <ScriptEditor content={content} onChange={setContent} />

            <div className="flex items-center gap-3 mt-6 pb-12">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200 font-medium rounded-lg transition-colors"
              >
                {activeScriptId ? 'Save' : 'Save Script'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
