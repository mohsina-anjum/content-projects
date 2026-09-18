import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AssignmentWithModule, NewHireWithProgress } from '../types';
import ChecklistModulePager from '../components/ChecklistModulePager';
import ModuleGroup from '../components/ModuleGroup';

export default function NewHireChecklistPage() {
  const { hireId } = useParams();
  const [hire, setHire] = useState<NewHireWithProgress | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!hireId) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    Promise.all([api.getNewHire(Number(hireId)), api.getAssignments(Number(hireId))])
      .then(([hireData, assignmentsData]) => {
        if (cancelled) return;
        setHire(hireData);
        setAssignments(assignmentsData);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hireId]);

  function handleAssignmentUpdated(updated: AssignmentWithModule) {
    setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (hireId) {
      api.getNewHire(Number(hireId)).then(setHire);
    }
  }

  const moduleGroups = useMemo(() => {
    const order: number[] = [];
    const map = new Map<number, { name: string; rows: AssignmentWithModule[] }>();
    for (const a of assignments) {
      if (!map.has(a.module_agenda_id)) {
        map.set(a.module_agenda_id, { name: a.module_agenda_name, rows: [] });
        order.push(a.module_agenda_id);
      }
      map.get(a.module_agenda_id)!.rows.push(a);
    }
    return order.map((agendaId) => ({ agendaId, ...map.get(agendaId)! }));
  }, [assignments]);

  if (loading) {
    return <div className="page-loading">Loading your checklist…</div>;
  }

  if (notFound || !hire) {
    return <div className="page-loading">We couldn't find that onboarding checklist.</div>;
  }

  return (
    <div className="checklist-page">
      <div className="checklist-header">
        <div className="checklist-eyebrow">Your Onboarding Checklist</div>
        <h1 className="checklist-hire-name">Welcome, {hire.name}!</h1>
        <div className="checklist-hire-meta">{hire.role}</div>
      </div>

      <div className="checklist-body">
        {moduleGroups.length === 0 && (
          <div className="empty-state">No modules assigned yet — check back soon.</div>
        )}
        {moduleGroups.map(({ agendaId, name, rows }) => {
          const completed = rows.filter((r) => r.status === 'completed').length;
          const stage = rows[0]?.module_stage ?? 'not_started';
          const categoryOrder: string[] = [];
          const sections = rows.reduce<Record<string, AssignmentWithModule[]>>((acc, a) => {
            if (!acc[a.module_category]) categoryOrder.push(a.module_category);
            (acc[a.module_category] ??= []).push(a);
            return acc;
          }, {});
          return (
            <ModuleGroup
              key={agendaId}
              title={name}
              totalTasks={rows.length}
              completedTasks={completed}
              stage={stage}
              startDate={rows[0]?.module_start_date}
              completionDate={rows[0]?.module_expected_completion_date}
              defaultCollapsed={moduleGroups.length > 1}
            >
              <ChecklistModulePager
                sections={sections}
                categoryOrder={categoryOrder}
                onUpdated={handleAssignmentUpdated}
                certificationNotes={hire.certification_notes}
              />
            </ModuleGroup>
          );
        })}
      </div>
    </div>
  );
}
