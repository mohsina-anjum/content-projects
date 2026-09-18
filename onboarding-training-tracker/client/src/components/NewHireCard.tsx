import { useState } from 'react';
import { api } from '../api/client';
import { AssignmentWithModule, HireModuleSummary, NewHireWithProgress } from '../types';
import { progressTier } from '../utils/progress';

interface Props {
  hire: NewHireWithProgress;
  module: HireModuleSummary;
  onClick: () => void;
}

export default function NewHireCard({ hire, module, onClick }: Props) {
  const tier = progressTier(module.progress_percent);
  const [assignments, setAssignments] = useState<AssignmentWithModule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const isAtRisk = module.stage === 'at_risk';

  function handleMouseEnter() {
    if (assignments !== null || loading) return;
    setLoading(true);
    api
      .getAssignments(hire.id)
      .then(setAssignments)
      .finally(() => setLoading(false));
  }

  const incomplete =
    assignments?.filter((a) => a.status !== 'completed' && a.module_agenda_id === module.agenda_id) ??
    [];

  return (
    <div
      className={`hire-card${isAtRisk ? ' hire-card-at-risk' : ''}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="hire-card-name">{hire.name}</div>
      <div className="hire-card-module">{module.agenda_name}</div>
      <div className="hire-card-role">{hire.role}</div>
      <div className="hire-card-date">Starts {formatDate(module.start_date ?? hire.start_date)}</div>
      <div className="hire-card-progress">
        <div className={`progress-bar-track progress-tier-${tier}`}>
          <div className="progress-bar-fill" style={{ width: `${module.progress_percent}%` }} />
        </div>
        <span className="progress-label">
          {module.completed_modules}/{module.total_modules}
        </span>
      </div>
      {module.average_score !== null && (
        <div className="score-badge">{module.average_score.toFixed(1)} ★</div>
      )}

      <div
        className={`at-risk-tooltip${isAtRisk ? '' : ' at-risk-tooltip-neutral'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="at-risk-tooltip-title">
          {isAtRisk ? 'Lagging behind on' : 'Outstanding tasks'}
        </div>
        {loading && <div className="at-risk-tooltip-empty">Loading…</div>}
        {!loading && incomplete.length === 0 && assignments !== null && (
          <div className="at-risk-tooltip-empty">Nothing outstanding.</div>
        )}
        {!loading && incomplete.length > 0 && (
          <ul className="at-risk-tooltip-list">
            {incomplete.slice(0, 6).map((a) => (
              <li key={a.id}>
                <span className={`at-risk-tooltip-status at-risk-tooltip-status-${a.status}`} />
                <span className="at-risk-tooltip-item-title">{a.module_title}</span>
                {a.module_stage === 'at_risk' && <span className="overdue-badge">Overdue</span>}
              </li>
            ))}
            {incomplete.length > 6 && (
              <li className="at-risk-tooltip-more">+ {incomplete.length - 6} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
