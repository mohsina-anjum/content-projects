import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Agenda, AgendaWithModules, Module } from '../types';
import ModuleEditor from '../components/ModuleEditor';
import RichTextField from '../components/RichTextField';
import CollapsibleSection from '../components/CollapsibleSection';

interface SectionGroup {
  category: string;
  tasks: Module[];
}

export default function ManageAgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [expandedAgendaId, setExpandedAgendaId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AgendaWithModules | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showNewAgendaForm, setShowNewAgendaForm] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAgendas();
  }, []);

  async function loadAgendas() {
    const data = await api.listAgendas();
    setAgendas(data);
  }

  async function toggleAgenda(id: number) {
    if (expandedAgendaId === id) {
      setExpandedAgendaId(null);
      setDetail(null);
      setExpandedSections(new Set());
      setShowAddSectionForm(false);
      setAddingTaskFor(null);
      setEditingSection(null);
      return;
    }
    setExpandedAgendaId(id);
    setDetail(null);
    setExpandedSections(new Set());
    setShowAddSectionForm(false);
    setAddingTaskFor(null);
    setEditingSection(null);
    const data = await api.getAgenda(id);
    setDetail(data);
  }

  function toggleSection(category: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function handleCreateAgenda(name: string, description: string) {
    try {
      const created = await api.createAgenda({
        name,
        description: description.trim() === '' ? null : description,
      });
      setAgendas((prev) => [...prev, created]);
      setShowNewAgendaForm(false);
      await toggleAgenda(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module.');
    }
  }

  async function handleDeleteAgenda(id: number) {
    if (!confirm('Delete this module? Only possible if no employees are assigned to it.')) return;
    try {
      await api.deleteAgenda(id);
      setAgendas((prev) => prev.filter((a) => a.id !== id));
      if (expandedAgendaId === id) {
        setExpandedAgendaId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete module.');
    }
  }

  function addModuleToDetail(module: Module) {
    setDetail((prev) => (prev ? { ...prev, modules: [...prev.modules, module] } : prev));
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === module.agenda_id ? { ...a, module_count: (a.module_count ?? 0) + 1 } : a
      )
    );
  }

  async function handleAddSection(sectionName: string, taskTitle: string, taskDescription: string) {
    if (!detail) return;
    const module = await api.createModule(detail.id, {
      title: taskTitle,
      description: taskDescription.trim() === '' ? null : taskDescription,
      category: sectionName,
    });
    addModuleToDetail(module);
    setExpandedSections((prev) => new Set(prev).add(sectionName));
    setShowAddSectionForm(false);
  }

  async function handleAddTask(category: string, title: string, description: string) {
    if (!detail) return;
    const module = await api.createModule(detail.id, {
      title,
      description: description.trim() === '' ? null : description,
      category,
    });
    addModuleToDetail(module);
    setAddingTaskFor(null);
  }

  function handleModuleUpdated(updated: Module) {
    setDetail((prev) =>
      prev ? { ...prev, modules: prev.modules.map((m) => (m.id === updated.id ? updated : m)) } : prev
    );
  }

  function handleModuleDeleted(moduleId: number) {
    setDetail((prev) => (prev ? { ...prev, modules: prev.modules.filter((m) => m.id !== moduleId) } : prev));
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === detail?.id ? { ...a, module_count: Math.max(0, (a.module_count ?? 1) - 1) } : a
      )
    );
  }

  async function handleMoveTask(category: string, moduleId: number, direction: 'up' | 'down') {
    if (!detail) return;
    const section = groupedSections.find((s) => s.category === category);
    if (!section) return;
    const index = section.tasks.findIndex((m) => m.id === moduleId);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= section.tasks.length) return;

    const a = section.tasks[index];
    const b = section.tasks[swapWith];
    const [updatedA, updatedB] = await Promise.all([
      api.updateModule(detail.id, a.id, { order_index: b.order_index }),
      api.updateModule(detail.id, b.id, { order_index: a.order_index }),
    ]);
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => {
              if (m.id === updatedA.id) return updatedA;
              if (m.id === updatedB.id) return updatedB;
              return m;
            }),
          }
        : prev
    );
  }

  async function handleRenameSection(oldCategory: string, newCategory: string) {
    const trimmed = newCategory.trim();
    if (!detail || !trimmed || trimmed === oldCategory) {
      setEditingSection(null);
      return;
    }
    const tasksInSection = detail.modules.filter((m) => m.category === oldCategory);
    const updated = await Promise.all(
      tasksInSection.map((m) => api.updateModule(detail.id, m.id, { category: trimmed }))
    );
    setDetail((prev) =>
      prev
        ? { ...prev, modules: prev.modules.map((m) => updated.find((u) => u.id === m.id) ?? m) }
        : prev
    );
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(oldCategory)) {
        next.delete(oldCategory);
        next.add(trimmed);
      }
      return next;
    });
    setEditingSection(null);
  }

  async function handleRemoveSection(category: string) {
    if (!detail) return;
    const tasksInSection = detail.modules.filter((m) => m.category === category);
    const count = tasksInSection.length;
    if (
      !confirm(
        `Remove the entire "${category}" section? This deletes all ${count} task${count === 1 ? '' : 's'} in it, including any employee progress on them, and can't be undone.`
      )
    ) {
      return;
    }
    await Promise.all(tasksInSection.map((m) => api.deleteModule(detail.id, m.id)));
    setDetail((prev) =>
      prev ? { ...prev, modules: prev.modules.filter((m) => m.category !== category) } : prev
    );
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === detail.id ? { ...a, module_count: Math.max(0, (a.module_count ?? count) - count) } : a
      )
    );
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(category);
      return next;
    });
  }

  const groupedSections: SectionGroup[] = useMemo(() => {
    if (!detail) return [];
    const sorted = [...detail.modules].sort((a, b) => a.order_index - b.order_index);
    const order: string[] = [];
    const map = new Map<string, Module[]>();
    for (const m of sorted) {
      if (!map.has(m.category)) {
        map.set(m.category, []);
        order.push(m.category);
      }
      map.get(m.category)!.push(m);
    }
    return order.map((category) => ({ category, tasks: map.get(category)! }));
  }, [detail]);

  return (
    <div className="agendas-page">
      {error && <div className="banner-error">{error}</div>}
      <div className="agendas-header">
        <h1>Manage Modules</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowNewAgendaForm(true)}>
          + Add Module
        </button>
      </div>

      {showNewAgendaForm && (
        <NewAgendaForm onCancel={() => setShowNewAgendaForm(false)} onCreate={handleCreateAgenda} />
      )}

      {agendas.length === 0 && !showNewAgendaForm && (
        <div className="empty-state">No modules yet. Add one to get started.</div>
      )}

      <div className="agendas-accordion">
        {agendas.map((agenda) => {
          const isExpanded = expandedAgendaId === agenda.id;
          const detailReady = isExpanded && detail?.id === agenda.id;
          return (
            <CollapsibleSection
              key={agenda.id}
              level="module"
              collapsed={!isExpanded}
              onToggle={() => toggleAgenda(agenda.id)}
              title={agenda.name}
              meta={`${agenda.module_count ?? 0} task${agenda.module_count === 1 ? '' : 's'}`}
              actions={
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteAgenda(agenda.id)}
                >
                  Delete Module
                </button>
              }
            >
              {!detailReady && <div className="empty-state">Loading…</div>}
              {detailReady && detail && (
                <>
                  {detail.description && <p className="agenda-description">{detail.description}</p>}

                  <button
                    type="button"
                    className="btn btn-secondary btn-small agendas-add-section-btn"
                    onClick={() => setShowAddSectionForm((v) => !v)}
                  >
                    + Add Section
                  </button>
                  {showAddSectionForm && (
                    <AddSectionForm onCancel={() => setShowAddSectionForm(false)} onAdd={handleAddSection} />
                  )}

                  {groupedSections.length === 0 && (
                    <div className="empty-state">No sections yet. Add one above.</div>
                  )}

                  {groupedSections.map((section) =>
                    editingSection === section.category ? (
                      <div key={section.category} className="collapsible-section collapsible-section-section">
                        <SectionRenameInput
                          initialValue={section.category}
                          onSave={(name) => handleRenameSection(section.category, name)}
                          onCancel={() => setEditingSection(null)}
                        />
                      </div>
                    ) : (
                      <CollapsibleSection
                        key={section.category}
                        level="section"
                        collapsed={!expandedSections.has(section.category)}
                        onToggle={() => toggleSection(section.category)}
                        title={section.category}
                        meta={`${section.tasks.length} task${section.tasks.length === 1 ? '' : 's'}`}
                        actions={
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() =>
                                setAddingTaskFor(addingTaskFor === section.category ? null : section.category)
                              }
                            >
                              + Add Task
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => setEditingSection(section.category)}
                            >
                              Edit Section
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              onClick={() => handleRemoveSection(section.category)}
                            >
                              Remove Section
                            </button>
                          </>
                        }
                      >
                        {section.tasks.map((module, i) => (
                          <ModuleEditor
                            key={module.id}
                            agendaId={detail.id}
                            module={module}
                            isFirst={i === 0}
                            isLast={i === section.tasks.length - 1}
                            onUpdated={handleModuleUpdated}
                            onDeleted={handleModuleDeleted}
                            onMove={(moduleId, direction) => handleMoveTask(section.category, moduleId, direction)}
                          />
                        ))}
                        {addingTaskFor === section.category && (
                          <AddTaskForm
                            onCancel={() => setAddingTaskFor(null)}
                            onAdd={(title, description) => handleAddTask(section.category, title, description)}
                          />
                        )}
                      </CollapsibleSection>
                    )
                  )}
                </>
              )}
            </CollapsibleSection>
          );
        })}
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

function AddSectionForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (sectionName: string, taskTitle: string, taskDescription: string) => void;
}) {
  const [sectionName, setSectionName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sectionName.trim() || !taskTitle.trim()) return;
    onAdd(sectionName.trim(), taskTitle.trim(), taskDescription);
    setSectionName('');
    setTaskTitle('');
    setTaskDescription('');
  }

  return (
    <form className="form add-section-form" onSubmit={handleSubmit}>
      <h3>Add Section</h3>
      <p className="form-field-note">
        A section needs at least one task to exist, so add its first task here — you can add more
        tasks to it afterward.
      </p>
      <label className="form-field compact">
        <span>Section Name</span>
        <input
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          autoFocus
          placeholder="e.g. Tools & Access"
        />
      </label>
      <label className="form-field compact">
        <span>First Task Title</span>
        <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
      </label>
      <label className="form-field compact">
        <span>Task Description</span>
        <RichTextField value={taskDescription} onChange={setTaskDescription} rows={6} />
      </label>
      <div className="module-row-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Add Section
        </button>
      </div>
    </form>
  );
}

function AddTaskForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description);
    setTitle('');
    setDescription('');
  }

  return (
    <form className="form add-module-form" onSubmit={handleSubmit}>
      <h3>Add Task</h3>
      <label className="form-field compact">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
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
          Add Task
        </button>
      </div>
    </form>
  );
}

function SectionRenameInput({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="section-rename">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(value);
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button type="button" className="btn btn-primary btn-small" onClick={() => onSave(value)}>
        Save
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
