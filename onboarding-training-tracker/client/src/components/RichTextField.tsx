import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}

export default function RichTextField({ value, onChange, rows = 10, className }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function focusSelection(start: number, end: number) {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  }

  function applyBold() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'bold text';
    const next = `${value.slice(0, start)}**${selected}**${value.slice(end)}`;
    onChange(next);
    focusSelection(start + 2, start + 2 + selected.length);
  }

  function applyBullets() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end > start ? end - 1 : end);
    if (lineEnd === -1) lineEnd = value.length;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const nonEmpty = lines.filter((l) => l.trim() !== '');
    const alreadyBulleted = nonEmpty.length > 0 && nonEmpty.every((l) => /^\s*-\s/.test(l));
    const newLines = lines.map((l) => {
      if (l.trim() === '') return l;
      return alreadyBulleted ? l.replace(/^\s*-\s/, '') : `- ${l}`;
    });
    const newBlock = newLines.join('\n');
    const next = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
    onChange(next);
    focusSelection(lineStart, lineStart + newBlock.length);
  }

  function applyLink() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const url = window.prompt('Link URL:', 'https://');
    if (!url || !url.trim()) return;
    const label = selected || 'link text';
    const markdown = `[${label}](${url.trim()})`;
    const next = value.slice(0, start) + markdown + value.slice(end);
    onChange(next);
    const cursor = start + markdown.length;
    focusSelection(cursor, cursor);
  }

  return (
    <div className="rich-text-field">
      <div className="rich-text-toolbar">
        <button
          type="button"
          className="rich-text-toolbar-btn"
          onClick={applyBold}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="rich-text-toolbar-btn"
          onClick={applyBullets}
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          className="rich-text-toolbar-btn"
          onClick={applyLink}
          title="Insert link"
        >
          Link
        </button>
      </div>
      <textarea
        ref={ref}
        className={`rich-text-textarea${className ? ` ${className}` : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
}
