import { ReactNode } from 'react';

const INLINE_PATTERN =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, bold, linkLabel, linkUrl, bareUrl] = match;
    if (bold !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{bold}</strong>);
    } else {
      const url = linkUrl ?? bareUrl;
      nodes.push(
        <a key={`${keyPrefix}-${key++}`} href={url} target="_blank" rel="noopener noreferrer">
          {linkLabel ?? url}
        </a>
      );
    }
    lastIndex = INLINE_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function isBulletLine(line: string): string | null {
  const match = /^\s*[-*]\s+(.*)$/.exec(line);
  return match ? match[1] : null;
}

export default function Linkified({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let blockKey = 0;

  let listItems: string[] | null = null;
  function flushList() {
    if (listItems && listItems.length > 0) {
      const items = listItems;
      blocks.push(
        <ul className="formatted-text-list" key={`ul-${blockKey++}`}>
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, `li-${blockKey}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    listItems = null;
  }

  let paraLines: string[] = [];
  function flushPara() {
    if (paraLines.length > 0) {
      const lines = paraLines;
      const content: ReactNode[] = [];
      lines.forEach((line, i) => {
        if (i > 0) content.push(<br key={`br-${blockKey}-${i}`} />);
        content.push(...renderInline(line, `p-${blockKey}-${i}`));
      });
      blocks.push(<p key={`p-${blockKey++}`}>{content}</p>);
    }
    paraLines = [];
  }

  for (const line of lines) {
    const bulletText = isBulletLine(line);
    if (bulletText !== null) {
      flushPara();
      if (!listItems) listItems = [];
      listItems.push(bulletText);
    } else if (line.trim() === '') {
      flushList();
      flushPara();
    } else {
      flushList();
      paraLines.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="formatted-text">{blocks}</div>;
}
