import { useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import { FormAlert } from './Feedback';
import { RequiredNote, TextField } from './FormFields';
import { focusFirstInvalid } from '../formUtils';

const EMPTY = { currentPassword: '', newPassword: '', newPasswordConfirm: '' };

function validate(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = 'Bitte gib dein aktuelles Passwort ein.';
  if (!values.newPassword) errors.newPassword = 'Bitte gib ein neues Passwort ein.';
  if (!values.newPasswordConfirm) errors.newPasswordConfirm = 'Bitte bestätige das neue Passwort.';
  else if (values.newPassword !== values.newPasswordConfirm)
    errors.newPasswordConfirm = 'Die neuen Passwörter stimmen nicht überein.';
  return errors;
}

/** Passwort ändern über PUT /me/password (nur aktuelles und neues Passwort werden gesendet). */
export default function PasswordForm({ onDone }) {
  const toast = useToast();
  const form = useForm(EMPTY, validate);
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
    setSubmitting(true);
    try {
      await api('/me/password', {
        method: 'PUT',
        body: { currentPassword: form.values.currentPassword, newPassword: form.values.newPassword },
      });
      form.reset(EMPTY);
      toast.show('Dein Passwort wurde erfolgreich geändert.');
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || 'Das Passwort konnte nicht geändert werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack">
      <RequiredNote />
      <TextField
        label="Aktuelles Passwort"
        type="password"
        required
        autoComplete="current-password"
        {...form.field('currentPassword')}
        error={form.fieldError('currentPassword')}
      />
      <TextField
        label="Neues Passwort"
        type="password"
        required
        autoComplete="new-password"
        {...form.field('newPassword')}
        error={form.fieldError('newPassword')}
      />
      <TextField
        label="Neues Passwort bestätigen"
        type="password"
        required
        autoComplete="new-password"
        {...form.field('newPasswordConfirm')}
        error={form.fieldError('newPasswordConfirm')}
      />
      <FormAlert message={error} />
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Wird gespeichert …' : 'Passwort ändern'}
        </button>
        {onDone && (
          <button type="button" className="btn btn--secondary" onClick={onDone} disabled={submitting}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
