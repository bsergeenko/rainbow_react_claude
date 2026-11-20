import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import SearchPanel from './SearchPanel';
import { MAIN_LINKS } from '../siteLinks';

export default function Header() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Menü und Suche bei Seitenwechsel schließen.
  const [lastKey, setLastKey] = useState(location.key);
  if (lastKey !== location.key) {
    setLastKey(location.key);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  const accountLabel = user ? 'Benutzerkonto' : 'Anmelden';

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button
          type="button"
          className="icon-button site-header__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="hauptnavigation"
          aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link to="/" className="site-header__logo" aria-label="Rainbow.design – zur Startseite">
          <img src={LOGO_URL} alt="Rainbow.design" />
        </Link>

        <nav
          id="hauptnavigation"
          className={`main-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Hauptnavigation"
        >
          <ul>
            {MAIN_LINKS.map((link) => (
              <li key={link.to}>
                {link.hash ? (
                  <Link
                    to={link.to}
                    className={`main-nav__link ${location.pathname === '/' && location.hash === '#ueber-uns' ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <NavLink to={link.to} className={({ isActive }) => `main-nav__link ${isActive ? 'is-active' : ''}`}>
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__icons">
          <button
            type="button"
            className={`icon-button ${searchOpen ? 'is-active' : ''}`}
            aria-label={searchOpen ? 'Suche schließen' : 'Suche öffnen'}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <SearchIcon />
          </button>
          <NavLink
            to={user ? '/konto' : '/anmelden'}
            className={({ isActive }) => `icon-button ${isActive ? 'is-active' : ''}`}
            aria-label={accountLabel}
            title={accountLabel}
          >
            <UserIcon />
          </NavLink>
          <NavLink
            to="/wunschliste"
            className={({ isActive }) => `icon-button ${isActive ? 'is-active' : ''}`}
            aria-label="Wunschliste"
            title="Wunschliste"
          >
            <HeartIcon />
          </NavLink>
          <NavLink
            to="/warenkorb"
            className={({ isActive }) => `icon-button cart-button ${isActive ? 'is-active' : ''}`}
            aria-label={count > 0 ? `Warenkorb, ${count} Artikel` : 'Warenkorb'}
            title="Warenkorb"
          >
            <BagIcon />
            {count > 0 && (
              <span className="cart-badge" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </NavLink>
        </div>
      </div>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
