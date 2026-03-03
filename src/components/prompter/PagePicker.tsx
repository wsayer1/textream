import clsx from 'clsx';

interface PagePickerProps {
  pages: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function PagePicker({
  pages,
  currentIndex,
  onSelect,
  onClose,
}: PagePickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white">Pages</h3>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {pages.map((page, i) => {
            const preview = page.trim().slice(0, 50);
            if (!preview) return null;
            return (
              <button
                key={i}
                onClick={() => {
                  onSelect(i);
                  onClose();
                }}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-lg transition-colors',
                  i === currentIndex
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'hover:bg-neutral-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-500 w-6">
                    {i + 1}
                  </span>
                  <span className="text-sm text-neutral-200 truncate">
                    {preview}
                    {page.trim().length > 50 ? '...' : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
