import { useEffect } from 'react';

/** Setzt den Titel des Browser-Tabs. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Rainbow.design` : 'Rainbow.design';
  }, [title]);
}
