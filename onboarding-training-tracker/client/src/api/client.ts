import {
  Agenda,
  AgendaWithModules,
  AssignmentStatus,
  AssignmentWithModule,
  CertificationRecommendation,
  EmployeeType,
  Module,
  NewHireStage,
  NewHireWithProgress,
  PermissionRole,
  Team,
} from '../types';

export interface InviteEmailResult {
  sent: boolean;
  reason?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  listAgendas: () => request<Agenda[]>('/agendas'),
  getAgenda: (id: number) => request<AgendaWithModules>(`/agendas/${id}`),
  createAgenda: (data: { name: string; description: string | null }) =>
    request<Agenda>('/agendas', { method: 'POST', body: JSON.stringify(data) }),
  updateAgenda: (id: number, data: { name?: string; description?: string | null }) =>
    request<Agenda>(`/agendas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAgenda: (id: number) => request<void>(`/agendas/${id}`, { method: 'DELETE' }),

  createModule: (
    agendaId: number,
    data: { title: string; description: string | null; category: string }
  ) =>
    request<Module>(`/agendas/${agendaId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateModule: (
    agendaId: number,
    moduleId: number,
    data: Partial<Pick<Module, 'title' | 'description' | 'category' | 'order_index'>>
  ) =>
    request<Module>(`/agendas/${agendaId}/modules/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteModule: (agendaId: number, moduleId: number) =>
    request<void>(`/agendas/${agendaId}/modules/${moduleId}`, { method: 'DELETE' }),

  listNewHires: () => request<NewHireWithProgress[]>('/new-hires'),
  listInactiveNewHires: () => request<NewHireWithProgress[]>('/new-hires?active=0'),
  getNewHire: (id: number) => request<NewHireWithProgress>(`/new-hires/${id}`),
  createNewHire: (data: {
    name: string;
    role: string;
    email: string;
    start_date: string;
    expected_completion_date?: string;
    agenda_id?: number;
    team: Team;
  }) =>
    request<NewHireWithProgress & { invite_email: InviteEmailResult }>('/new-hires', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNewHire: (
    id: number,
    data: Partial<{
      name: string;
      role: string;
      email: string;
      start_date: string;
      stage: NewHireStage;
      employee_type: EmployeeType;
      certification_notes: string | null;
      certification_recommendation: CertificationRecommendation | null;
      certification_training_areas: string[];
      active: boolean;
      permission_roles: PermissionRole[];
      team: Team;
    }>
  ) =>
    request<NewHireWithProgress>(`/new-hires/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deactivateNewHire: (id: number) =>
    request<NewHireWithProgress>(`/new-hires/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    }),
  activateNewHire: (id: number) =>
    request<NewHireWithProgress>(`/new-hires/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: true }),
    }),
  assignAgendaToHire: (
    id: number,
    agenda_id: number,
    start_date: string,
    expected_completion_date: string
  ) =>
    request<NewHireWithProgress & { modules_added: number }>(`/new-hires/${id}/assign-agenda`, {
      method: 'POST',
      body: JSON.stringify({ agenda_id, start_date, expected_completion_date }),
    }),
  updateModuleStage: (id: number, agenda_id: number, stage: NewHireStage) =>
    request<{ new_hire_id: number; agenda_id: number; stage: NewHireStage }>(
      `/new-hires/${id}/module-stage`,
      { method: 'PATCH', body: JSON.stringify({ agenda_id, stage }) }
    ),
  removeModuleFromHire: (id: number, agenda_id: number) =>
    request<NewHireWithProgress>(`/new-hires/${id}/modules/${agenda_id}`, { method: 'DELETE' }),

  getAssignments: (newHireId: number) =>
    request<AssignmentWithModule[]>(`/assignments/new-hire/${newHireId}`),
  updateAssignment: (
    id: number,
    data: Partial<{
      status: AssignmentStatus;
      score: number | null;
      notes: string | null;
      evaluated_by: string | null;
    }>
  ) =>
    request<AssignmentWithModule>(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
