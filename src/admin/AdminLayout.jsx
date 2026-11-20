import { useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../api';
import { Loading } from '../components/Feedback';
import { CloseIcon, MenuIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { roleLabel } from '../labels';

const ADMIN_LINKS = [
  { to: '/admin/produkte', label: 'Produkte' },
  { to: '/admin/benutzer', label: 'Benutzer' },
  { to: '/admin/bestellungen', label: 'Bestellungen' },
  { to: '/admin/administratoren', label: 'Administratoren' },
];

/** Eigenständige Oberfläche des Adminbereichs (ohne Shop-Navigation und Shop-Footer). */
export default function AdminLayout() {
  const { user, loading, isAdmin, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <Loading />
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/anmelden"
        replace
        state={{ flash: 'Bitte melde dich als Administrator an.', flashType: 'info' }}
      />
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      toast.show(err.message || 'Die Abmeldung ist fehlgeschlagen.', 'error');
      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-shell">
      <a href="#admin-inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-header__brand">
            <img src={LOGO_URL} alt="Rainbow.design" className="admin-header__logo" />
            <span className="admin-header__title">Adminbereich</span>
          </div>
          <button
            type="button"
            className="icon-button admin-header__toggle"
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <nav id="admin-navigation" className={`admin-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Adminnavigation">
            <ul>
              {ADMIN_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" className="admin-nav__link admin-nav__logout" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? 'Abmeldung läuft …' : 'Abmelden'}
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <p className="admin-header__user">
          Angemeldet als {user.firstName} {user.lastName} ({roleLabel(user.role)})
        </p>
      </header>
      <main id="admin-inhalt" className="admin-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
