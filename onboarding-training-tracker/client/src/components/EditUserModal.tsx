import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Agenda,
  AssignmentWithModule,
  NewHireWithProgress,
  PERMISSION_ROLES,
  PermissionRole,
  STAGES,
  Team,
  TEAM_BUDDY,
  TEAMS,
} from '../types';
import { ineligibleReason, moduleOptionsFor } from '../utils/moduleOptions';

interface Props {
  hire: NewHireWithProgress;
  agendas: Agenda[];
  canEditRoles: boolean;
  onClose: () => void;
  onSaved: (updated: NewHireWithProgress) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = new Date().toISOString().slice(0, 10);

interface ProfileFields {
  name: string;
  role: string;
  email: string;
  team: Team | '';
  roles: PermissionRole[];
}

function rolesKey(roles: PermissionRole[]): string {
  return [...roles].sort().join(',');
}

function profileFieldsOf(hire: NewHireWithProgress): ProfileFields {
  return {
    name: hire.name,
    role: hire.role,
    email: hire.email ?? '',
    team: hire.team ?? '',
    roles: hire.permission_roles,
  };
}

export default function EditUserModal({ hire, agendas, canEditRoles, onClose, onSaved }: Props) {
  const [name, setName] = useState(hire.name);
  const [role, setRole] = useState(hire.role);
  const [email, setEmail] = useState(hire.email ?? '');
  const [team, setTeam] = useState<Team | ''>(hire.team ?? '');
  const [roles, setRoles] = useState<PermissionRole[]>(hire.permission_roles);
  const [savedFields, setSavedFields] = useState<ProfileFields>(() => profileFieldsOf(hire));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    name !== savedFields.name ||
    role !== savedFields.role ||
    email !== savedFields.email ||
    team !== savedFields.team ||
    rolesKey(roles) !== rolesKey(savedFields.roles);

  function toggleRole(role: PermissionRole) {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.length > 1
          ? prev.filter((r) => r !== role)
          : prev
        : [...prev, role]
    );
  }

  const [currentHire, setCurrentHire] = useState(hire);
  const [assignments, setAssignments] = useState<AssignmentWithModule[] | null>(null);
  const [removingAgendaId, setRemovingAgendaId] = useState<number | null>(null);

  const [assignAgendaId, setAssignAgendaId] = useState<number | ''>('');
  const [assignStartDate, setAssignStartDate] = useState(today);
  const [assignEndDate, setAssignEndDate] = useState(() => addDays(today, 14));
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  useEffect(() => {
    api.getAssignments(hire.id).then(setAssignments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hire.id]);

  const moduleOptions = assignments ? moduleOptionsFor(assignments, currentHire) : [];
  const unassignedAgendas = agendas.filter(
    (a) => !moduleOptions.some((opt) => opt.agendaId === a.id)
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !email.trim() || !team) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateNewHire(hire.id, {
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        team,
        ...(canEditRoles ? { permission_roles: roles } : {}),
      });
      setCurrentHire(updated);
      setSavedFields(profileFieldsOf(updated));
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleAssignStartDateChange(value: string) {
    setAssignStartDate(value);
    if (value) setAssignEndDate(addDays(value, 14));
  }

  async function handleAssignModule() {
    if (!assignAgendaId || !assignStartDate || !assignEndDate) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const updated = await api.assignAgendaToHire(
        hire.id,
        assignAgendaId as number,
        assignStartDate,
        assignEndDate
      );
      setCurrentHire(updated);
      onSaved(updated);
      const agendaName = agendas.find((a) => a.id === assignAgendaId)?.name ?? 'module';
      setAssignResult(`Added "${agendaName}".`);
      setAssignAgendaId('');
      const refreshed = await api.getAssignments(hire.id);
      setAssignments(refreshed);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveModule(agendaId: number, name: string) {
    if (!confirm(`Remove "${name}" from ${currentHire.name}? Only use this to undo an incorrect assignment.`)) {
      return;
    }
    setRemovingAgendaId(agendaId);
    try {
      const updated = await api.removeModuleFromHire(hire.id, agendaId);
      setCurrentHire(updated);
      onSaved(updated);
      setAssignments((prev) => prev?.filter((a) => a.module_agenda_id !== agendaId) ?? prev);
    } finally {
      setRemovingAgendaId(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-user-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit {hire.name}</h2>

        <form onSubmit={handleSubmit} className="form">
          <label className="form-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label className="form-field">
            <span>Role</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@builderprime.com"
            />
          </label>
          <label className="form-field">
            <span>Team</span>
            <select value={team} onChange={(e) => setTeam(e.target.value as Team)}>
              <option value="">Select a team…</option>
              {TEAMS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            {team && (
              <span className="form-field-note">
                Buddy: {TEAM_BUDDY[team]} (assigned automatically based on team)
              </span>
            )}
          </label>
          <div className="form-field">
            <span>Roles</span>
            <div className="edit-user-roles">
              {PERMISSION_ROLES.map((r) => (
                <label key={r.key} className="edit-user-role-checkbox">
                  <input
                    type="checkbox"
                    checked={roles.includes(r.key)}
                    disabled={!canEditRoles}
                    onChange={() => toggleRole(r.key)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <span className="form-field-note">
              {canEditRoles
                ? 'Someone can hold more than one role — e.g. Admin and Manager/Buddy.'
                : 'Only Admins can change roles.'}
            </span>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !isDirty}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="edit-user-modules">
          <h3 className="edit-user-section-title">Modules</h3>
          {assignments === null && <div className="empty-state">Loading modules…</div>}
          {assignments !== null && moduleOptions.length === 0 && (
            <div className="empty-state">No modules assigned.</div>
          )}
          {moduleOptions.length > 0 && (
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
                      {reason && <span className="remove-modules-row-reason">{reason}</span>}
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      disabled={!!reason || removingAgendaId === opt.agendaId}
                      onClick={() => handleRemoveModule(opt.agendaId, opt.name)}
                    >
                      {removingAgendaId === opt.agendaId ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {unassignedAgendas.length > 0 && (
            <div className="edit-user-assign-module">
              <label className="form-field">
                <span>+ Assign another module</span>
                <select
                  value={assignAgendaId}
                  onChange={(e) => setAssignAgendaId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select a module…</option>
                  {unassignedAgendas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              {assignAgendaId && (
                <>
                  <label className="form-field">
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={assignStartDate}
                      onChange={(e) => handleAssignStartDateChange(e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Expected Completion Date</span>
                    <input
                      type="date"
                      value={assignEndDate}
                      onChange={(e) => setAssignEndDate(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    disabled={assigning}
                    onClick={handleAssignModule}
                  >
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </>
              )}
              {assignResult && <div className="banner-notice">{assignResult}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
