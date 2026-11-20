import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FormAlert } from '../components/Feedback';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import { isAdminRole, useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { isValidEmail } from '../labels';

function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (!isValidEmail(values.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (!values.password) errors.password = 'Bitte gib dein Passwort ein.';
  return errors;
}

export default function Login() {
  usePageTitle('Anmelden');
  const { user, login } = useAuth();
  const location = useLocation();
  const from = location.state && location.state.from;
  const form = useForm({ email: '', password: '' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  // Nach erfolgreichem Login: Administratoren → Adminbereich, aus dem Warenkorb → Warenkorb,
  // sonst → Benutzerkonto.
  if (user) {
    let target = '/konto';
    if (isAdminRole(user.role)) target = '/admin';
    else if (from === '/warenkorb') target = '/warenkorb';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setSubmitting(true);
    try {
      await login(form.values.email.trim(), form.values.password);
    } catch (err) {
      setError(
        err.status === 401
          ? 'E-Mail-Adresse oder Passwort ist falsch.'
          : err.message || 'Die Anmeldung ist fehlgeschlagen.',
      );
      setSubmitting(false);
    }
  };

  return (
    <section className="page container container--form">
      <div className="card form-card">
        <h1>Anmelden</h1>
        {from === '/warenkorb' && (
          <p className="muted">Nach der Anmeldung bleibt dein Warenkorb erhalten.</p>
        )}
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack">
          <RequiredNote />
          <TextField
            label="E-Mail-Adresse"
            type="email"
            required
            autoComplete="email"
            {...form.field('email')}
            error={form.fieldError('email')}
          />
          <TextField
            label="Passwort"
            type="password"
            required
            autoComplete="current-password"
            {...form.field('password')}
            error={form.fieldError('password')}
          />
          <FormAlert message={error} />
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Anmeldung läuft …' : 'Anmelden'}
          </button>
        </form>
        <p className="form-card__switch">
          Noch kein Benutzerkonto?{' '}
          <Link to="/registrieren" state={from ? { from } : undefined}>
            Registrieren
          </Link>
        </p>
      </div>
    </section>
  );
}
