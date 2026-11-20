import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { isAdminRole, useAuth } from './AuthContext';

const WishlistContext = createContext(null);

/** Wunschliste des eingeloggten Nutzers (GET /wishlist). Für Gäste wird nichts gespeichert. */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enabled = Boolean(user && !isAdminRole(user.role));
  const userId = user ? user.id : null;

  // Benutzerwechsel (Login/Logout): Einträge des vorherigen Nutzers verwerfen.
  const [lastUser, setLastUser] = useState(userId);
  if (lastUser !== userId) {
    setLastUser(userId);
    setItems([]);
    setError(null);
    setLoading(enabled);
  }

  const refresh = useCallback(async () => {
    try {
      const data = await api('/wishlist');
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    return refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api('/wishlist')
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [enabled, userId]);

  const findItem = useCallback(
    (productId, color) => items.find((i) => i.productId === productId && i.color === color),
    [items],
  );

  const add = useCallback(
    async (productId, color) => {
      await api('/wishlist', { method: 'POST', body: { productId, color } });
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(async (itemId) => {
    await api(`/wishlist/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
    setItems((list) => list.filter((i) => i.itemId !== itemId));
  }, []);

  return (
    <WishlistContext.Provider value={{ items, loading, error, reload, findItem, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  return useContext(WishlistContext);
}
