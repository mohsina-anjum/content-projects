import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Module } from '../types';
import Linkified from './Linkified';
import RichTextField from './RichTextField';

interface Props {
  agendaId: number;
  module: Module;
  isFirst: boolean;
  isLast: boolean;
  onUpdated: (module: Module) => void;
  onDeleted: (moduleId: number) => void;
  onMove: (moduleId: number, direction: 'up' | 'down') => void;
}

export default function ModuleEditor({
  agendaId,
  module,
  isFirst,
  isLast,
  onUpdated,
  onDeleted,
  onMove,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? '');
  const [category, setCategory] = useState(module.category);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateModule(agendaId, module.id, {
        title: title.trim(),
        description: description.trim() === '' ? null : description,
        category: category.trim(),
      });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete task "${module.title}"? This cannot be undone.`)) return;
    await api.deleteModule(agendaId, module.id);
    onDeleted(module.id);
  }

  if (editing) {
    return (
      <form className="module-row editing" onSubmit={handleSave}>
        <label className="form-field compact">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label className="form-field compact">
          <span>Description</span>
          <RichTextField
            value={description}
            onChange={setDescription}
            rows={16}
            className="module-edit-textarea"
          />
        </label>
        <label className="form-field compact">
          <span>Section</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <div className="module-row-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="module-row">
      <div className="module-row-order">
        <button type="button" disabled={isFirst} onClick={() => onMove(module.id, 'up')} aria-label="Move up">
          ↑
        </button>
        <button type="button" disabled={isLast} onClick={() => onMove(module.id, 'down')} aria-label="Move down">
          ↓
        </button>
      </div>
      <div className="module-row-info">
        <div className="module-row-title">{module.title}</div>
        {module.description && (
          <div className="module-row-description">
            <Linkified text={module.description} />
          </div>
        )}
        <div className="module-row-category">{module.category}</div>
      </div>
      <div className="module-row-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
