import { useEffect, useMemo, useState } from 'react';
import { AssignmentWithModule, NewHireStage, NewHireWithProgress } from '../types';
import { api } from '../api/client';
import AssignmentRow from './AssignmentRow';
import CertificationReview from './CertificationReview';
import CollapsibleSection from './CollapsibleSection';
import ModuleGroup from './ModuleGroup';

interface Props {
  hire: NewHireWithProgress;
  onClose: () => void;
  onAssignmentsChanged: () => void;
  onHireUpdated: (updated: NewHireWithProgress) => void;
  onAssignModules: () => void;
  onDeactivate: () => void;
}

export default function NewHireDrawer({
  hire,
  onClose,
  onAssignmentsChanged,
  onHireUpdated,
  onAssignModules,
  onDeactivate,
}: Props) {
  const [assignments, setAssignments] = useState<AssignmentWithModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getAssignments(hire.id).then((data) => {
      if (!cancelled) {
        setAssignments(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // total_modules is included so a newly-assigned module (added from
    // elsewhere in the app) refetches this hire's task list.
  }, [hire.id, hire.total_modules]);

  function handleAssignmentUpdated(updated: AssignmentWithModule) {
    setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    onAssignmentsChanged();
  }

  async function handleModuleStageChange(agendaId: number, stage: NewHireStage) {
    await api.updateModuleStage(hire.id, agendaId, stage);
    setAssignments((prev) =>
      prev.map((a) => (a.module_agenda_id === agendaId ? { ...a, module_stage: stage } : a))
    );
  }

  async function handleRemoveModule(agendaId: number, moduleName: string) {
    if (
      !confirm(
        `Remove "${moduleName}" from ${hire.name}? Only use this to undo an incorrect assignment.`
      )
    ) {
      return;
    }
    const updated = await api.removeModuleFromHire(hire.id, agendaId);
    setAssignments((prev) => prev.filter((a) => a.module_agenda_id !== agendaId));
    onHireUpdated(updated);
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

  const primaryModuleSections = useMemo(() => {
    const seen: string[] = [];
    for (const a of assignments) {
      if (a.module_agenda_id === hire.agenda_id && !seen.includes(a.module_category)) {
        seen.push(a.module_category);
      }
    }
    return seen;
  }, [assignments, hire.agenda_id]);

  const multipleModules = moduleGroups.length > 1;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="drawer-header">
          <h2 className="drawer-name">{hire.name}</h2>
          <div className="drawer-meta">
            {hire.role} · Starts {formatDate(hire.start_date)} · {hire.agenda_name}
            {hire.buddy_name && <> · Buddy: {hire.buddy_name}</>}
          </div>
          <div className="drawer-header-actions">
            <a
              className="drawer-checklist-link"
              href={`/checklist/${hire.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View what {hire.name.split(' ')[0]} sees →
            </a>
            <button type="button" className="drawer-assign-link" onClick={onAssignModules}>
              + Assign more modules
            </button>
            <button type="button" className="drawer-delete-link" onClick={onDeactivate}>
              Deactivate employee
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {loading && <div className="empty-state">Loading tasks…</div>}
          {!loading && moduleGroups.length === 0 && (
            <div className="empty-state">No modules assigned.</div>
          )}
          {moduleGroups.map(({ agendaId, name, rows }) => {
            const completed = rows.filter((r) => r.status === 'completed').length;
            const stage = rows[0]?.module_stage ?? 'not_started';
            const sections = rows.reduce<Record<string, AssignmentWithModule[]>>((acc, a) => {
              (acc[a.module_category] ??= []).push(a);
              return acc;
            }, {});
            const isPrimaryModule = agendaId === hire.agenda_id;
            return (
              <ModuleGroup
                key={agendaId}
                title={name}
                totalTasks={rows.length}
                completedTasks={completed}
                stage={stage}
                onStageChange={(next) => handleModuleStageChange(agendaId, next)}
                startDate={rows[0]?.module_start_date}
                completionDate={rows[0]?.module_expected_completion_date}
                defaultCollapsed={multipleModules}
                onRemove={
                  agendaId !== hire.agenda_id
                    ? () => handleRemoveModule(agendaId, name)
                    : undefined
                }
              >
                {Object.entries(sections).map(([section, sectionRows]) => {
                  const completed = sectionRows.filter((r) => r.status === 'completed').length;
                  return (
                    <CollapsibleSection
                      key={section}
                      level="section"
                      className={section === 'Introduction' ? 'collapsible-section-intro' : undefined}
                      defaultCollapsed={completed === sectionRows.length}
                      title={section === 'Introduction' ? 'Start Here' : section}
                      meta={`${completed}/${sectionRows.length}`}
                    >
                      {sectionRows.map((assignment) => (
                        <AssignmentRow
                          key={assignment.id}
                          assignment={assignment}
                          onUpdated={handleAssignmentUpdated}
                        />
                      ))}
                    </CollapsibleSection>
                  );
                })}

                {isPrimaryModule && hire.agenda_has_certification_review && (
                  <CertificationReview
                    hire={hire}
                    categories={primaryModuleSections}
                    onUpdated={onHireUpdated}
                  />
                )}
              </ModuleGroup>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
