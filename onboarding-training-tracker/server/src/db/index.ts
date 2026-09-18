import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tracker.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function tableExists(name: string): boolean {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
  return !!row;
}

function columnExists(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

function columnIsNotNull(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
    notnull: number;
  }>;
  return rows.find((r) => r.name === column)?.notnull === 1;
}

// Employees can now be added without a module assigned yet (assigned later
// from Edit User), so agenda_id on new_hires has to allow NULL. SQLite can't
// drop a NOT NULL constraint in place, so rebuild the table — this only runs
// once, guarded by the notnull check, same as the columnExists() guards above.
function relaxNewHiresAgendaIdNotNull(): void {
  if (!tableExists('new_hires') || !columnIsNotNull('new_hires', 'agenda_id')) return;

  // The target shape includes every column any prior migration could have
  // added. On a fresh database, none of those extra ALTERs have run yet at
  // this point, so we only copy whichever of these columns actually exist
  // on the old table — the rest just take their DEFAULT in the new one.
  const existingColumns = new Set(
    (db.prepare(`PRAGMA table_info(new_hires)`).all() as Array<{ name: string }>).map(
      (r) => r.name
    )
  );
  const colList = [
    'id',
    'name',
    'role',
    'email',
    'start_date',
    'agenda_id',
    'stage',
    'employee_type',
    'certification_notes',
    'certification_recommendation',
    'certification_training_areas',
    'created_at',
    'active',
    'team',
    'buddy_name',
    'permission_role',
  ]
    .filter((c) => existingColumns.has(c))
    .join(', ');

  db.pragma('foreign_keys = OFF');
  const rebuild = db.transaction(() => {
    db.exec(`
      CREATE TABLE new_hires_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        start_date TEXT NOT NULL,
        agenda_id INTEGER REFERENCES agendas(id),
        stage TEXT NOT NULL CHECK (stage IN ('not_started', 'in_progress', 'completed', 'at_risk')) DEFAULT 'not_started',
        employee_type TEXT NOT NULL CHECK (employee_type IN ('new_hire', 'existing_employee')) DEFAULT 'new_hire',
        certification_notes TEXT,
        certification_recommendation TEXT CHECK (certification_recommendation IS NULL OR certification_recommendation IN ('certified', 'needs_training')),
        certification_training_areas TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        active INTEGER NOT NULL DEFAULT 1,
        team TEXT CHECK (team IS NULL OR team IN ('csm', 'implementation', 'support')),
        buddy_name TEXT,
        permission_role TEXT NOT NULL DEFAULT 'employee' CHECK (permission_role IN ('admin', 'manager', 'employee'))
      );
    `);
    db.exec(`INSERT INTO new_hires_new (${colList}) SELECT ${colList} FROM new_hires;`);
    db.exec(`DROP TABLE new_hires;`);
    db.exec(`ALTER TABLE new_hires_new RENAME TO new_hires;`);
  });
  rebuild();
  db.pragma('foreign_keys = ON');
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      schedule_by_employee_type INTEGER NOT NULL DEFAULT 0,
      has_certification_review INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agenda_id INTEGER NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS new_hires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      start_date TEXT NOT NULL,
      agenda_id INTEGER NOT NULL REFERENCES agendas(id),
      stage TEXT NOT NULL CHECK (stage IN ('not_started', 'in_progress', 'completed', 'at_risk')) DEFAULT 'not_started',
      employee_type TEXT NOT NULL CHECK (employee_type IN ('new_hire', 'existing_employee')) DEFAULT 'new_hire',
      certification_notes TEXT,
      certification_recommendation TEXT CHECK (certification_recommendation IS NULL OR certification_recommendation IN ('certified', 'needs_training')),
      certification_training_areas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hire_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      new_hire_id INTEGER NOT NULL REFERENCES new_hires(id) ON DELETE CASCADE,
      agenda_id INTEGER NOT NULL REFERENCES agendas(id),
      stage TEXT NOT NULL CHECK (stage IN ('not_started', 'in_progress', 'completed', 'at_risk')) DEFAULT 'not_started',
      start_date TEXT,
      expected_completion_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(new_hire_id, agenda_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      new_hire_id INTEGER NOT NULL REFERENCES new_hires(id) ON DELETE CASCADE,
      module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
      score INTEGER CHECK (score IS NULL OR (score BETWEEN 1 AND 5)),
      notes TEXT,
      evaluated_by TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_modules_agenda ON modules(agenda_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_new_hire ON assignments(new_hire_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_module ON assignments(module_id);
  `);

  relaxNewHiresAgendaIdNotNull();

  if (!columnExists('modules', 'duration_days')) {
    db.exec(`ALTER TABLE modules ADD COLUMN duration_days REAL NOT NULL DEFAULT 0.25`);
  }
  if (!columnExists('new_hires', 'email')) {
    db.exec(`ALTER TABLE new_hires ADD COLUMN email TEXT`);
  }
  if (!columnExists('new_hires', 'employee_type')) {
    db.exec(
      `ALTER TABLE new_hires ADD COLUMN employee_type TEXT NOT NULL DEFAULT 'new_hire' CHECK (employee_type IN ('new_hire', 'existing_employee'))`
    );
  }
  if (!columnExists('agendas', 'schedule_by_employee_type')) {
    db.exec(`ALTER TABLE agendas ADD COLUMN schedule_by_employee_type INTEGER NOT NULL DEFAULT 0`);
  }
  if (!columnExists('agendas', 'has_certification_review')) {
    db.exec(`ALTER TABLE agendas ADD COLUMN has_certification_review INTEGER NOT NULL DEFAULT 0`);
  }
  if (!columnExists('new_hires', 'certification_notes')) {
    db.exec(`ALTER TABLE new_hires ADD COLUMN certification_notes TEXT`);
  }
  if (!columnExists('new_hires', 'certification_recommendation')) {
    db.exec(
      `ALTER TABLE new_hires ADD COLUMN certification_recommendation TEXT CHECK (certification_recommendation IS NULL OR certification_recommendation IN ('certified', 'needs_training'))`
    );
  }
  if (!columnExists('new_hires', 'certification_training_areas')) {
    db.exec(`ALTER TABLE new_hires ADD COLUMN certification_training_areas TEXT`);
  }
  if (!columnExists('new_hires', 'active')) {
    db.exec(`ALTER TABLE new_hires ADD COLUMN active INTEGER NOT NULL DEFAULT 1`);
  }
  if (!columnExists('new_hires', 'team')) {
    db.exec(
      `ALTER TABLE new_hires ADD COLUMN team TEXT CHECK (team IS NULL OR team IN ('csm', 'implementation', 'support'))`
    );
  }
  if (!columnExists('new_hires', 'buddy_name')) {
    db.exec(`ALTER TABLE new_hires ADD COLUMN buddy_name TEXT`);
  }
  if (!columnExists('new_hires', 'permission_role')) {
    db.exec(
      `ALTER TABLE new_hires ADD COLUMN permission_role TEXT NOT NULL DEFAULT 'employee' CHECK (permission_role IN ('admin', 'manager', 'employee'))`
    );
  }
  if (!columnExists('new_hires', 'permission_roles')) {
    // Superscedes permission_role, which only allowed one role per person —
    // stored as a JSON array (same pattern as certification_training_areas)
    // so someone can be e.g. both Admin and Manager/Buddy at once.
    db.exec(`ALTER TABLE new_hires ADD COLUMN permission_roles TEXT NOT NULL DEFAULT '["employee"]'`);
    db.exec(`UPDATE new_hires SET permission_roles = '["' || permission_role || '"]'`);
  }
  if (!columnExists('hire_modules', 'start_date')) {
    db.exec(`ALTER TABLE hire_modules ADD COLUMN start_date TEXT`);
  }
  if (!columnExists('hire_modules', 'expected_completion_date')) {
    db.exec(`ALTER TABLE hire_modules ADD COLUMN expected_completion_date TEXT`);
  }
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Dates on hire_modules used to be auto-computed from module durations; now
// they're set explicitly whenever a module is assigned. Rows created before
// this change (or before the table existed at all) have none, so backfill a
// reasonable default: the hire's own start date, with a 14-day window.
function backfillHireModuleDates(): void {
  const rows = db
    .prepare(
      `SELECT hm.id as id, nh.start_date as hire_start_date
       FROM hire_modules hm
       JOIN new_hires nh ON nh.id = hm.new_hire_id
       WHERE hm.start_date IS NULL OR hm.expected_completion_date IS NULL`
    )
    .all() as Array<{ id: number; hire_start_date: string }>;
  const update = db.prepare(
    'UPDATE hire_modules SET start_date = ?, expected_completion_date = ? WHERE id = ?'
  );
  for (const row of rows) {
    update.run(row.hire_start_date, addDays(row.hire_start_date, 14), row.id);
  }
}

// hire_modules is new: backfill one row per (hire, module) pair already
// implied by existing assignments, so every hire that predates this table
// still gets a per-module stage record. Stage itself is left at the
// table default here and brought up to date by a recompute pass at server
// startup (see index.ts), since that needs the duration/overdue logic in
// stage.ts and would create a circular import if done here.
function backfillHireModules(): void {
  const pairs = db
    .prepare(
      `SELECT DISTINCT a.new_hire_id as new_hire_id, m.agenda_id as agenda_id
       FROM assignments a
       JOIN modules m ON m.id = a.module_id
       LEFT JOIN hire_modules hm ON hm.new_hire_id = a.new_hire_id AND hm.agenda_id = m.agenda_id
       WHERE hm.id IS NULL`
    )
    .all() as Array<{ new_hire_id: number; agenda_id: number }>;
  const insert = db.prepare(
    'INSERT OR IGNORE INTO hire_modules (new_hire_id, agenda_id) VALUES (?, ?)'
  );
  for (const pair of pairs) {
    insert.run(pair.new_hire_id, pair.agenda_id);
  }
}

function seedIfEmpty(): void {
  const agendaCount = db.prepare('SELECT COUNT(*) as count FROM agendas').get() as {
    count: number;
  };
  if (agendaCount.count > 0) return;

  const insertAgenda = db.prepare(
    `INSERT INTO agendas (name, description) VALUES (?, ?)`
  );
  const agendaResult = insertAgenda.run(
    'General Onboarding',
    'Standard onboarding checklist for all new hires across departments.'
  );
  const agendaId = agendaResult.lastInsertRowid as number;

  const insertModule = db.prepare(
    `INSERT INTO modules (agenda_id, title, description, category, order_index) VALUES (?, ?, ?, ?, ?)`
  );

  const modules: Array<[string, string, string]> = [
    [
      'Complete I-9 & tax forms',
      'Fill out federal and state employment eligibility and tax withholding paperwork.',
      'Paperwork & Compliance',
    ],
    [
      'Sign employee handbook acknowledgment',
      'Read the employee handbook and sign the acknowledgment form.',
      'Paperwork & Compliance',
    ],
    [
      'Set up email & Slack',
      'Activate company email account and join relevant Slack channels.',
      'Tools & Access',
    ],
    [
      'Provision CRM/software access',
      'Get login credentials and permissions for Builder Prime and other core tools.',
      'Tools & Access',
    ],
    [
      'Company & product overview',
      'Walkthrough of company history, mission, and the core product offering.',
      'Product Training',
    ],
    [
      'Shadow a live customer call',
      'Sit in on a live customer call or demo with a senior team member.',
      'Product Training',
    ],
    [
      'Meet your onboarding buddy',
      'Introductory 1:1 with the peer assigned to help during the first month.',
      'Culture & Process',
    ],
    [
      '1:1 with manager — goals & expectations',
      'Discuss 30/60/90 day goals and performance expectations with your manager.',
      'Culture & Process',
    ],
  ];

  modules.forEach(([title, description, category], index) => {
    insertModule.run(agendaId, title, description, category, index);
  });

  const moduleRows = db
    .prepare('SELECT id FROM modules WHERE agenda_id = ? ORDER BY order_index')
    .all(agendaId) as Array<{ id: number }>;

  const insertHire = db.prepare(
    `INSERT INTO new_hires (name, role, start_date, agenda_id, stage) VALUES (?, ?, ?, ?, ?)`
  );
  const insertAssignment = db.prepare(
    `INSERT INTO assignments (new_hire_id, module_id, status, score, notes, evaluated_by, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertHireModule = db.prepare(
    `INSERT INTO hire_modules (new_hire_id, agenda_id, start_date, expected_completion_date) VALUES (?, ?, ?, ?)`
  );

  const hire1 = insertHire.run('Jordan Reyes', 'Sales Representative', '2026-08-10', agendaId, 'in_progress');
  const hire1Id = hire1.lastInsertRowid as number;
  insertHireModule.run(hire1Id, agendaId, '2026-08-10', addDays('2026-08-10', 14));
  moduleRows.forEach((m, idx) => {
    if (idx < 3) {
      insertAssignment.run(
        hire1Id,
        m.id,
        'completed',
        idx === 0 ? 5 : 4,
        idx === 0 ? 'Submitted on time, no issues.' : null,
        idx === 0 ? 'Pat Alvarez' : null,
        new Date().toISOString()
      );
    } else if (idx === 3) {
      insertAssignment.run(hire1Id, m.id, 'in_progress', null, null, null, null);
    } else {
      insertAssignment.run(hire1Id, m.id, 'not_started', null, null, null, null);
    }
  });

  const hire2 = insertHire.run('Casey Nguyen', 'Field Technician', '2026-08-17', agendaId, 'not_started');
  const hire2Id = hire2.lastInsertRowid as number;
  insertHireModule.run(hire2Id, agendaId, '2026-08-17', addDays('2026-08-17', 14));
  moduleRows.forEach((m) => {
    insertAssignment.run(hire2Id, m.id, 'not_started', null, null, null, null);
  });

  const hire3 = insertHire.run('Morgan Lee', 'Customer Success Associate', '2026-07-20', agendaId, 'at_risk');
  const hire3Id = hire3.lastInsertRowid as number;
  insertHireModule.run(hire3Id, agendaId, '2026-07-20', addDays('2026-07-20', 14));
  moduleRows.forEach((m, idx) => {
    if (idx < 2) {
      insertAssignment.run(
        hire3Id,
        m.id,
        'completed',
        3,
        'Took longer than expected, some follow-up needed.',
        'Pat Alvarez',
        new Date().toISOString()
      );
    } else if (idx === 2) {
      insertAssignment.run(hire3Id, m.id, 'in_progress', null, 'Missed two scheduled setup sessions.', null, null);
    } else {
      insertAssignment.run(hire3Id, m.id, 'not_started', null, null, null, null);
    }
  });
}

export function initDb(): void {
  const alreadyInitialized = tableExists('agendas');
  runMigrations();
  seedIfEmpty();
  backfillHireModules();
  backfillHireModuleDates();
  if (!alreadyInitialized) {
    console.log('Database initialized and seeded at', dbPath);
  }
}
