import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import {
  Agenda,
  HireModuleSummary,
  NewHireStage,
  NewHireWithProgress,
  STAGES,
  Team,
  TEAMS,
} from '../types';
import NewHireCard from '../components/NewHireCard';
import NewHireFormModal from '../components/NewHireFormModal';
import NewHireDrawer from '../components/NewHireDrawer';
import AssignModulesModal from '../components/AssignModulesModal';
import ManageEmployeesModal from '../components/ManageEmployeesModal';

type TeamFilter = Team | 'all';

export default function BoardPage() {
  const [hires, setHires] = useState<NewHireWithProgress[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHireId, setSelectedHireId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ initialHireId?: number } | null>(null);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [hiresData, agendasData] = await Promise.all([api.listNewHires(), api.listAgendas()]);
      setHires(hiresData);
      setAgendas(agendasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: {
    name: string;
    role: string;
    email: string;
    start_date: string;
    expected_completion_date?: string;
    agenda_id?: number;
    team: Team;
  }) {
    const created = await api.createNewHire(data);
    setHires((prev) => [...prev, created]);
    setShowForm(false);

    const checklistLink = `${window.location.origin}/checklist/${created.id}`;
    if (created.invite_email.reason === 'no_module_assigned') {
      setNotice(
        `${created.name} added with no module assigned yet — assign one anytime from Edit User in Settings > Users.`
      );
    } else if (created.invite_email.sent) {
      setNotice(`${created.name} added — invite email sent to ${created.email}.`);
    } else if (created.invite_email.reason === 'no_email_on_file') {
      setNotice(`${created.name} added — no email on file, so share their checklist link manually: ${checklistLink}`);
    } else if (created.invite_email.reason === 'smtp_not_configured') {
      setNotice(`${created.name} added — email delivery isn't configured yet, so share this link manually: ${checklistLink}`);
    } else {
      setNotice(`${created.name} added, but the invite email failed to send. Share this link manually: ${checklistLink}`);
    }
  }

  async function refreshSelectedHire() {
    if (selectedHireId === null) return;
    const updated = await api.updateNewHire(selectedHireId, {});
    setHires((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  }

  function handleHireUpdated(updated: NewHireWithProgress) {
    setHires((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  }

  async function handleDeactivateHire(hire: NewHireWithProgress) {
    if (
      !confirm(
        `Deactivate ${hire.name}? They'll be taken off the active board, but their profile and recorded progress are kept.`
      )
    ) {
      return;
    }
    await api.deactivateNewHire(hire.id);
    setHires((prev) => prev.filter((h) => h.id !== hire.id));
    setSelectedHireId(null);
    setNotice(`${hire.name} was deactivated.`);
  }

  function handleEmployeeDeactivated(hireId: number) {
    const deactivated = hires.find((h) => h.id === hireId);
    setHires((prev) => prev.filter((h) => h.id !== hireId));
    if (selectedHireId === hireId) setSelectedHireId(null);
    if (deactivated) setNotice(`${deactivated.name} was deactivated.`);
  }

  function handleEmployeeActivated(updated: NewHireWithProgress) {
    setHires((prev) => [...prev, updated]);
    setNotice(`${updated.name} was activated.`);
  }

  const filteredHires = useMemo(
    () => (teamFilter === 'all' ? hires : hires.filter((h) => h.team === teamFilter)),
    [hires, teamFilter]
  );

  // Employees with no module assigned yet aren't on the board (no columns to
  // put them in), so they shouldn't skew the metrics either — otherwise an
  // unstarted employee just drags Avg. Completion down for no reason.
  const stats = useMemo(() => {
    const withModules = filteredHires.filter((h) => h.total_modules > 0);
    const total = withModules.length;
    const avgCompletion =
      total > 0
        ? Math.round(withModules.reduce((sum, h) => sum + h.progress_percent, 0) / total)
        : 0;
    const atRisk = withModules.filter((h) => h.stage === 'at_risk').length;
    return { total, avgCompletion, atRisk };
  }, [filteredHires]);

  const columns = useMemo(() => {
    const map: Record<NewHireStage, { hire: NewHireWithProgress; module: HireModuleSummary }[]> = {
      not_started: [],
      in_progress: [],
      completed: [],
      at_risk: [],
    };
    for (const hire of filteredHires) {
      for (const module of hire.modules) {
        map[module.stage].push({ hire, module });
      }
    }
    return map;
  }, [filteredHires]);

  const selectedHire = hires.find((h) => h.id === selectedHireId) ?? null;

  if (loading) {
    return <div className="page-loading">Loading board…</div>;
  }

  return (
    <div className="board-page">
      {error && <div className="banner-error">{error}</div>}
      {notice && (
        <div className="banner-notice">
          {notice}
          <button type="button" className="banner-dismiss" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      <div className="board-header">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">New Hires</div>
          <div className="stat-card-tooltip">
            Total number of employees currently on the board.
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgCompletion}%</div>
          <div className="stat-label">Avg. Completion</div>
          <div className="stat-card-tooltip">
            Each employee's percent of tasks completed across all of their assigned modules,
            averaged across everyone on the board.
          </div>
        </div>
        <div className="stat-card at-risk">
          <div className="stat-value">{stats.atRisk}</div>
          <div className="stat-label">At Risk</div>
          <div className="stat-card-tooltip">
            Employees with at least one module that's overdue — still incomplete past its
            expected completion date.
          </div>
        </div>
        <label className="board-team-filter">
          <span>Filter by Team</span>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value as TeamFilter)}>
            <option value="all">All</option>
            {TEAMS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <ManageEmployeesModal
          hires={hires}
          onAddEmployee={() => setShowForm(true)}
          onEmployeeDeactivated={handleEmployeeDeactivated}
          onEmployeeActivated={handleEmployeeActivated}
          onModuleRemoved={handleHireUpdated}
        />
      </div>

      <div className="board-columns">
        {STAGES.map((stage) => (
          <div className="board-column" key={stage.key}>
            <div className="board-column-header">
              <span>{stage.label}</span>
              <span className="column-count">{columns[stage.key].length}</span>
            </div>
            <div className="board-column-body">
              {columns[stage.key].map(({ hire, module }) => (
                <NewHireCard
                  key={`${hire.id}-${module.agenda_id}`}
                  hire={hire}
                  module={module}
                  onClick={() => setSelectedHireId(hire.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <NewHireFormModal
          agendas={agendas}
          onClose={() => setShowForm(false)}
          onCreate={handleCreate}
        />
      )}

      {selectedHire && (
        <NewHireDrawer
          hire={selectedHire}
          onClose={() => setSelectedHireId(null)}
          onAssignmentsChanged={refreshSelectedHire}
          onHireUpdated={handleHireUpdated}
          onAssignModules={() => setAssignModal({ initialHireId: selectedHire.id })}
          onDeactivate={() => handleDeactivateHire(selectedHire)}
        />
      )}

      {assignModal && (
        <AssignModulesModal
          hires={hires}
          agendas={agendas}
          initialHireId={assignModal.initialHireId}
          onClose={() => setAssignModal(null)}
          onAssigned={handleHireUpdated}
        />
      )}
    </div>
  );
}
