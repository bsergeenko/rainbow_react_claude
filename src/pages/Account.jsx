import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorMessage, FormAlert, Loading } from '../components/Feedback';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import OrderDetails from '../components/OrderDetails';
import PasswordForm from '../components/PasswordForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { flattenDesigns, formatAddress, formatDate, formatPrice, isValidEmail, statusLabel } from '../labels';

/* ---------- Persönliche Daten ---------- */

function validateProfile(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'Bitte gib deinen Vornamen ein.';
  if (!values.lastName.trim()) errors.lastName = 'Bitte gib deinen Nachnamen ein.';
  if (!values.email.trim()) errors.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (!isValidEmail(values.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  return errors;
}

function ProfileForm({ user, onCancel, onSaved }) {
  const address = user.address || {};
  const form = useForm(
    {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      street: address.street || '',
      postalCode: address.postalCode || '',
      city: address.city || '',
      country: address.country || '',
    },
    validateProfile,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const body = {};
    Object.entries(form.values).forEach(([key, value]) => {
      body[key] = value.trim();
    });
    setSubmitting(true);
    try {
      const updated = await api('/me', { method: 'PUT', body });
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Die Daten konnten nicht gespeichert werden.');
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack">
      <RequiredNote />
      <div className="form-grid">
        <TextField label="Vorname" required autoComplete="given-name" {...form.field('firstName')} error={form.fieldError('firstName')} />
        <TextField label="Nachname" required autoComplete="family-name" {...form.field('lastName')} error={form.fieldError('lastName')} />
        <TextField
          label="E-Mail-Adresse"
          type="email"
          required
          autoComplete="email"
          className="form-grid__full"
          {...form.field('email')}
          error={form.fieldError('email')}
        />
        <TextField label="Straße und Hausnummer" autoComplete="street-address" className="form-grid__full" {...form.field('street')} />
        <TextField label="Postleitzahl" autoComplete="postal-code" {...form.field('postalCode')} />
        <TextField label="Ort" autoComplete="address-level2" {...form.field('city')} />
        <TextField label="Land" autoComplete="country-name" className="form-grid__full" {...form.field('country')} />
      </div>
      <FormAlert message={error} />
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Wird gespeichert …' : 'Speichern'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function PersonalData() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const addressLines = formatAddress(user.address);

  return (
    <section className="account-section card" aria-labelledby="persoenliche-daten">
      <div className="account-section__header">
        <h2 id="persoenliche-daten">Persönliche Daten</h2>
        {!editing && (
          <button type="button" className="btn btn--secondary btn--small" onClick={() => setEditing(true)}>
            Bearbeiten
          </button>
        )}
      </div>
      {editing ? (
        <ProfileForm
          user={user}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setUser(updated);
            setEditing(false);
            toast.show('Deine Daten wurden gespeichert.');
          }}
        />
      ) : (
        <dl className="data-list">
          <div>
            <dt>Name</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div>
            <dt>E-Mail-Adresse</dt>
            <dd>{user.email}</dd>
          </div>
          {addressLines.length > 0 && (
            <div>
              <dt>Adresse</dt>
              <dd>
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

/* ---------- Meine Bestellungen ---------- */

function MyOrders() {
  const toast = useToast();
  const orders = useApi('/orders');
  const products = useApi('/products');
  const designs = useApi('/designs');
  const shipping = useApi('/shipping-options');
  const [openId, setOpenId] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loading = orders.loading || products.loading || designs.loading || shipping.loading;
  const error = orders.error || products.error || designs.error || shipping.error;
  const designList = flattenDesigns(designs.data);

  const retry = () => {
    if (orders.error) orders.reload();
    if (products.error) products.reload();
    if (designs.error) designs.reload();
    if (shipping.error) shipping.reload();
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      const updated = await api(`/orders/${encodeURIComponent(cancelOrder.id)}/cancel`, { method: 'PUT' });
      orders.setData((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      toast.show('Die Bestellung wurde storniert.');
      setOpenId(updated.id);
      setCancelOrder(null);
    } catch (err) {
      toast.show(err.message || 'Die Bestellung konnte nicht storniert werden.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section id="meine-bestellungen" className="account-section card" aria-labelledby="meine-bestellungen-titel" tabIndex={-1}>
      <div className="account-section__header">
        <h2 id="meine-bestellungen-titel">Meine Bestellungen</h2>
      </div>
      {loading && <Loading text="Bestellungen werden geladen …" />}
      {!loading && error && <ErrorMessage error={error} onRetry={retry} />}
      {!loading && !error && orders.data.length === 0 && <EmptyState text="Du hast noch keine Bestellungen." />}
      {!loading && !error && orders.data.length > 0 && (
        <ul className="order-list">
          {orders.data.map((order) => {
            const open = openId === order.id;
            const cancellable = ['new', 'processing'].includes(order.status);
            return (
              <li key={order.id} className="order-row">
                <div className="order-row__summary">
                  <dl className="order-row__facts">
                    <div>
                      <dt>Bestellnummer</dt>
                      <dd>{order.id}</dd>
                    </div>
                    <div>
                      <dt>Bestelldatum</dt>
                      <dd>{formatDate(order.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <span className={`status status--${order.status}`}>{statusLabel(order.status)}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Gesamtpreis</dt>
                      <dd>{formatPrice(order.total)}</dd>
                    </div>
                  </dl>
                  <div className="order-row__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      aria-expanded={open}
                      aria-controls={`bestellung-${order.id}`}
                      onClick={() => setOpenId(open ? null : order.id)}
                    >
                      {open ? 'Details ausblenden' : 'Details anzeigen'}
                    </button>
                    {cancellable && (
                      <button type="button" className="btn btn--danger-outline btn--small" onClick={() => setCancelOrder(order)}>
                        Bestellung stornieren
                      </button>
                    )}
                  </div>
                </div>
                {order.status === 'cancelled' && (
                  <p className="notice notice--info">
                    Diese Bestellung wurde storniert. Der Gesamtbetrag von {formatPrice(order.total)} (einschließlich
                    Versandkosten) wird auf die ursprünglich verwendete Zahlungsmethode zurückerstattet.
                  </p>
                )}
                {open && (
                  <div id={`bestellung-${order.id}`} className="order-row__details">
                    <OrderDetails
                      order={order}
                      products={products.data}
                      designs={designList}
                      shippingOptions={shipping.data}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(cancelOrder)}
        title="Bestellung stornieren?"
        confirmLabel="Bestellung stornieren"
        cancelLabel="Nicht stornieren"
        danger
        busy={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelOrder(null)}
      >
        {cancelOrder && (
          <p>
            Möchtest du die Bestellung {cancelOrder.id} wirklich stornieren? Der Gesamtbetrag von{' '}
            {formatPrice(cancelOrder.total)} einschließlich Versandkosten wird auf die ursprünglich verwendete
            Zahlungsmethode zurückerstattet.
          </p>
        )}
      </ConfirmDialog>
    </section>
  );
}

/* ---------- Kontoübersicht ---------- */

export default function Account() {
  usePageTitle('Benutzerkonto');
  const { user, logout, endSession } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      toast.show(err.message || 'Die Abmeldung ist fehlgeschlagen.', 'error');
      setLoggingOut(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api('/me', { method: 'DELETE' });
      endSession('Dein Konto wurde gelöscht.');
    } catch (err) {
      toast.show(err.message || 'Das Konto konnte nicht gelöscht werden.', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <section className="page container account-page">
      <header className="page__header page__header--split">
        <div>
          <h1>Benutzerkonto</h1>
          <p className="muted">Hallo {user.firstName}, willkommen in deinem Benutzerkonto.</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Abmeldung läuft …' : 'Abmelden'}
        </button>
      </header>

      <div className="account-grid">
        <div className="account-grid__main">
          <PersonalData />
          <MyOrders />
        </div>

        <div className="account-grid__side">
          <section className="account-section card" aria-labelledby="meine-wunschliste">
            <h2 id="meine-wunschliste">Meine Wunschliste</h2>
            <p className="muted">Alle Produkte, die du dir gemerkt hast.</p>
            <Link to="/wunschliste" state={{ fromAccount: true }} className="btn btn--secondary btn--block">
              Meine Wunschliste
            </Link>
          </section>

          <section className="account-section card" aria-labelledby="passwort-aendern">
            <h2 id="passwort-aendern">Passwort ändern</h2>
            {showPassword ? (
              <PasswordForm onDone={() => setShowPassword(false)} />
            ) : (
              <button type="button" className="btn btn--secondary btn--block" onClick={() => setShowPassword(true)}>
                Passwort ändern
              </button>
            )}
          </section>

          <section className="account-section card account-section--danger" aria-labelledby="konto-loeschen">
            <h2 id="konto-loeschen">Konto löschen</h2>
            <p className="muted">
              Dein Benutzerkonto wird dauerhaft gelöscht. Bereits aufgegebene Bestellungen werden weiterhin bearbeitet,
              sind danach aber nicht mehr über ein Benutzerkonto abrufbar.
            </p>
            <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirmDelete(true)}>
              Konto löschen
            </button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Konto wirklich löschen?"
        confirmLabel="Konto löschen"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>Möchtest du dein Benutzerkonto wirklich dauerhaft löschen? Dieser Schritt kann nicht rückgängig gemacht werden.</p>
      </ConfirmDialog>
    </section>
  );
}
