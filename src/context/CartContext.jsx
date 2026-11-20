import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/** Warenkorb der aktuellen Session bzw. des Benutzerkontos (GET /cart). */
export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api('/cart');
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

  const userId = user ? user.id : null;
  // Warenkorb nach Login-Prüfung sowie bei Login/Logout neu laden.
  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    api('/cart')
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
  }, [authLoading, userId]);

  const addItem = useCallback(
    async (item) => {
      await api('/cart', { method: 'POST', body: { quantity: 1, ...item } });
      await refresh();
    },
    [refresh],
  );

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const updated = await api(`/cart/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      body: { quantity },
    });
    setItems((list) =>
      list.map((i) => (i.itemId === itemId ? { ...i, quantity: updated.quantity } : i)),
    );
  }, []);

  const removeItem = useCallback(async (itemId) => {
    await api(`/cart/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
    setItems((list) => list.filter((i) => i.itemId !== itemId));
  }, []);

  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{ items, count, loading, error, refresh, reload, addItem, updateQuantity, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}
