import { ReactNode, useState } from 'react';
import { NewHireStage, STAGES } from '../types';
import { formatScheduleDate } from '../utils/schedule';
import Chevron from './Chevron';

interface Props {
  title: string;
  totalTasks: number;
  completedTasks: number;
  stage: NewHireStage;
  onStageChange?: (stage: NewHireStage) => void;
  startDate?: string | null;
  completionDate?: string | null;
  defaultCollapsed?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

export default function ModuleGroup({
  title,
  totalTasks,
  completedTasks,
  stage,
  onStageChange,
  startDate,
  completionDate,
  defaultCollapsed = false,
  onRemove,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const stageLabel = STAGES.find((s) => s.key === stage)?.label ?? stage;
  const canRemove = onRemove && stage === 'not_started';

  return (
    <div className="module-group">
      <div className="module-group-header">
        <button
          type="button"
          className="module-group-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <Chevron open={!collapsed} className="module-group-chevron" />
          <span className="module-group-title">{title}</span>
        </button>
        {startDate && completionDate && (
          <span className="module-group-target">
            {formatScheduleDate(startDate)} – {formatScheduleDate(completionDate)}
          </span>
        )}
        <span className="module-group-progress">
          <span className="module-group-progress-bar">
            <span className="module-group-progress-fill" style={{ width: `${percent}%` }} />
          </span>
          <span className="module-group-progress-label">
            {completedTasks}/{totalTasks} · {percent}%
          </span>
        </span>
        {onStageChange ? (
          <select
            className={`module-group-stage-select module-group-stage-${stage}`}
            value={stage}
            onChange={(e) => onStageChange(e.target.value as NewHireStage)}
            onClick={(e) => e.stopPropagation()}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={`module-group-stage-badge module-group-stage-${stage}`}>
            {stageLabel}
          </span>
        )}
        {canRemove && (
          <button
            type="button"
            className="module-group-remove"
            onClick={onRemove}
            title="Remove this module (only available before it's started)"
          >
            Remove
          </button>
        )}
      </div>
      {!collapsed && <div className="module-group-body">{children}</div>}
    </div>
  );
}
