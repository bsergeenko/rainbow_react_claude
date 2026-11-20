import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CloseIcon } from '../components/Icons';

const ToastContext = createContext(null);
const AUTO_HIDE_MS = 5000;

/**
 * Temporäre Statusmeldungen. Sie verschwinden automatisch, können manuell
 * geschlossen werden und werden bei einem Seitenwechsel entfernt.
 * Meldungen für die nächste Seite werden über navigate(..., { state: { flash } }) übergeben.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Map());
  const location = useLocation();

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, type }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_HIDE_MS),
      );
      return id;
    },
    [dismiss],
  );

  // Seitenwechsel: bisherige Meldungen entfernen.
  const pathname = location.pathname;
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setToasts([]);
  }
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, [pathname]);

  // Meldung, die bei der Navigation an die neue Seite übergeben wurde.
  const flash = location.state && location.state.flash;
  const flashType = (location.state && location.state.flashType) || 'success';
  const key = location.key;
  useEffect(() => {
    if (!flash) return undefined;
    const id = show(flash, flashType);
    return () => dismiss(id);
  }, [key, flash, flashType, show, dismiss]);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Meldung schließen"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
