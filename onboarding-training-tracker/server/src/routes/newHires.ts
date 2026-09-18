import { Router, Request, Response } from 'express';
import { db } from '../db';
import { sendChecklistInviteEmail } from '../email';
import { recomputeAndPersistModuleStage, recomputeAndPersistStage } from '../stage';
import {
  CertificationRecommendation,
  EmployeeType,
  NewHire,
  NewHireStage,
  NewHireWithProgress,
  PermissionRole,
  Team,
} from '../types';

export const newHiresRouter = Router();

const VALID_STAGES: NewHireStage[] = ['not_started', 'in_progress', 'completed', 'at_risk'];
const VALID_EMPLOYEE_TYPES: EmployeeType[] = ['new_hire', 'existing_employee'];
const VALID_CERT_RECOMMENDATIONS: CertificationRecommendation[] = ['certified', 'needs_training'];
const VALID_TEAMS: Team[] = ['csm', 'implementation', 'support'];
const VALID_PERMISSION_ROLES: PermissionRole[] = ['admin', 'manager', 'employee'];

// Each team has one designated buddy who onboards new hires on that team.
const TEAM_BUDDY: Record<Team, string> = {
  support: 'Abby Fox',
  csm: 'Mahan Karimi',
  implementation: 'Carly Duncan',
};

function parsePermissionRoles(raw: string | null | undefined): PermissionRole[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const roles = parsed.filter((r): r is PermissionRole => VALID_PERMISSION_ROLES.includes(r));
        if (roles.length > 0) return roles;
      }
    } catch {
      // fall through to default below
    }
  }
  return ['employee'];
}

