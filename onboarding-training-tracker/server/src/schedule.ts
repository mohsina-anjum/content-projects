import { db } from './db';
import { AssignmentWithModule } from './types';

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Ordered by assignment insertion order (not module.order_index) so that
// modules assigned later — e.g. from a second agenda layered on top of an
// existing employee — always land after their original set, regardless of
// that module's own order_index within its own agenda.
export function getAssignmentsForHire(newHireId: number | string): AssignmentWithModule[] | null {
  const hire = db.prepare('SELECT id FROM new_hires WHERE id = ?').get(newHireId) as
    | { id: number }
    | undefined;
  if (!hire) return null;

  return db
    .prepare(
      `SELECT
        a.*,
        m.title as module_title,
        m.description as module_description,
        m.category as module_category,
        m.order_index as module_order_index,
        m.agenda_id as module_agenda_id,
        ag.name as module_agenda_name,
        ag.has_certification_review as module_has_certification_review,
        hm.stage as module_stage,
        hm.start_date as module_start_date,
        hm.expected_completion_date as module_expected_completion_date
      FROM assignments a
      JOIN modules m ON m.id = a.module_id
      JOIN agendas ag ON ag.id = m.agenda_id
      LEFT JOIN hire_modules hm ON hm.new_hire_id = a.new_hire_id AND hm.agenda_id = m.agenda_id
      WHERE a.new_hire_id = ?
      ORDER BY a.id`
    )
    .all(newHireId) as AssignmentWithModule[];
}
