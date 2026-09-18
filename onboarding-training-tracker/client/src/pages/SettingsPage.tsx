import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Agenda } from '../types';
import UsersTab from '../components/UsersTab';
import MyTasksTab from '../components/MyTasksTab';

type Tab = 'users' | 'my-tasks';

export default function SettingsPage() {
  const { currentUser, users, loading, refreshUsers } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('users');
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  useEffect(() => {
    api.listAgendas().then(setAgendas);
  }, []);

  if (loading) {
    return <div className="page-loading">Loading settings…</div>;
  }

  if (!currentUser || (!currentUser.isAdmin && !currentUser.isManager)) {
    return (
      <div className="settings-page">
        <div className="settings-denied">
          You don't have access to Settings. Ask an admin to grant you Admin or Manager/Buddy
          permission, then select your name from "Viewing as" at the top of the page.
        </div>
      </div>
    );
  }

  const canEditRoles = currentUser.isAdmin;

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          className={`settings-tab${tab === 'my-tasks' ? ' active' : ''}`}
          onClick={() => setTab('my-tasks')}
        >
          My Tasks
        </button>
      </div>

      {tab === 'users' && (
        <UsersTab
          users={users}
          agendas={agendas}
          canEditRoles={canEditRoles}
          onUserUpdated={refreshUsers}
        />
      )}
      {tab === 'my-tasks' && <MyTasksTab currentUser={currentUser} users={users} />}
    </div>
  );
}
