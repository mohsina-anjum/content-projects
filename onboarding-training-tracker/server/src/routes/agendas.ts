import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Agenda, Module } from '../types';

export const agendasRouter = Router();

agendasRouter.get('/', (_req: Request, res: Response) => {
  const agendas = db.prepare('SELECT * FROM agendas ORDER BY created_at').all() as Agenda[];
  const moduleCountStmt = db.prepare(
    'SELECT COUNT(*) as count FROM modules WHERE agenda_id = ?'
  );
  const withCounts = agendas.map((agenda) => ({
    ...agenda,
    module_count: (moduleCountStmt.get(agenda.id) as { count: number }).count,
  }));
  res.json(withCounts);
});

agendasRouter.get('/:id', (req: Request, res: Response) => {
  const agenda = db
    .prepare('SELECT * FROM agendas WHERE id = ?')
    .get(req.params.id) as Agenda | undefined;
  if (!agenda) {
    res.status(404).json({ error: 'Agenda not found' });
    return;
  }
  const modules = db
    .prepare('SELECT * FROM modules WHERE agenda_id = ? ORDER BY order_index')
    .all(agenda.id) as Module[];
  res.json({ ...agenda, modules });
});

agendasRouter.post('/', (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO agendas (name, description) VALUES (?, ?)')
    .run(name.trim(), description ?? null);
  const agenda = db
    .prepare('SELECT * FROM agendas WHERE id = ?')
    .get(result.lastInsertRowid) as Agenda;
  res.status(201).json(agenda);
});

agendasRouter.patch('/:id', (req: Request, res: Response) => {
  const existing = db
    .prepare('SELECT * FROM agendas WHERE id = ?')
    .get(req.params.id) as Agenda | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Agenda not found' });
    return;
  }
  const { name, description } = req.body as { name?: string; description?: string };
  db.prepare('UPDATE agendas SET name = ?, description = ? WHERE id = ?').run(
    name?.trim() || existing.name,
    description !== undefined ? description : existing.description,
    existing.id
  );
  const updated = db.prepare('SELECT * FROM agendas WHERE id = ?').get(existing.id);
  res.json(updated);
});

agendasRouter.delete('/:id', (req: Request, res: Response) => {
  const inUse = db
    .prepare('SELECT COUNT(*) as count FROM new_hires WHERE agenda_id = ?')
    .get(req.params.id) as { count: number };
  if (inUse.count > 0) {
    res.status(409).json({ error: 'Cannot delete an agenda that is assigned to new hires' });
    return;
  }
  const result = db.prepare('DELETE FROM agendas WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Agenda not found' });
    return;
  }
  res.status(204).send();
});

agendasRouter.post('/:id/modules', (req: Request, res: Response) => {
  const agenda = db
    .prepare('SELECT * FROM agendas WHERE id = ?')
    .get(req.params.id) as Agenda | undefined;
  if (!agenda) {
    res.status(404).json({ error: 'Agenda not found' });
    return;
  }
  const { title, description, category, duration_days } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    duration_days?: number;
  };
  if (!title || !title.trim() || !category || !category.trim()) {
    res.status(400).json({ error: 'title and category are required' });
    return;
  }
  const maxOrder = db
    .prepare('SELECT MAX(order_index) as maxOrder FROM modules WHERE agenda_id = ?')
    .get(agenda.id) as { maxOrder: number | null };
  const nextOrder = (maxOrder.maxOrder ?? -1) + 1;
  const result = db
    .prepare(
      'INSERT INTO modules (agenda_id, title, description, category, order_index, duration_days) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(agenda.id, title.trim(), description ?? null, category.trim(), nextOrder, duration_days ?? 0.25);
  const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(module);
});

agendasRouter.patch('/:agendaId/modules/:moduleId', (req: Request, res: Response) => {
  const existing = db
    .prepare('SELECT * FROM modules WHERE id = ? AND agenda_id = ?')
    .get(req.params.moduleId, req.params.agendaId) as Module | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Module not found' });
    return;
  }
  const { title, description, category, order_index, duration_days } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    order_index?: number;
    duration_days?: number;
  };
  db.prepare(
    'UPDATE modules SET title = ?, description = ?, category = ?, order_index = ?, duration_days = ? WHERE id = ?'
  ).run(
    title?.trim() || existing.title,
    description !== undefined ? description : existing.description,
    category?.trim() || existing.category,
    order_index !== undefined ? order_index : existing.order_index,
    duration_days !== undefined ? duration_days : existing.duration_days,
    existing.id
  );
  const updated = db.prepare('SELECT * FROM modules WHERE id = ?').get(existing.id);
  res.json(updated);
});

agendasRouter.delete('/:agendaId/modules/:moduleId', (req: Request, res: Response) => {
  const result = db
    .prepare('DELETE FROM modules WHERE id = ? AND agenda_id = ?')
    .run(req.params.moduleId, req.params.agendaId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Module not found' });
    return;
  }
  res.status(204).send();
});
