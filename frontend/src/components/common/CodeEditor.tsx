import { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'sql',
  placeholder = 'Enter SQL query...',
  className = '',
}: CodeEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 100)}px`;
  }, [value]);

  return (
    <div
      className={`relative rounded-md border ${
        isFocused ? 'border-primary' : 'border-white border-opacity-20'
      } transition-colors ${className}`}
    >
      <div className="absolute top-0 right-0 p-1.5 text-xs text-white text-opacity-50 bg-darkNav rounded-bl rounded-tr-md z-10">
        {language.toUpperCase()}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full min-h-[120px] bg-darkNav bg-opacity-50 text-white p-4 font-mono text-sm outline-none resize-none rounded-md"
        spellCheck="false"
      />
    </div>
  );
}