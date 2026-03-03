import { useScriptsStore } from '../../stores/scriptsStore';
import clsx from 'clsx';

interface ScriptListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScriptList({
  activeId,
  onSelect,
  onDelete,
}: ScriptListProps) {
  const { scripts, loading } = useScriptsStore();

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-neutral-500">
        No saved scripts yet.
        <br />
        Write something and save it.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {scripts.map((script) => (
        <div
          key={script.id}
          className={clsx(
            'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
            activeId === script.id
              ? 'bg-neutral-700/60'
              : 'hover:bg-neutral-800/80'
          )}
          onClick={() => onSelect(script.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-200 truncate">
              {script.title || 'Untitled'}
            </div>
            <div className="text-xs text-neutral-500 truncate mt-0.5">
              {script.content.slice(0, 60).replace(/\n/g, ' ') || 'Empty'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(script.id);
            }}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 transition-all"
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
              <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
