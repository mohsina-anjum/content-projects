import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { Agenda, NewHireWithProgress } from '../types';

interface Props {
  hires: NewHireWithProgress[];
  agendas: Agenda[];
  initialHireId?: number;
  onClose: () => void;
  onAssigned: (updated: NewHireWithProgress) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = new Date().toISOString().slice(0, 10);

export default function AssignModulesModal({
  hires,
  agendas,
  initialHireId,
  onClose,
  onAssigned,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedHireId, setSelectedHireId] = useState<number | null>(initialHireId ?? null);
  const [agendaId, setAgendaId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(today);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(() => addDays(today, 14));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const allowEmployeeSearch = initialHireId === undefined;

  const filteredHires = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...hires].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (h) => h.name.toLowerCase().includes(q) || h.role.toLowerCase().includes(q)
    );
  }, [hires, search]);

  const selectedHire = hires.find((h) => h.id === selectedHireId) ?? null;

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (value) setExpectedCompletionDate(addDays(value, 14));
  }

  async function handleAssign() {
    if (!selectedHireId || !agendaId || !startDate || !expectedCompletionDate) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const updated = await api.assignAgendaToHire(
        selectedHireId,
        agendaId as number,
        startDate,
        expectedCompletionDate
      );
      onAssigned(updated);
      const agendaName = agendas.find((a) => a.id === agendaId)?.name ?? 'module';
      setResult(
        updated.modules_added > 0
          ? `Added ${updated.modules_added} task${updated.modules_added === 1 ? '' : 's'} from "${agendaName}".`
          : `${selectedHire?.name} already has every task from "${agendaName}".`
      );
      setAgendaId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign module.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal assign-modules-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Assign Modules</h2>

        {!selectedHire && allowEmployeeSearch && (
          <div className="form">
            <label className="form-field">
              <span>Find Employee</span>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or role…"
              />
            </label>
            <div className="employee-quick-find">
              {filteredHires.length === 0 && (
                <div className="empty-state">No employees match "{search}".</div>
              )}
              {filteredHires.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="employee-quick-find-row"
                  onClick={() => setSelectedHireId(h.id)}
                >
                  <span className="employee-quick-find-name">{h.name}</span>
                  <span className="employee-quick-find-role">{h.role}</span>
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedHire && (
          <div className="form">
            <div className="assign-modules-target">
              Assigning to <strong>{selectedHire.name}</strong> ({selectedHire.role})
              {allowEmployeeSearch && (
                <button
                  type="button"
                  className="assign-modules-change"
                  onClick={() => {
                    setSelectedHireId(null);
                    setResult(null);
                    setError(null);
                  }}
                >
                  Change
                </button>
              )}
            </div>
            <label className="form-field">
              <span>Module to Assign</span>
              <select value={agendaId} onChange={(e) => setAgendaId(Number(e.target.value))}>
                <option value="">Select a module…</option>
                {agendas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Expected Completion Date</span>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
              />
            </label>
            {result && <div className="banner-notice assign-modules-result">{result}</div>}
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Done
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!agendaId || !startDate || !expectedCompletionDate || submitting}
                onClick={handleAssign}
              >
                {submitting ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
