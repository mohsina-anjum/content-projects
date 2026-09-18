import { db } from './db';
import { getAssignmentsForHire, todayIso } from './schedule';
import { AssignmentWithModule, NewHireStage } from './types';

// A module (or the employee's plan as a whole) is "complete" once every task
// in it is done, "at risk" once its own expected completion date has passed
// without being done, "in progress" once anything in it has been touched,
// and otherwise "not started".
function computeStage(rows: AssignmentWithModule[], expectedCompletionDate: string | null): NewHireStage {
  const total = rows.length;
  if (total === 0) return 'not_started';

  const completed = rows.filter((r) => r.status === 'completed').length;
  const startedAny = rows.some((r) => r.status !== 'not_started');
  const overdue =
    completed < total && expectedCompletionDate !== null && todayIso() > expectedCompletionDate;

  if (completed === total) return 'completed';
  if (overdue) return 'at_risk';
  if (startedAny) return 'in_progress';
  return 'not_started';
}

export function recomputeAndPersistModuleStage(
  newHireId: number | string,
  agendaId: number
): NewHireStage | null {
  const rows = getAssignmentsForHire(newHireId);
  if (!rows) return null;
  const moduleRows = rows.filter((r) => r.module_agenda_id === agendaId);
  const nextStage = computeStage(moduleRows, moduleRows[0]?.module_expected_completion_date ?? null);
  db.prepare(
    'UPDATE hire_modules SET stage = ? WHERE new_hire_id = ? AND agenda_id = ? AND stage != ?'
  ).run(nextStage, newHireId, agendaId, nextStage);
  return nextStage;
}

export function recomputeAllModuleStagesForHire(newHireId: number | string): void {
  const rows = getAssignmentsForHire(newHireId);
  if (!rows) return;
  const agendaIds = [...new Set(rows.map((r) => r.module_agenda_id))];
  for (const agendaId of agendaIds) {
    recomputeAndPersistModuleStage(newHireId, agendaId);
  }
}

// The employee-level stage aggregates across every module they're assigned:
// complete only when everything everywhere is done, at risk if any one
// module is at risk, in progress if anything has been touched, else not
// started. This runs after the per-module recompute above so it reflects
// current per-module stages rather than re-deriving overdue-ness itself.
export function recomputeAndPersistStage(newHireId: number | string): NewHireStage | null {
  const rows = getAssignmentsForHire(newHireId);
  if (!rows) return null;

  const total = rows.length;
  let nextStage: NewHireStage = 'not_started';
  if (total > 0) {
    const completed = rows.filter((r) => r.status === 'completed').length;
    const startedAny = rows.some((r) => r.status !== 'not_started');
    const moduleStages = db
      .prepare('SELECT stage FROM hire_modules WHERE new_hire_id = ?')
      .all(newHireId) as Array<{ stage: NewHireStage }>;
    const anyModuleAtRisk = moduleStages.some((m) => m.stage === 'at_risk');

    if (completed === total) nextStage = 'completed';
    else if (anyModuleAtRisk) nextStage = 'at_risk';
    else if (startedAny) nextStage = 'in_progress';
  }

  db.prepare('UPDATE new_hires SET stage = ? WHERE id = ? AND stage != ?').run(
    nextStage,
    newHireId,
    nextStage
  );
  return nextStage;
}

export function recomputeAllModuleStages(): void {
  const hireIds = db.prepare('SELECT DISTINCT new_hire_id FROM hire_modules').all() as Array<{
    new_hire_id: number;
  }>;
  for (const { new_hire_id } of hireIds) {
    recomputeAllModuleStagesForHire(new_hire_id);
    recomputeAndPersistStage(new_hire_id);
  }
}
