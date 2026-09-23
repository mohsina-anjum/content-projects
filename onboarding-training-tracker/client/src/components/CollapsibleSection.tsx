import { ReactNode, useState } from 'react';
import Chevron from './Chevron';

interface Props {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  level?: 'module' | 'section';
  className?: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  meta,
  actions,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onToggle,
  level = 'section',
  className,
  children,
}: Props) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? internalCollapsed;

  function toggle() {
    if (onToggle) onToggle();
    else setInternalCollapsed((c) => !c);
  }

  return (
    <div
      className={`collapsible-section collapsible-section-${level}${className ? ` ${className}` : ''}`}
    >
      <div className="collapsible-section-header">
        <button
          type="button"
          className="collapsible-section-toggle"
          onClick={toggle}
          aria-expanded={!collapsed}
        >
          <Chevron open={!collapsed} className="collapsible-section-chevron" />
          <span className="collapsible-section-title">{title}</span>
          {meta && <span className="collapsible-section-meta">{meta}</span>}
        </button>
        {actions && (
          <div className="collapsible-section-actions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {!collapsed && <div className="collapsible-section-body">{children}</div>}
    </div>
  );
}
