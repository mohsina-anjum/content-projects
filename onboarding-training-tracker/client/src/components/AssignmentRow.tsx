import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { ASSIGNMENT_STATUSES, AssignmentStatus, AssignmentWithModule } from '../types';
import Linkified from './Linkified';

interface Props {
  assignment: AssignmentWithModule;
  onUpdated: (updated: AssignmentWithModule) => void;
}

export default function AssignmentRow({ assignment, onUpdated }: Props) {
  const [notes, setNotes] = useState(assignment.notes ?? '');
  const [evaluatedBy, setEvaluatedBy] = useState(assignment.evaluated_by ?? '');
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(assignment.notes ?? '');
    setEvaluatedBy(assignment.evaluated_by ?? '');
  }, [assignment.id, assignment.notes, assignment.evaluated_by]);

  useEffect(() => {
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
    };
  }, []);

  function flashSaved() {
    setSaved(true);
    if (savedTimeout.current) clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), 1500);
  }

  async function save(patch: Partial<{
    status: AssignmentStatus;
    score: number | null;
    notes: string | null;
    evaluated_by: string | null;
  }>) {
    const updated = await api.updateAssignment(assignment.id, patch);
    onUpdated(updated);
    flashSaved();
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    save({ status: e.target.value as AssignmentStatus });
  }

  function handleNotesBlur() {
    if (notes !== (assignment.notes ?? '')) {
      save({ notes: notes.trim() === '' ? null : notes });
    }
  }

  function handleEvaluatedByBlur() {
    if (evaluatedBy !== (assignment.evaluated_by ?? '')) {
      save({ evaluated_by: evaluatedBy.trim() === '' ? null : evaluatedBy });
    }
  }

  return (
    <div className="assignment-row">
      <div className="assignment-row-main">
        <div className="assignment-info">
          <div className="assignment-category">{assignment.module_category}</div>
          <div className="assignment-title">{assignment.module_title}</div>
          {assignment.module_description && (
            <div className="assignment-description">
              <Linkified text={assignment.module_description} />
            </div>
          )}
        </div>
        <div className="assignment-controls">
          <select
            className="status-select"
            value={assignment.status}
            onChange={handleStatusChange}
            data-status={assignment.status}
          >
            {ASSIGNMENT_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {saved && <span className="saved-indicator">Saved</span>}
        </div>
      </div>
      <div className="assignment-row-footer">
        <label className="form-field compact">
          <span>Evaluator Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            rows={2}
            placeholder={
              assignment.module_category === 'Certification'
                ? 'Add certification call notes and specify any callouts from the certification call.'
                : 'Notes on progress or performance…'
            }
          />
        </label>
        <label className="form-field compact evaluated-by">
          <span>Evaluated By</span>
          <input
            value={evaluatedBy}
            onChange={(e) => setEvaluatedBy(e.target.value)}
            onBlur={handleEvaluatedByBlur}
            placeholder="Evaluator name"
          />
        </label>
      </div>
    </div>
  );
}
