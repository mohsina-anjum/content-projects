import { FormEvent, useState } from 'react';
import { Agenda, Team, TEAM_BUDDY, TEAMS } from '../types';

interface Props {
  agendas: Agenda[];
  onClose: () => void;
  onCreate: (data: {
    name: string;
    role: string;
    email: string;
    start_date: string;
    expected_completion_date?: string;
    agenda_id?: number;
    team: Team;
  }) => Promise<void>;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewHireFormModal({ agendas, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(() =>
    addDays(new Date().toISOString().slice(0, 10), 14)
  );
  const [agendaId, setAgendaId] = useState<number | ''>('');
  const [team, setTeam] = useState<Team | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (value) setExpectedCompletionDate(addDays(value, 14));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !name.trim() ||
      !role.trim() ||
      !email.trim() ||
      !startDate ||
      !team ||
      (agendaId && !expectedCompletionDate)
    ) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        start_date: startDate,
        expected_completion_date: agendaId ? expectedCompletionDate : undefined,
        agenda_id: agendaId ? (agendaId as number) : undefined,
        team,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new employee.');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Employee</h2>
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
          <label className="form-field">
            <span>Module</span>
            <select
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">No module assigned yet</option>
              {agendas.map((agenda) => (
                <option key={agenda.id} value={agenda.id}>
                  {agenda.name}
                </option>
              ))}
            </select>
            <span className="form-field-note">
              {agendaId
                ? "If you're adding a new employee to this module, give them a 1 week timeframe to finish it. If you're assigning this module to an existing employee, give them a 2 week timeframe."
                : 'You can assign a module anytime later from Edit User in Settings > Users.'}
            </span>
          </label>
          <label className="form-field">
            <span>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </label>
          {agendaId && (
            <label className="form-field">
              <span>Expected Completion Date</span>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
              />
            </label>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
