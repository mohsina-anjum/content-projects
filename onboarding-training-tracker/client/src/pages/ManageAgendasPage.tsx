import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Agenda, AgendaWithModules, Module } from '../types';
import ModuleEditor from '../components/ModuleEditor';
import RichTextField from '../components/RichTextField';

export default function ManageAgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AgendaWithModules | null>(null);
  const [showNewAgendaForm, setShowNewAgendaForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAgendas();
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      return;
    }
    void api.getAgenda(selectedId).then(setDetail);
  }, [selectedId]);

  async function loadAgendas() {
    const data = await api.listAgendas();
    setAgendas(data);
    if (data.length > 0 && selectedId === null) {
      setSelectedId(data[0].id);
    }
  }

  async function handleCreateAgenda(name: string, description: string) {
    try {
      const created = await api.createAgenda({
        name,
        description: description.trim() === '' ? null : description,
      });
      setAgendas((prev) => [...prev, created]);
      setSelectedId(created.id);
      setShowNewAgendaForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module.');
    }
  }

  async function handleDeleteAgenda(id: number) {
    if (!confirm('Delete this module? Only possible if no employees are assigned to it.')) return;
    try {
      await api.deleteAgenda(id);
      const remaining = agendas.filter((a) => a.id !== id);
      setAgendas(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete module.');
    }
  }

  async function handleAddModule(title: string, description: string, category: string) {
    if (!detail) return;
    const module = await api.createModule(detail.id, {
      title,
      description: description.trim() === '' ? null : description,
      category,
    });
    setDetail({ ...detail, modules: [...detail.modules, module] });
  }

  function handleModuleUpdated(updated: Module) {
    if (!detail) return;
    setDetail({
      ...detail,
      modules: detail.modules.map((m) => (m.id === updated.id ? updated : m)),
    });
  }

  function handleModuleDeleted(moduleId: number) {
    if (!detail) return;
    setDetail({ ...detail, modules: detail.modules.filter((m) => m.id !== moduleId) });
  }

  async function handleMoveModule(moduleId: number, direction: 'up' | 'down') {
    if (!detail) return;
    const sorted = [...detail.modules].sort((a, b) => a.order_index - b.order_index);
    const index = sorted.findIndex((m) => m.id === moduleId);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapWith];
    const [updatedA, updatedB] = await Promise.all([
      api.updateModule(detail.id, a.id, { order_index: b.order_index }),
      api.updateModule(detail.id, b.id, { order_index: a.order_index }),
    ]);
    setDetail({
      ...detail,
      modules: detail.modules.map((m) => {
        if (m.id === updatedA.id) return updatedA;
        if (m.id === updatedB.id) return updatedB;
        return m;
      }),
    });
  }

  const sortedModules = detail
    ? [...detail.modules].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <div className="agendas-page">
      {error && <div className="banner-error">{error}</div>}
      <div className="agendas-layout">
        <aside className="agendas-sidebar">
          <div className="agendas-sidebar-header">
            <h2>Modules</h2>
            <button className="btn btn-primary btn-small" onClick={() => setShowNewAgendaForm(true)}>
              + New Module
            </button>
          </div>
          <ul className="agendas-list">
            {agendas.map((agenda) => (
              <li key={agenda.id}>
                <button
                  className={`agenda-list-item${agenda.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(agenda.id)}
                >
                  <span className="agenda-list-name">{agenda.name}</span>
                  <span className="agenda-list-count">{agenda.module_count ?? 0} tasks</span>
                </button>
              </li>
            ))}
          </ul>
          {showNewAgendaForm && (
            <NewAgendaForm
              onCancel={() => setShowNewAgendaForm(false)}
              onCreate={handleCreateAgenda}
            />
          )}
        </aside>

        <section className="agenda-detail">
          {!detail && <div className="empty-state">Select or create a module to get started.</div>}
          {detail && (
            <>
              <div className="agenda-detail-header">
                <div>
                  <h2>{detail.name}</h2>
                  {detail.description && <p className="agenda-description">{detail.description}</p>}
                </div>
                <button className="btn btn-danger" onClick={() => handleDeleteAgenda(detail.id)}>
                  Delete Module
                </button>
              </div>

              <div className="module-list">
                {sortedModules.length === 0 && (
                  <div className="empty-state">No tasks yet. Add one below.</div>
                )}
                {sortedModules.map((module, i) => (
                  <ModuleEditor
                    key={module.id}
                    agendaId={detail.id}
                    module={module}
                    isFirst={i === 0}
                    isLast={i === sortedModules.length - 1}
                    onUpdated={handleModuleUpdated}
                    onDeleted={handleModuleDeleted}
                    onMove={handleMoveModule}
                  />
                ))}
              </div>

              <AddModuleForm onAdd={handleAddModule} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function NewAgendaForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description);
    setName('');
    setDescription('');
  }

  return (
    <form className="form new-agenda-form" onSubmit={handleSubmit}>
      <label className="form-field compact">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label className="form-field compact">
        <span>Description</span>
        <RichTextField value={description} onChange={setDescription} rows={6} />
      </label>
      <div className="module-row-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </div>
    </form>
  );
}

function AddModuleForm({
  onAdd,
}: {
  onAdd: (title: string, description: string, category: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;
    onAdd(title.trim(), description, category.trim());
    setTitle('');
    setDescription('');
    setCategory('');
  }

  return (
    <form className="form add-module-form" onSubmit={handleSubmit}>
      <h3>Add Task</h3>
      <label className="form-field compact">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="form-field compact">
        <span>Description</span>
        <RichTextField value={description} onChange={setDescription} rows={6} />
      </label>
      <label className="form-field compact">
        <span>Section</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Tools & Access"
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          <option value="Paperwork & Compliance" />
          <option value="Tools & Access" />
          <option value="Product Training" />
          <option value="Culture & Process" />
        </datalist>
      </label>
      <button type="submit" className="btn btn-primary">
        Add Task
      </button>
    </form>
  );
}
