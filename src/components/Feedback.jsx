import { Link } from 'react-router-dom';

/** Sichtbarer Ladehinweis. */
export function Loading({ text = 'Wird geladen …', inline = false }) {
  return (
    <div className={inline ? 'loading loading--inline' : 'loading'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

/** Verständliche Fehlermeldung mit optionalem erneuten Laden. */
export function ErrorMessage({ error, title = 'Die Daten konnten nicht geladen werden.', onRetry }) {
  const detail = error && error.message;
  return (
    <div className="alert alert--error" role="alert">
      <p className="alert__title">{title}</p>
      {detail && detail !== title && <p>{detail}</p>}
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--small" onClick={onRetry}>
          Erneut versuchen
        </button>
      )}
    </div>
  );
}

/** Fehlermeldung innerhalb eines Formulars (z. B. Antwort des Backends). */
export function FormAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ text, children }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      {children}
    </div>
  );
}

export function NotFoundContent() {
  return (
    <section className="page page--narrow not-found">
      <p className="not-found__code" aria-hidden="true">404</p>
      <h1>Seite nicht gefunden</h1>
      <p>Die aufgerufene Seite oder das Produkt existiert leider nicht.</p>
      <Link to="/" className="btn btn--primary">
        Zur Startseite
      </Link>
    </section>
  );
}
