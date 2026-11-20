import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { Loading, NotFoundContent } from './components/Feedback';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Configurator from './pages/Configurator';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Contact from './pages/Contact';
import AdminLayout from './admin/AdminLayout';
import AdminProducts from './admin/AdminProducts';
import AdminUsers from './admin/AdminUsers';
import AdminOrders from './admin/AdminOrders';
import AdminAdmins from './admin/AdminAdmins';

/** Scrollt bei Seitenwechsel nach oben bzw. zu einem Abschnitt (#anker). */
function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
        lastPath.current = pathname;
        return;
      }
    }
    if (lastPath.current !== pathname) {
      window.scrollTo(0, 0);
      lastPath.current = pathname;
    }
  }, [pathname, hash, key]);

  return null;
}

/** Layout der normalen Benutzeroberfläche mit Navigation und Footer. */
function ShopLayout() {
  const { loading, isAdmin } = useAuth();

  let content;
  if (loading) content = <Loading />;
  else if (isAdmin) content = <Navigate to="/admin" replace />;
  else content = <Outlet />;

  return (
    <div className="app-shell">
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt" className="site-main" tabIndex={-1}>
        {content}
      </main>
      <Footer />
    </div>
  );
}

/** Schützt Seiten, die einen Login voraussetzen. */
function RequireUser({ children, message }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) {
    return (
      <Navigate
        to="/anmelden"
        replace
        state={{ from: location.pathname, flash: message, flashType: 'info' }}
      />
    );
  }
  return children;
}

/** Jeder neue Aufruf von „Dein Design“ startet mit einem neuen Auswahlzustand. */
function ConfiguratorRoute() {
  const location = useLocation();
  return <Configurator key={location.key} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollManager />
              <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="produkte" replace />} />
                  <Route path="produkte" element={<AdminProducts />} />
                  <Route path="benutzer" element={<AdminUsers />} />
                  <Route path="bestellungen" element={<AdminOrders />} />
                  <Route path="administratoren" element={<AdminAdmins />} />
                  <Route path="*" element={<Navigate to="produkte" replace />} />
                </Route>
                <Route element={<ShopLayout />}>
                  <Route index element={<Home />} />
                  <Route path="damen" element={<CategoryPage key="women" category="women" />} />
                  <Route path="herren" element={<CategoryPage key="men" category="men" />} />
                  <Route path="kinder" element={<CategoryPage key="kids" category="kids" />} />
                  <Route path="hunde" element={<CategoryPage key="dogs" category="dogs" />} />
                  <Route path="produkt/:id" element={<ProductDetail />} />
                  <Route path="dein-design" element={<ConfiguratorRoute />} />
                  <Route
                    path="wunschliste"
                    element={
                      <RequireUser message="Bitte melde dich an, um deine Wunschliste zu sehen.">
                        <Wishlist />
                      </RequireUser>
                    }
                  />
                  <Route path="warenkorb" element={<Cart />} />
                  <Route path="kasse" element={<Checkout />} />
                  <Route path="bestellung-abgeschlossen" element={<OrderConfirmation />} />
                  <Route path="anmelden" element={<Login />} />
                  <Route path="registrieren" element={<Register />} />
                  <Route
                    path="konto"
                    element={
                      <RequireUser message="Bitte melde dich an, um dein Benutzerkonto zu öffnen.">
                        <Account />
                      </RequireUser>
                    }
                  />
                  <Route path="kontakt" element={<Contact />} />
                  <Route path="*" element={<NotFoundContent />} />
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
