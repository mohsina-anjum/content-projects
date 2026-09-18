import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getAssignmentsForHire } from '../schedule';
import { recomputeAndPersistModuleStage, recomputeAndPersistStage } from '../stage';
import { Assignment, AssignmentStatus } from '../types';

export const assignmentsRouter = Router();

const VALID_STATUSES: AssignmentStatus[] = ['not_started', 'in_progress', 'completed'];

assignmentsRouter.get('/new-hire/:newHireId', (req: Request, res: Response) => {
  const rows = getAssignmentsForHire(req.params.newHireId);
  if (!rows) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }
  res.json(rows);
});

assignmentsRouter.patch('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as
    | Assignment
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }

  const { status, score, notes, evaluated_by } = req.body as {
    status?: AssignmentStatus;
    score?: number | null;
    notes?: string | null;
    evaluated_by?: string | null;
  };

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    return;
  }
  if (score !== undefined && score !== null && (score < 1 || score > 5)) {
    res.status(400).json({ error: 'score must be between 1 and 5' });
    return;
  }

  const nextStatus = status ?? existing.status;
  const completedAt =
    nextStatus === 'completed'
      ? existing.status === 'completed'
        ? existing.completed_at
        : new Date().toISOString()
      : null;

  db.prepare(
    `UPDATE assignments
     SET status = ?, score = ?, notes = ?, evaluated_by = ?, completed_at = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    nextStatus,
    score !== undefined ? score : existing.score,
    notes !== undefined ? notes : existing.notes,
    evaluated_by !== undefined ? evaluated_by : existing.evaluated_by,
    completedAt,
    existing.id
  );

  const moduleAgenda = db
    .prepare('SELECT agenda_id FROM modules WHERE id = ?')
    .get(existing.module_id) as { agenda_id: number } | undefined;

  if (moduleAgenda) {
    recomputeAndPersistModuleStage(existing.new_hire_id, moduleAgenda.agenda_id);
  }
  recomputeAndPersistStage(existing.new_hire_id);

  const rows = getAssignmentsForHire(existing.new_hire_id) ?? [];
  const updated = rows.find((row) => row.id === existing.id);
  res.json(updated);
});
