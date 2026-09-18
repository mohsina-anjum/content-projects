import { useState } from 'react';
import { api } from '../api/client';
import { ASSIGNMENT_STATUSES, AssignmentStatus, AssignmentWithModule } from '../types';
import Linkified from './Linkified';

interface Props {
  assignment: AssignmentWithModule;
  onUpdated: (updated: AssignmentWithModule) => void;
  certificationNotes?: string | null;
}

export default function ChecklistRow({ assignment, onUpdated, certificationNotes }: Props) {
  const [saving, setSaving] = useState(false);

  const buddyOnly =
    !!assignment.module_has_certification_review && assignment.module_category === 'Certification';

  async function setStatus(status: AssignmentStatus) {
    if (status === assignment.status || saving) return;
    setSaving(true);
    try {
      const updated = await api.updateAssignment(assignment.id, { status });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = ASSIGNMENT_STATUSES.find((s) => s.key === assignment.status)?.label ?? assignment.status;

  return (
    <div className={`checklist-item checklist-item-${assignment.status}`}>
      <div className="checklist-item-main">
        <div className="checklist-item-title">{assignment.module_title}</div>
        {assignment.module_description && (
          <div className="checklist-item-description">
            <Linkified text={assignment.module_description} />
          </div>
        )}
        {buddyOnly && (
          <>
            <div className="checklist-item-buddy-note">
              <p>
                Only your buddy can mark this section as complete after your certification call.
                No action is required from your end here.
              </p>
              <p>
                Once your certification is complete, your buddy will mark the training as
                completed. Feedback from the certification call will also be added to this
                section after the certification is completed.
              </p>
            </div>
            <div className="checklist-item-feedback">
              <div className="checklist-item-feedback-title">FEEDBACK:</div>
              {certificationNotes && certificationNotes.trim() !== '' ? (
                <Linkified text={certificationNotes} />
              ) : (
                <p>No feedback shared yet.</p>
              )}
            </div>
          </>
        )}
      </div>
      {buddyOnly ? (
        <div className="checklist-item-status">
          <span className={`checklist-status-badge checklist-status-badge-${assignment.status}`}>
            {statusLabel}
          </span>
        </div>
      ) : (
        <div className="checklist-item-status" role="group" aria-label="Status">
          {ASSIGNMENT_STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`checklist-status-btn${assignment.status === s.key ? ' active' : ''}`}
              disabled={saving}
              onClick={() => setStatus(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
