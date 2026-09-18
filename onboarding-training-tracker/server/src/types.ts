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
  certification_training_areas: string | null;
  active: number;
  team: Team | null;
  buddy_name: string | null;
  permission_roles: string;
  created_at: string;
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

export interface NewHireWithProgress
  extends Omit<NewHire, 'certification_training_areas' | 'permission_roles'> {
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
