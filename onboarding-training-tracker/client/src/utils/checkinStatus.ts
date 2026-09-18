import { AssignmentWithModule } from '../types';

function isCategoryComplete(rows: AssignmentWithModule[]): boolean {
  return rows.length > 0 && rows.every((r) => r.status === 'completed');
}

// For each module (agenda) this hire is assigned to, find the section
// they're currently sitting on — the first one, in order, that isn't fully
// complete yet (mirrors the same sequential-unlock rule used on their
// checklist page). That's the section it's "time" for.
function currentSectionPerModule(assignments: AssignmentWithModule[]): string[] {
  const moduleOrder: number[] = [];
  const moduleRows = new Map<number, AssignmentWithModule[]>();
  for (const a of assignments) {
    if (!moduleRows.has(a.module_agenda_id)) {
      moduleRows.set(a.module_agenda_id, []);
      moduleOrder.push(a.module_agenda_id);
    }
    moduleRows.get(a.module_agenda_id)!.push(a);
  }

  const currentSections: string[] = [];
  for (const agendaId of moduleOrder) {
    const rows = moduleRows.get(agendaId)!;
    const categoryOrder: string[] = [];
    const byCategory = new Map<string, AssignmentWithModule[]>();
    for (const a of rows) {
      if (!byCategory.has(a.module_category)) {
        byCategory.set(a.module_category, []);
        categoryOrder.push(a.module_category);
      }
      byCategory.get(a.module_category)!.push(a);
    }
    let current = categoryOrder[categoryOrder.length - 1];
    for (const category of categoryOrder) {
      if (!isCategoryComplete(byCategory.get(category)!)) {
        current = category;
        break;
      }
    }
    if (current !== undefined) currentSections.push(current);
  }
  return currentSections;
}

export interface DueFlags {
  weeklyCheckinDue: boolean;
  certificationCallDue: boolean;
  certificationComplete: boolean;
}

export function computeDueFlags(assignments: AssignmentWithModule[]): DueFlags {
  const currentSections = currentSectionPerModule(assignments);
  const certRows = assignments.filter((a) => a.module_category === 'Certification');
  const certificationComplete = isCategoryComplete(certRows);
  return {
    weeklyCheckinDue: currentSections.some((c) => c.includes('Weekly Check-in with Buddy')),
    certificationCallDue: !certificationComplete && currentSections.some((c) => c === 'Certification'),
    certificationComplete,
  };
}
