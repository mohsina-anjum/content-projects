export type NewHireStage = 'not_started' | 'in_progress' | 'completed' | 'at_risk';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';

export type EmployeeType = 'new_hire' | 'existing_employee';

export type Team = 'csm' | 'implementation' | 'support';

export type PermissionRole = 'admin' | 'manager' | 'employee';

export type CertificationRecommendation = 'certified' | 'needs_training';

export interface Agenda {
  id: number;
  name: string;
  description: string | null;
  schedule_by_employee_type: number;
  has_certification_review: number;
  created_at: string;
  module_count?: number;
}

export interface Module {
  id: number;
  agenda_id: number;
  title: string;
  description: string | null;
  category: string;
  order_index: number;
  duration_days: number;
  created_at: string;
}

export interface AgendaWithModules extends Agenda {
  modules: Module[];
}

export interface NewHire {
  id: number;
  name: string;
  role: string;
  email: string | null;
  start_date: string;
  agenda_id: number | null;
  stage: NewHireStage;
  employee_type: EmployeeType;
  certification_notes: string | null;
  certification_recommendation: CertificationRecommendation | null;
  active: number;
  team: Team | null;
  buddy_name: string | null;
  created_at: string;
}

export interface HireModuleSummary {
  agenda_id: number;
  agenda_name: string;
  stage: NewHireStage;
  is_primary: boolean;
  start_date: string | null;
  expected_completion_date: string | null;
  total_modules: number;
  completed_modules: number;
  progress_percent: number;
  average_score: number | null;
}

export interface NewHireWithProgress extends NewHire {
  agenda_name: string;
  agenda_has_certification_review: boolean;
  total_modules: number;
  completed_modules: number;
  progress_percent: number;
  average_score: number | null;
  certification_training_areas: string[];
  permission_roles: PermissionRole[];
  modules: HireModuleSummary[];
}

export interface Assignment {
  id: number;
  new_hire_id: number;
  module_id: number;
  status: AssignmentStatus;
  score: number | null;
  notes: string | null;
  evaluated_by: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface AssignmentWithModule extends Assignment {
  module_title: string;
  module_description: string | null;
  module_category: string;
  module_order_index: number;
  module_agenda_id: number;
  module_agenda_name: string;
  module_has_certification_review: number;
  module_stage: NewHireStage | null;
  module_start_date: string | null;
  module_expected_completion_date: string | null;
}

export const STAGES: { key: NewHireStage; label: string }[] = [
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'at_risk', label: 'At Risk' },
];

export const ASSIGNMENT_STATUSES: { key: AssignmentStatus; label: string }[] = [
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export const EMPLOYEE_TYPES: { key: EmployeeType; label: string }[] = [
  { key: 'new_hire', label: 'New Hire' },
  { key: 'existing_employee', label: 'Existing Employee' },
];

export const TEAMS: { key: Team; label: string }[] = [
  { key: 'csm', label: 'CSM' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'support', label: 'Support' },
];

// Each team has one designated buddy who onboards new hires on that team.
export const TEAM_BUDDY: Record<Team, string> = {
  support: 'Abby Fox',
  csm: 'Mahan Karimi',
  implementation: 'Carly Duncan',
};

export const PERMISSION_ROLES: { key: PermissionRole; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'manager', label: 'Manager / Buddy' },
  { key: 'employee', label: 'Employee' },
];

export const CERTIFICATION_RECOMMENDATIONS: { key: CertificationRecommendation; label: string }[] = [
  { key: 'certified', label: 'Certified — Ready for Customer Interactions' },
  { key: 'needs_training', label: 'Needs Additional Training' },
];
