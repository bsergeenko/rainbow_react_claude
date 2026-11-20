import { useRef, useState } from 'react';
import { api } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorMessage, FormAlert, Loading } from '../components/Feedback';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import PasswordForm from '../components/PasswordForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDate, isValidEmail, roleLabel } from '../labels';

function validateAdmin(values, withPassword) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'Bitte gib einen Vornamen ein.';
  if (!values.lastName.trim()) errors.lastName = 'Bitte gib einen Nachnamen ein.';
  if (!values.email.trim()) errors.email = 'Bitte gib eine E-Mail-Adresse ein.';
  else if (!isValidEmail(values.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (withPassword && !values.password) errors.password = 'Bitte gib ein Passwort ein.';
  return errors;
}

/** Formular zum Anlegen (mit Passwort) oder Bearbeiten (ohne Passwort) eines Administrators. */
function AdminForm({ initial, withPassword, submitLabel, onSubmit, onCancel }) {
  const form = useForm(
    { firstName: '', lastName: '', email: '', password: '', ...initial },
    (values) => validateAdmin(values, withPassword),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const body = {
      firstName: form.values.firstName.trim(),
      lastName: form.values.lastName.trim(),
      email: form.values.email.trim(),
    };
    if (withPassword) body.password = form.values.password;
    setSaving(true);
    try {
      await onSubmit(body);
    } catch (err) {
      setError(err.message || 'Die Daten konnten nicht gespeichert werden.');
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack admin-edit-form">
      <RequiredNote />
      <div className="form-grid">
        <TextField label="Vorname" required autoComplete="off" {...form.field('firstName')} error={form.fieldError('firstName')} />
        <TextField label="Nachname" required autoComplete="off" {...form.field('lastName')} error={form.fieldError('lastName')} />
        <TextField
          label="E-Mail-Adresse"
          type="email"
          required
          autoComplete="off"
          className={withPassword ? '' : 'form-grid__full'}
          {...form.field('email')}
          error={form.fieldError('email')}
        />
        {withPassword && (
          <TextField
            label="Passwort"
            type="password"
            required
            autoComplete="new-password"
            {...form.field('password')}
            error={form.fieldError('password')}
          />
        )}
      </div>
      <FormAlert message={error} />
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Wird gespeichert …' : submitLabel}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={saving}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

const sortAdmins = (list) =>
  [...list].sort((a, b) => {
    if (a.role === 'main_admin' && b.role !== 'main_admin') return -1;
    if (b.role === 'main_admin' && a.role !== 'main_admin') return 1;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

export default function AdminAdmins() {
  usePageTitle('Administratoren – Adminbereich');
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi('/admins');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isMainAdmin = user.role === 'main_admin';
  const admins = sortAdmins(data || []);

  const canEdit = (admin) => isMainAdmin || admin.id === user.id;
  const canDelete = (admin) => isMainAdmin && admin.id !== user.id;

  const createAdmin = async (body) => {
    const created = await api('/admins', { method: 'POST', body });
    setData((list) => [...(list || []), created]);
    setCreating(false);
    toast.show('Der Administrator wurde angelegt.');
  };

  const updateAdmin = async (admin, body) => {
    const updated = await api(`/admins/${encodeURIComponent(admin.id)}`, { method: 'PUT', body });
    setData((list) => list.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    if (updated.id === user.id) setUser((u) => ({ ...u, ...updated }));
    setEditingId(null);
    toast.show(updated.id === user.id ? 'Deine Daten wurden gespeichert.' : 'Die Daten wurden gespeichert.');
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api(`/admins/${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' });
      setData((list) => list.filter((a) => a.id !== deleteTarget.id));
      toast.show('Der Administrator wurde gelöscht.');
      setDeleteTarget(null);
    } catch (err) {
      toast.show(err.message || 'Der Administrator konnte nicht gelöscht werden.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__header admin-page__header--split">
        <h1>Administratoren</h1>
        {isMainAdmin && !creating && (
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            Neuen Administrator anlegen
          </button>
        )}
      </header>

      {creating && (
        <div className="admin-card">
          <h2 className="admin-card__title">Neuen Administrator anlegen</h2>
          <AdminForm
            initial={{}}
            withPassword
            submitLabel="Administrator anlegen"
            onSubmit={createAdmin}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="admin-card">
        <h2 className="admin-card__title">Eigenes Passwort ändern</h2>
        {changingPassword ? (
          <PasswordForm onDone={() => setChangingPassword(false)} />
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => setChangingPassword(true)}>
            Passwort ändern
          </button>
        )}
      </div>

      {loading && <Loading text="Administratoren werden geladen …" />}
      {!loading && error && <ErrorMessage error={error} onRetry={reload} />}
      {!loading && !error && admins.length === 0 && <EmptyState text="Es sind keine Administratoren vorhanden." />}
      {!loading && !error && admins.length > 0 && (
        <ul className="admin-list">
          {admins.map((admin) => {
            const own = admin.id === user.id;
            const editing = editingId === admin.id;
            return (
              <li key={admin.id} className={`admin-card ${own ? 'admin-card--own' : ''}`}>
                <div className="admin-person">
                  <div>
                    <h2 className="admin-card__title">
                      {admin.firstName} {admin.lastName}
                      {own && <span className="badge">Du</span>}
                    </h2>
                    <p className="muted">{admin.email}</p>
                    <p>
                      <span className={`role role--${admin.role}`}>{roleLabel(admin.role)}</span>
                      {admin.createdAt && <span className="muted small"> · Angelegt am {formatDate(admin.createdAt)}</span>}
                    </p>
                  </div>
                  {!editing && (canEdit(admin) || canDelete(admin)) && (
                    <div className="button-row">
                      {canEdit(admin) && (
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          onClick={() => setEditingId(admin.id)}
                          aria-label={`${admin.firstName} ${admin.lastName} bearbeiten`}
                        >
                          Bearbeiten
                        </button>
                      )}
                      {canDelete(admin) && (
                        <button
                          type="button"
                          className="btn btn--danger-outline btn--small"
                          onClick={() => setDeleteTarget(admin)}
                          aria-label={`${admin.firstName} ${admin.lastName} löschen`}
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {editing && (
                  <AdminForm
                    initial={{ firstName: admin.firstName, lastName: admin.lastName, email: admin.email }}
                    withPassword={false}
                    submitLabel="Speichern"
                    onSubmit={(body) => updateAdmin(admin, body)}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Administrator löschen?"
        confirmLabel="Löschen"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <p>
            Möchtest du {deleteTarget.firstName} {deleteTarget.lastName} ({deleteTarget.email}) wirklich als
            Administrator löschen?
          </p>
        )}
      </ConfirmDialog>
    </section>
  );
}
