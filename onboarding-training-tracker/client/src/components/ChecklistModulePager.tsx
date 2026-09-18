import { useMemo, useState } from 'react';
import { AssignmentWithModule } from '../types';
import ChecklistRow from './ChecklistRow';

interface Props {
  sections: Record<string, AssignmentWithModule[]>;
  categoryOrder: string[];
  onUpdated: (updated: AssignmentWithModule) => void;
  certificationNotes?: string | null;
}

function displayName(category: string): string {
  return category === 'Introduction' ? 'Start Here' : category;
}

function isSectionComplete(rows: AssignmentWithModule[]): boolean {
  return rows.length > 0 && rows.every((r) => r.status === 'completed');
}

export default function ChecklistModulePager({
  sections,
  categoryOrder,
  onUpdated,
  certificationNotes,
}: Props) {
  const [page, setPage] = useState(0);

  // The furthest section the employee is allowed into: every earlier
  // section must be fully completed first. Sections stay visible in the
  // jump list either way, so the employee can see the full sequence ahead.
  const maxUnlockedIndex = useMemo(() => {
    for (let i = 0; i < categoryOrder.length; i++) {
      if (!isSectionComplete(sections[categoryOrder[i]] ?? [])) return i;
    }
    return categoryOrder.length - 1;
  }, [sections, categoryOrder]);

  const safePage = Math.min(page, maxUnlockedIndex);
  const category = categoryOrder[safePage];
  const rows = sections[category] ?? [];
  const currentComplete = isSectionComplete(rows);
  const isBuddyOnlySection =
    category === 'Certification' && rows.some((r) => !!r.module_has_certification_review);

  function goTo(index: number) {
    if (index > maxUnlockedIndex) return;
    setPage(index);
  }

  return (
    <div className="checklist-pager">
      <div className="checklist-pager-nav">
        <label className="checklist-pager-jump">
          <span>Jump to section</span>
          <select value={safePage} onChange={(e) => goTo(Number(e.target.value))}>
            {categoryOrder.map((c, i) => (
              <option key={c} value={i} disabled={i > maxUnlockedIndex}>
                {i + 1}. {displayName(c)}
                {i > maxUnlockedIndex ? ' — locked' : ''}
              </option>
            ))}
          </select>
        </label>
        <span className="checklist-pager-count">
          Page {safePage + 1} of {categoryOrder.length}
        </span>
      </div>

      {!currentComplete && !isBuddyOnlySection && (
        <div className="checklist-pager-lock-note">
          <p>
            Complete every task in this section to unlock the next one. You can still go back to
            review earlier sections anytime.
          </p>
        </div>
      )}

      <div className="checklist-category">
        <h2 className="checklist-category-title">{displayName(category)}</h2>
        {rows.map((assignment) => (
          <ChecklistRow
            key={assignment.id}
            assignment={assignment}
            onUpdated={onUpdated}
            certificationNotes={certificationNotes}
          />
        ))}
      </div>

      <div className="checklist-pager-controls">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={safePage === 0}
          onClick={() => goTo(Math.max(0, safePage - 1))}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={safePage >= maxUnlockedIndex}
          title={
            safePage >= maxUnlockedIndex && safePage < categoryOrder.length - 1
              ? 'Complete every task in this section to continue'
              : undefined
          }
          onClick={() => goTo(safePage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
