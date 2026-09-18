import { NavLink, Route, Routes } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import ManageAgendasPage from './pages/ManageAgendasPage';
import NewHireChecklistPage from './pages/NewHireChecklistPage';
import SettingsPage from './pages/SettingsPage';
import { CurrentUserProvider, useCurrentUser } from './hooks/useCurrentUser';

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.2 12.3c.1-.3.15-.5.15-.8s-.05-.5-.15-.8l1.4-1.2-1.3-2.3-1.75.5c-.4-.35-.85-.65-1.35-.85L12.8 5H10.2l-.4 1.85c-.5.2-.95.5-1.35.85l-1.75-.5-1.3 2.3 1.4 1.2c-.1.3-.15.5-.15.8s.05.5.15.8l-1.4 1.2 1.3 2.3 1.75-.5c.4.35.85.65 1.35.85l.4 1.85h2.6l.4-1.85c.5-.2.95-.5 1.35-.85l1.75.5 1.3-2.3-1.4-1.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ManagerShell() {
  const { currentUser, setCurrentUserId, users, loading } = useCurrentUser();
  const canSeeSettings = currentUser?.isAdmin || currentUser?.isManager;
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title-group">
            <div className="app-eyebrow">Builder Prime</div>
            <h1 className="app-title">CS Internal Employee Product Certification Programme</h1>
          </div>
          <nav className="app-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              Board
            </NavLink>
            <NavLink
              to="/modules"
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              Manage Modules
            </NavLink>
            {!loading && (
              <label className="app-act-as">
                <span>Viewing as</span>
                <select
                  value={currentUser?.id ?? ''}
                  onChange={(e) =>
                    setCurrentUserId(e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  <option value="">Not signed in</option>
                  {sortedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canSeeSettings && (
              <NavLink
                to="/settings"
                className={({ isActive }) => `app-nav-link app-settings-link${isActive ? ' active' : ''}`}
                aria-label="Settings"
                title="Settings"
              >
                <GearIcon />
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/modules" element={<ManageAgendasPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/checklist/:hireId" element={<NewHireChecklistPage />} />
      <Route
        path="/*"
        element={
          <CurrentUserProvider>
            <ManagerShell />
          </CurrentUserProvider>
        }
      />
    </Routes>
  );
}
