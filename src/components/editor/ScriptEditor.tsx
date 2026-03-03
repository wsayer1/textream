import { useRef, useEffect } from 'react';

interface ScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function ScriptEditor({ content, onChange }: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, [content]);

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste your script here...

Use --- on its own line to separate pages."
        spellCheck={false}
        className="w-full min-h-[400px] bg-transparent text-neutral-100 text-base leading-relaxed resize-none focus:outline-none placeholder:text-neutral-600 font-sans"
      />
    </div>
  );
}
