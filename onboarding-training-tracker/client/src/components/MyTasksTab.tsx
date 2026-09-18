import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CurrentUser } from '../hooks/useCurrentUser';
import { NewHireWithProgress } from '../types';
import { computeDueFlags, DueFlags } from '../utils/checkinStatus';

interface Props {
  currentUser: CurrentUser;
  users: NewHireWithProgress[];
}

export default function MyTasksTab({ currentUser, users }: Props) {
  const [flagsByHire, setFlagsByHire] = useState<Record<number, DueFlags>>({});
  const [loading, setLoading] = useState(true);

  // My Tasks is always scoped to who this person is buddy for, regardless of
  // whether they also hold the Admin role — Admin grants Settings access,
  // not a company-wide view here. Team-wide visibility lives in Manage
  // Employees / the Users tab instead.
  const myEmployees = users.filter((u) => u.buddy_name === currentUser.name);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      myEmployees.map((hire) =>
        api
          .getAssignments(hire.id)
          .then((assignments) => [hire.id, computeDueFlags(assignments)] as const)
      )
    ).then((pairs) => {
      if (cancelled) return;
      const map: Record<number, DueFlags> = {};
      for (const [id, flags] of pairs) map[id] = flags;
      setFlagsByHire(map);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, currentUser.name]);

  if (loading) {
    return <div className="empty-state">Loading your team…</div>;
  }

  if (myEmployees.length === 0) {
    return <div className="empty-state">No employees assigned to your team yet.</div>;
  }

  return (
    <div className="settings-panel">
      <p className="settings-panel-note">Employees on your team (buddy: {currentUser.name}).</p>
      <div className="my-tasks-table">
        {myEmployees.map((hire) => {
          const flags = flagsByHire[hire.id];
          return (
            <div key={hire.id} className="my-tasks-row">
              <div className="my-tasks-row-info">
                <span className="my-tasks-row-name">{hire.name}</span>
                <span className="my-tasks-row-meta">
                  {hire.role} · {hire.team ?? 'No team'}
                </span>
              </div>
              <div className="my-tasks-row-progress">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${hire.progress_percent}%` }}
                  />
                </div>
                <span className="progress-label">{hire.progress_percent}%</span>
              </div>
              <div className="my-tasks-row-flags">
                {flags?.weeklyCheckinDue && (
                  <span className="my-tasks-flag my-tasks-flag-checkin">Weekly check-in due</span>
                )}
                {flags?.certificationCallDue && (
                  <span className="my-tasks-flag my-tasks-flag-cert">Certification call due</span>
                )}
                {flags?.certificationComplete && (
                  <span className="my-tasks-flag my-tasks-flag-cert-complete">
                    Certification complete
                  </span>
                )}
                {!flags?.weeklyCheckinDue && !flags?.certificationCallDue && !flags?.certificationComplete && (
                  <span className="my-tasks-flag-none">Nothing due</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
