import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Lädt Daten von einem GET-Endpunkt. Mit path = null wird nichts geladen.
 * Liefert { data, loading, error, reload, setData }.
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null, path });
  const [version, setVersion] = useState(0);

  // Ladezustand sofort setzen, wenn sich der Pfad ändert (während des Renderns, ohne Effekt).
  if (state.path !== path) {
    setState({ data: null, loading: Boolean(path), error: null, path });
  }

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    api(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, path });
      })
      .catch((error) => {
        if (active) setState({ data: null, loading: false, error, path });
      });
    return () => {
      active = false;
    };
  }, [path, version]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setVersion((v) => v + 1);
  }, []);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { data: state.data, loading: state.loading, error: state.error, reload, setData };
}
