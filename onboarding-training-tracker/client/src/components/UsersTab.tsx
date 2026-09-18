import { useState } from 'react';
import { Agenda, NewHireWithProgress, PERMISSION_ROLES } from '../types';
import EditUserModal from './EditUserModal';

interface Props {
  users: NewHireWithProgress[];
  agendas: Agenda[];
  canEditRoles: boolean;
  onUserUpdated: (updated: NewHireWithProgress) => void;
}

export default function UsersTab({ users, agendas, canEditRoles, onUserUpdated }: Props) {
  const [editingUser, setEditingUser] = useState<NewHireWithProgress | null>(null);
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="settings-panel">
      <p className="settings-panel-note">
        Everyone added via + Add Employee starts with Employee access. Promote someone to Admin
        or Manager/Buddy from Edit to give them access to Settings — a person can hold more than
        one role.
        {!canEditRoles && ' Only Admins can change roles — you can view this list, not edit it.'}
      </p>
      <div className="users-table">
        {sorted.length === 0 && <div className="empty-state">No users yet.</div>}
        {sorted.map((user) => (
          <div key={user.id} className="users-table-row">
            <div className="users-table-name">
              <span className="users-table-name-text">{user.name}</span>
              <span className="users-table-role-meta">{user.role}</span>
            </div>
            <div className="users-table-actions">
              <button
                type="button"
                className="users-table-edit-link"
                onClick={() => setEditingUser(user)}
              >
                Edit
              </button>
              <div className="users-table-role-badges">
                {user.permission_roles.map((role) => (
                  <span key={role} className={`users-table-role-badge users-table-role-badge-${role}`}>
                    {PERMISSION_ROLES.find((r) => r.key === role)?.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <EditUserModal
          hire={editingUser}
          agendas={agendas}
          canEditRoles={canEditRoles}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            onUserUpdated(updated);
            setEditingUser(updated);
          }}
        />
      )}
    </div>
  );
}
