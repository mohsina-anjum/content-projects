import { AssignmentWithModule, NewHireStage, NewHireWithProgress, STAGES } from '../types';

export interface ModuleOption {
  agendaId: number;
  name: string;
  stage: NewHireStage;
  isPrimary: boolean;
  total: number;
  completed: number;
}

export function moduleOptionsFor(
  assignments: AssignmentWithModule[],
  hire: NewHireWithProgress
): ModuleOption[] {
  const order: number[] = [];
  const map = new Map<number, ModuleOption>();
  for (const a of assignments) {
    if (!map.has(a.module_agenda_id)) {
      map.set(a.module_agenda_id, {
        agendaId: a.module_agenda_id,
        name: a.module_agenda_name,
        stage: a.module_stage ?? 'not_started',
        isPrimary: a.module_agenda_id === hire.agenda_id,
        total: 0,
        completed: 0,
      });
      order.push(a.module_agenda_id);
    }
    const entry = map.get(a.module_agenda_id)!;
    entry.total += 1;
    if (a.status === 'completed') entry.completed += 1;
  }
  return order.map((id) => map.get(id)!);
}

export function ineligibleReason(opt: ModuleOption): string | null {
  if (opt.isPrimary) return "Can't remove — this is their primary module.";
  if (opt.stage !== 'not_started') {
    const label = STAGES.find((s) => s.key === opt.stage)?.label ?? opt.stage;
    return `Can't remove — already ${label}.`;
  }
  return null;
}
