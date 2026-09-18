import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { NewHireWithProgress, PermissionRole } from '../types';

const STORAGE_KEY = 'bp_onboarding_current_user_id';

export interface CurrentUser {
  id: number;
  name: string;
  roles: PermissionRole[];
  isAdmin: boolean;
  isManager: boolean;
}

interface CurrentUserContextValue {
  currentUser: CurrentUser | null;
  setCurrentUserId: (id: number | null) => void;
  users: NewHireWithProgress[];
  loading: boolean;
  refreshUsers: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// Lightweight "act as" identity — no passwords/accounts. Whoever picks a
// name from the switcher is trusted to be that person, matching how the
// rest of this internal tool already works (URL-based, not authenticated).
// Lives in a single shared context so every consumer (the header switcher,
// the Settings page, etc.) reacts to the same change immediately.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<NewHireWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  function refreshUsers() {
    api.listNewHires().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    refreshUsers();
  }, []);

  function setCurrentUserId(id: number | null) {
    setCurrentUserIdState(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }

  const match = currentUserId !== null ? users.find((u) => u.id === currentUserId) : undefined;
  const currentUser: CurrentUser | null = match
    ? {
        id: match.id,
        name: match.name,
        roles: match.permission_roles,
        isAdmin: match.permission_roles.includes('admin'),
        isManager: match.permission_roles.includes('manager'),
      }
    : null;

  return (
    <CurrentUserContext.Provider
      value={{ currentUser, setCurrentUserId, users, loading, refreshUsers }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return ctx;
}