function withProgress(hire: NewHire): NewHireWithProgress {
  const agenda =
    hire.agenda_id !== null
      ? (db
          .prepare('SELECT name, has_certification_review FROM agendas WHERE id = ?')
          .get(hire.agenda_id) as { name: string; has_certification_review: number } | undefined)
      : undefined;
  const stats = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN score IS NOT NULL THEN score ELSE NULL END) as avgScore
      FROM assignments WHERE new_hire_id = ?`
    )
    .get(hire.id) as { total: number; completed: number; avgScore: number | null };

  const total = stats.total ?? 0;
  const completed = stats.completed ?? 0;

  let trainingAreas: string[] = [];
  if (hire.certification_training_areas) {
    try {
      trainingAreas = JSON.parse(hire.certification_training_areas);
    } catch {
      trainingAreas = [];
    }
  }

  const moduleRows = db
    .prepare(
      `SELECT hm.agenda_id as agenda_id, ag.name as agenda_name, hm.stage as stage,
        hm.start_date as start_date, hm.expected_completion_date as expected_completion_date,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN a.score IS NOT NULL THEN a.score ELSE NULL END) as avgScore
      FROM hire_modules hm
      JOIN agendas ag ON ag.id = hm.agenda_id
      LEFT JOIN modules m ON m.agenda_id = hm.agenda_id
      LEFT JOIN assignments a ON a.module_id = m.id AND a.new_hire_id = hm.new_hire_id
      WHERE hm.new_hire_id = ?
      GROUP BY hm.agenda_id
      ORDER BY hm.id`
    )
    .all(hire.id) as Array<{
    agenda_id: number;
    agenda_name: string;
    stage: NewHireStage;
    start_date: string | null;
    expected_completion_date: string | null;
    total: number;
    completed: number;
    avgScore: number | null;
  }>;

  const modules = moduleRows.map((m) => ({
    agenda_id: m.agenda_id,
    agenda_name: m.agenda_name,
    stage: m.stage,
    is_primary: m.agenda_id === hire.agenda_id,
    start_date: m.start_date,
    expected_completion_date: m.expected_completion_date,
    total_modules: m.total ?? 0,
    completed_modules: m.completed ?? 0,
    progress_percent: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
    average_score: m.avgScore !== null ? Math.round(m.avgScore * 10) / 10 : null,
  }));

  const {
    certification_training_areas: _rawAreas,
    permission_roles: rawPermissionRoles,
    permission_role: _legacyPermissionRole,
    ...rest
  } = hire as NewHire & { permission_role?: string };

  return {
    ...rest,
    certification_training_areas: trainingAreas,
    permission_roles: parsePermissionRoles(rawPermissionRoles),
    agenda_name: agenda?.name ?? 'No module assigned',
    agenda_has_certification_review: !!agenda?.has_certification_review,
    total_modules: total,
    completed_modules: completed,
    progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    average_score: stats.avgScore !== null ? Math.round(stats.avgScore * 10) / 10 : null,
    modules,
  };
}

newHiresRouter.get('/', (req: Request, res: Response) => {
  const activeParam = req.query.active === '0' ? 0 : 1;
  const hires = db
    .prepare('SELECT * FROM new_hires WHERE active = ? ORDER BY created_at')
    .all(activeParam) as NewHire[];
  res.json(hires.map(withProgress));
});

newHiresRouter.get('/:id', (req: Request, res: Response) => {
  const hire = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(req.params.id) as
    | NewHire
    | undefined;
  if (!hire) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }
  res.json(withProgress(hire));
});

newHiresRouter.post('/', async (req: Request, res: Response) => {
  const { name, role, email, start_date, expected_completion_date, agenda_id, employee_type, team } =
    req.body as {
      name?: string;
      role?: string;
      email?: string;
      start_date?: string;
      expected_completion_date?: string;
      agenda_id?: number;
      employee_type?: EmployeeType;
      team?: Team;
    };

  if (!name?.trim() || !role?.trim() || !start_date || !team) {
    res.status(400).json({
      error: 'name, role, start_date, and team are required',
    });
    return;
  }
  if (agenda_id && !expected_completion_date) {
    res.status(400).json({ error: 'expected_completion_date is required when agenda_id is set' });
    return;
  }
  if (employee_type !== undefined && !VALID_EMPLOYEE_TYPES.includes(employee_type)) {
    res.status(400).json({ error: `employee_type must be one of ${VALID_EMPLOYEE_TYPES.join(', ')}` });
    return;
  }
  if (!VALID_TEAMS.includes(team)) {
    res.status(400).json({ error: `team must be one of ${VALID_TEAMS.join(', ')}` });
    return;
  }

  let agenda: { id: number; name: string } | undefined;
  if (agenda_id) {
    agenda = db.prepare('SELECT id, name FROM agendas WHERE id = ?').get(agenda_id) as
      | { id: number; name: string }
      | undefined;
    if (!agenda) {
      res.status(400).json({ error: 'agenda_id does not reference an existing agenda' });
      return;
    }
  }

  const buddyName = TEAM_BUDDY[team];

  const insertHire = db.prepare(
    'INSERT INTO new_hires (name, role, email, start_date, agenda_id, stage, employee_type, team, buddy_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = insertHire.run(
    name.trim(),
    role.trim(),
    email?.trim() || null,
    start_date,
    agenda_id ?? null,
    'not_started',
    employee_type ?? 'new_hire',
    team,
    buddyName
  );
  const hireId = result.lastInsertRowid as number;

  if (agenda) {
    const modules = db
      .prepare('SELECT id FROM modules WHERE agenda_id = ?')
      .all(agenda_id) as Array<{ id: number }>;
    const insertAssignment = db.prepare(
      "INSERT INTO assignments (new_hire_id, module_id, status) VALUES (?, ?, 'not_started')"
    );
    const insertMany = db.transaction((mods: Array<{ id: number }>) => {
      for (const m of mods) {
        insertAssignment.run(hireId, m.id);
      }
    });
    insertMany(modules);
    db.prepare(
      'INSERT OR IGNORE INTO hire_modules (new_hire_id, agenda_id, start_date, expected_completion_date) VALUES (?, ?, ?, ?)'
    ).run(hireId, agenda_id, start_date, expected_completion_date);
  }

  const hire = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(hireId) as NewHire;
  const inviteResult = agenda
    ? await sendChecklistInviteEmail({
        id: hireId,
        name: hire.name,
        email: hire.email,
        agendaName: agenda.name,
      })
    : { sent: false, reason: 'no_module_assigned' };

  res.status(201).json({ ...withProgress(hire), invite_email: inviteResult });
});

newHiresRouter.patch('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(req.params.id) as
    | NewHire
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }

  const {
    name,
    role,
    email,
    start_date,
    stage,
    employee_type,
    certification_notes,
    certification_recommendation,
    certification_training_areas,
    active,
    permission_roles,
    team,
  } = req.body as {
    name?: string;
    role?: string;
    email?: string | null;
    start_date?: string;
    stage?: NewHireStage;
    employee_type?: EmployeeType;
    certification_notes?: string | null;
    certification_recommendation?: CertificationRecommendation | null;
    certification_training_areas?: string[] | null;
    active?: boolean;
    permission_roles?: PermissionRole[];
    team?: Team;
  };

  if (stage !== undefined && !VALID_STAGES.includes(stage)) {
    res.status(400).json({ error: `stage must be one of ${VALID_STAGES.join(', ')}` });
    return;
  }
  if (employee_type !== undefined && !VALID_EMPLOYEE_TYPES.includes(employee_type)) {
    res.status(400).json({ error: `employee_type must be one of ${VALID_EMPLOYEE_TYPES.join(', ')}` });
    return;
  }
  if (
    certification_recommendation !== undefined &&
    certification_recommendation !== null &&
    !VALID_CERT_RECOMMENDATIONS.includes(certification_recommendation)
  ) {
    res.status(400).json({
      error: `certification_recommendation must be one of ${VALID_CERT_RECOMMENDATIONS.join(', ')}`,
    });
    return;
  }
  if (permission_roles !== undefined) {
    if (
      !Array.isArray(permission_roles) ||
      permission_roles.length === 0 ||
      !permission_roles.every((r) => VALID_PERMISSION_ROLES.includes(r))
    ) {
      res.status(400).json({
        error: `permission_roles must be a non-empty array containing only: ${VALID_PERMISSION_ROLES.join(', ')}`,
      });
      return;
    }
  }
  if (team !== undefined && !VALID_TEAMS.includes(team)) {
    res.status(400).json({ error: `team must be one of ${VALID_TEAMS.join(', ')}` });
    return;
  }

  const buddyName = team !== undefined ? TEAM_BUDDY[team] : existing.buddy_name;

  db.prepare(
    `UPDATE new_hires
     SET name = ?, role = ?, email = ?, start_date = ?, stage = ?, employee_type = ?,
         certification_notes = ?, certification_recommendation = ?, certification_training_areas = ?,
         active = ?, permission_roles = ?, team = ?, buddy_name = ?
     WHERE id = ?`
  ).run(
    name?.trim() || existing.name,
    role?.trim() || existing.role,
    email !== undefined ? email?.trim() || null : existing.email,
    start_date || existing.start_date,
    stage || existing.stage,
    employee_type ?? existing.employee_type,
    certification_notes !== undefined ? certification_notes : existing.certification_notes,
    certification_recommendation !== undefined
      ? certification_recommendation
      : existing.certification_recommendation,
    certification_training_areas !== undefined
      ? JSON.stringify(certification_training_areas ?? [])
      : existing.certification_training_areas,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    permission_roles !== undefined ? JSON.stringify(permission_roles) : existing.permission_roles,
    team ?? existing.team,
    buddyName,
    existing.id
  );

  const updated = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(existing.id) as NewHire;
  res.json(withProgress(updated));
});

newHiresRouter.post('/:id/assign-agenda', (req: Request, res: Response) => {
  const hire = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(req.params.id) as
    | NewHire
    | undefined;
  if (!hire) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }

  const { agenda_id, start_date, expected_completion_date } = req.body as {
    agenda_id?: number;
    start_date?: string;
    expected_completion_date?: string;
  };
  if (!agenda_id || !start_date || !expected_completion_date) {
    res.status(400).json({ error: 'agenda_id, start_date, and expected_completion_date are required' });
    return;
  }

  const agenda = db.prepare('SELECT id FROM agendas WHERE id = ?').get(agenda_id);
  if (!agenda) {
    res.status(400).json({ error: 'agenda_id does not reference an existing agenda' });
    return;
  }

  const modules = db
    .prepare('SELECT id FROM modules WHERE agenda_id = ? ORDER BY order_index')
    .all(agenda_id) as Array<{ id: number }>;
  const alreadyAssigned = new Set(
    (
      db
        .prepare('SELECT module_id FROM assignments WHERE new_hire_id = ?')
        .all(hire.id) as Array<{ module_id: number }>
    ).map((r) => r.module_id)
  );
  const toAssign = modules.filter((m) => !alreadyAssigned.has(m.id));

  const insertAssignment = db.prepare(
    "INSERT INTO assignments (new_hire_id, module_id, status) VALUES (?, ?, 'not_started')"
  );
  const insertMany = db.transaction((mods: Array<{ id: number }>) => {
    for (const m of mods) {
      insertAssignment.run(hire.id, m.id);
    }
  });
  insertMany(toAssign);
  db.prepare(
    'INSERT OR IGNORE INTO hire_modules (new_hire_id, agenda_id, start_date, expected_completion_date) VALUES (?, ?, ?, ?)'
  ).run(hire.id, agenda_id, start_date, expected_completion_date);

  // A hire created via "No module assigned yet" has no primary module — the
  // first one they're ever given becomes primary, matching how creation with
  // a module already works.
  if (hire.agenda_id === null) {
    db.prepare('UPDATE new_hires SET agenda_id = ? WHERE id = ?').run(agenda_id, hire.id);
  }

  recomputeAndPersistModuleStage(hire.id, agenda_id);
  recomputeAndPersistStage(hire.id);

  const refreshed = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(hire.id) as NewHire;
  res.status(201).json({ ...withProgress(refreshed), modules_added: toAssign.length });
});

newHiresRouter.patch('/:id/module-stage', (req: Request, res: Response) => {
  const hire = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(req.params.id) as
    | NewHire
    | undefined;
  if (!hire) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }

  const { agenda_id, stage } = req.body as { agenda_id?: number; stage?: NewHireStage };
  if (!agenda_id || !stage) {
    res.status(400).json({ error: 'agenda_id and stage are required' });
    return;
  }
  if (!VALID_STAGES.includes(stage)) {
    res.status(400).json({ error: `stage must be one of ${VALID_STAGES.join(', ')}` });
    return;
  }

  const result = db
    .prepare('UPDATE hire_modules SET stage = ? WHERE new_hire_id = ? AND agenda_id = ?')
    .run(stage, hire.id, agenda_id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'That module is not assigned to this employee' });
    return;
  }

  res.json({ new_hire_id: hire.id, agenda_id, stage });
});

newHiresRouter.delete('/:id/modules/:agendaId', (req: Request, res: Response) => {
  const hire = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(req.params.id) as
    | NewHire
    | undefined;
  if (!hire) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }

  const agendaId = Number(req.params.agendaId);
  if (agendaId === hire.agenda_id) {
    res.status(400).json({
      error: 'This is the employee\'s primary module and can\'t be removed this way — edit or delete the employee instead.',
    });
    return;
  }

  const hireModule = db
    .prepare('SELECT stage FROM hire_modules WHERE new_hire_id = ? AND agenda_id = ?')
    .get(hire.id, agendaId) as { stage: NewHireStage } | undefined;
  if (!hireModule) {
    res.status(404).json({ error: 'That module is not assigned to this employee' });
    return;
  }
  if (hireModule.stage !== 'not_started') {
    res.status(400).json({
      error: 'This module has already been started, so it can only be removed while still Not Started.',
    });
    return;
  }

  const removeAssignments = db.transaction(() => {
    db.prepare(
      `DELETE FROM assignments
       WHERE new_hire_id = ?
         AND module_id IN (SELECT id FROM modules WHERE agenda_id = ?)`
    ).run(hire.id, agendaId);
    db.prepare('DELETE FROM hire_modules WHERE new_hire_id = ? AND agenda_id = ?').run(
      hire.id,
      agendaId
    );
  });
  removeAssignments();

  recomputeAndPersistStage(hire.id);

  const refreshed = db.prepare('SELECT * FROM new_hires WHERE id = ?').get(hire.id) as NewHire;
  res.json(withProgress(refreshed));
});

newHiresRouter.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM new_hires WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'New hire not found' });
    return;
  }
  res.status(204).send();
});
