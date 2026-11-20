import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const isAdminRole = (role) => role === 'admin' || role === 'main_admin';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /** Prüft den Login-Status über GET /me. */
  const refresh = useCallback(async () => {
    try {
      const me = await api('/me');
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login-Status beim Start prüfen.
  useEffect(() => {
    let active = true;
    api('/me')
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      await api('/login', { method: 'POST', body: { email, password } });
      return refresh();
    },
    [refresh],
  );

  /**
   * Beendet die Sitzung lokal und öffnet die Startseite. Navigation und
   * Zurücksetzen erfolgen gemeinsam, damit geschützte Seiten nicht zur Login-Seite umleiten.
   */
  const endSession = useCallback(
    (flash) => {
      navigate('/', { state: flash ? { flash } : undefined });
      setUser(null);
    },
    [navigate],
  );

  /** Logout über POST /logout, anschließend wird die Startseite geöffnet. */
  const logout = useCallback(async () => {
    await api('/logout', { method: 'POST' });
    endSession('Du wurdest erfolgreich abgemeldet.');
  }, [endSession]);

  const value = {
    user,
    loading,
    isAdmin: Boolean(user && isAdminRole(user.role)),
    refresh,
    login,
    logout,
    endSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
