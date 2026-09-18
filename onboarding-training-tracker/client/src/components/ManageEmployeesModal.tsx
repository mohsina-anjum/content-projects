import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AssignmentWithModule, NewHireWithProgress, STAGES } from '../types';
import { ineligibleReason, ModuleOption, moduleOptionsFor } from '../utils/moduleOptions';
import Chevron from './Chevron';

interface Props {
  hires: NewHireWithProgress[];
  onAddEmployee: () => void;
  onEmployeeDeactivated: (hireId: number) => void;
  onEmployeeActivated: (updated: NewHireWithProgress) => void;
  onModuleRemoved: (updated: NewHireWithProgress) => void;
}

export default function ManageEmployeesModal({
  hires,
  onAddEmployee,
  onEmployeeDeactivated,
  onEmployeeActivated,
  onModuleRemoved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [assignmentsByHire, setAssignmentsByHire] = useState<
    Record<number, AssignmentWithModule[] | undefined>
  >({});
  const [loadingHireId, setLoadingHireId] = useState<number | null>(null);
  const [removingAgendaId, setRemovingAgendaId] = useState<number | null>(null);
  const [inactiveHires, setInactiveHires] = useState<NewHireWithProgress[]>([]);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const sortedHires = [...hires].sort((a, b) => a.name.localeCompare(b.name));
  const sortedInactiveHires = [...inactiveHires].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (!open) return;
    api.listInactiveNewHires().then(setInactiveHires);
  }, [open]);

  async function toggleExpanded(hire: NewHireWithProgress) {
    if (expandedId === hire.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(hire.id);
    if (!assignmentsByHire[hire.id]) {
      setLoadingHireId(hire.id);
      const data = await api.getAssignments(hire.id);
      setAssignmentsByHire((prev) => ({ ...prev, [hire.id]: data }));
      setLoadingHireId(null);
    }
  }

  function handleDeactivateEmployee(hire: NewHireWithProgress) {
    if (
      !confirm(
        `Deactivate ${hire.name}? They'll be taken off the active board, but their profile and recorded progress are kept.`
      )
    ) {
      return;
    }
    api.deactivateNewHire(hire.id).then((updated) => {
      onEmployeeDeactivated(hire.id);
      setInactiveHires((prev) => [...prev, updated]);
    });
  }

  async function handleActivateEmployee(hire: NewHireWithProgress) {
    setActivatingId(hire.id);
    try {
      const updated = await api.activateNewHire(hire.id);
      setInactiveHires((prev) => prev.filter((h) => h.id !== hire.id));
      onEmployeeActivated(updated);
    } finally {
      setActivatingId(null);
    }
  }

  async function handleRemoveModule(hire: NewHireWithProgress, opt: ModuleOption) {
    if (
      !confirm(`Remove "${opt.name}" from ${hire.name}? Only use this to undo an incorrect assignment.`)
    ) {
      return;
    }
    setRemovingAgendaId(opt.agendaId);
    try {
      const updated = await api.removeModuleFromHire(hire.id, opt.agendaId);
      onModuleRemoved(updated);
      setAssignmentsByHire((prev) => ({
        ...prev,
        [hire.id]: prev[hire.id]?.filter((a) => a.module_agenda_id !== opt.agendaId),
      }));
    } finally {
      setRemovingAgendaId(null);
    }
  }

  function handleAddEmployee() {
    setOpen(false);
    onAddEmployee();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
      >
        Manage Employees
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal manage-employees-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Manage Employees</h2>

            <button
              type="button"
              className="btn btn-primary manage-employees-add-btn"
              onClick={handleAddEmployee}
            >
              + Add Employee
            </button>

            <div className="manage-employees-list">
              {sortedHires.length === 0 && (
                <div className="empty-state">No employees yet.</div>
              )}
              {sortedHires.map((hire) => {
                const expanded = expandedId === hire.id;
                const assignments = assignmentsByHire[hire.id];
                const moduleOptions = assignments ? moduleOptionsFor(assignments, hire) : [];
                return (
                  <div key={hire.id} className="manage-employees-employee">
                    <div className="manage-employees-employee-header">
                      <button
                        type="button"
                        className="manage-employees-employee-toggle"
                        onClick={() => toggleExpanded(hire)}
                        aria-expanded={expanded}
                      >
                        <Chevron open={expanded} className="manage-employees-employee-chevron" />
                        <span className="manage-employees-employee-info">
                          <span className="manage-employees-employee-name">{hire.name}</span>
                          <span className="manage-employees-employee-role">{hire.role}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="manage-employees-employee-remove"
                        onClick={() => handleDeactivateEmployee(hire)}
                      >
                        Deactivate
                      </button>
                    </div>

                    {expanded && (
                      <div className="manage-employees-employee-body">
                        {loadingHireId === hire.id && (
                          <div className="empty-state">Loading modules…</div>
                        )}
                        {loadingHireId !== hire.id && moduleOptions.length === 0 && (
                          <div className="empty-state">No modules assigned.</div>
                        )}
                        {loadingHireId !== hire.id && moduleOptions.length > 0 && (
                          <div className="remove-modules-list">
                            {moduleOptions.map((opt) => {
                              const reason = ineligibleReason(opt);
                              return (
                                <div key={opt.agendaId} className="remove-modules-row">
                                  <div className="remove-modules-row-info">
                                    <span className="remove-modules-row-name">{opt.name}</span>
                                    <span className="remove-modules-row-progress">
                                      {opt.completed}/{opt.total} ·{' '}
                                      {STAGES.find((s) => s.key === opt.stage)?.label ?? opt.stage}
                                    </span>
                                    {reason && (
                                      <span className="remove-modules-row-reason">{reason}</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-small"
                                    disabled={!!reason || removingAgendaId === opt.agendaId}
                                    onClick={() => handleRemoveModule(hire, opt)}
                                  >
                                    {removingAgendaId === opt.agendaId ? 'Removing…' : 'Remove'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {sortedInactiveHires.length > 0 && (
                <>
                  <div className="manage-employees-section-header">
                    Deactivated ({sortedInactiveHires.length})
                  </div>
                  {sortedInactiveHires.map((hire) => (
                    <div key={hire.id} className="manage-employees-employee manage-employees-employee-inactive">
                      <div className="manage-employees-employee-header">
                        <span className="manage-employees-employee-info manage-employees-employee-info-static">
                          <span className="manage-employees-employee-name">{hire.name}</span>
                          <span className="manage-employees-employee-role">{hire.role}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-success btn-small"
                          disabled={activatingId === hire.id}
                          onClick={() => handleActivateEmployee(hire)}
                        >
                          {activatingId === hire.id ? 'Activating…' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
