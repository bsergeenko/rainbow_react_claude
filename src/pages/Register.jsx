import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { FormAlert } from '../components/Feedback';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { isValidEmail } from '../labels';

function validate(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'Bitte gib deinen Vornamen ein.';
  if (!values.lastName.trim()) errors.lastName = 'Bitte gib deinen Nachnamen ein.';
  if (!values.email.trim()) errors.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (!isValidEmail(values.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.';
  if (!values.password) errors.password = 'Bitte gib ein Passwort ein.';
  if (!values.passwordConfirm) errors.passwordConfirm = 'Bitte bestätige dein Passwort.';
  else if (values.password !== values.passwordConfirm) errors.passwordConfirm = 'Die Passwörter stimmen nicht überein.';
  return errors;
}

export default function Register() {
  usePageTitle('Registrieren');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state && location.state.from;
  const formRef = useRef(null);
  const form = useForm(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      passwordConfirm: '',
      street: '',
      postalCode: '',
      city: '',
      country: '',
    },
    validate,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/konto" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const v = form.values;
    // Die Passwortbestätigung wird nicht an das Backend gesendet.
    const body = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      password: v.password,
      street: v.street.trim(),
      postalCode: v.postalCode.trim(),
      city: v.city.trim(),
      country: v.country.trim(),
    };
    setSubmitting(true);
    try {
      await api('/register', { method: 'POST', body });
      navigate('/anmelden', {
        state: {
          from,
          flash: 'Deine Registrierung war erfolgreich. Du kannst dich jetzt anmelden.',
        },
      });
    } catch (err) {
      setError(err.message || 'Die Registrierung ist fehlgeschlagen.');
      setSubmitting(false);
    }
  };

  return (
    <section className="page container container--form-wide">
      <div className="card form-card">
        <h1>Registrieren</h1>
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack">
          <RequiredNote />
          <fieldset className="form-section">
            <legend>Persönliche Daten</legend>
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
              <TextField
                label="Passwort"
                type="password"
                required
                autoComplete="new-password"
                {...form.field('password')}
                error={form.fieldError('password')}
              />
              <TextField
                label="Passwort bestätigen"
                type="password"
                required
                autoComplete="new-password"
                {...form.field('passwordConfirm')}
                error={form.fieldError('passwordConfirm')}
              />
            </div>
          </fieldset>
          <fieldset className="form-section">
            <legend>Adresse (optional)</legend>
            <div className="form-grid">
              <TextField label="Straße und Hausnummer" autoComplete="street-address" className="form-grid__full" {...form.field('street')} />
              <TextField label="Postleitzahl" autoComplete="postal-code" {...form.field('postalCode')} />
              <TextField label="Ort" autoComplete="address-level2" {...form.field('city')} />
              <TextField label="Land" autoComplete="country-name" className="form-grid__full" {...form.field('country')} />
            </div>
          </fieldset>
          <FormAlert message={error} />
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Registrierung läuft …' : 'Registrieren'}
          </button>
        </form>
        <p className="form-card__switch">
          Bereits registriert?{' '}
          <Link to="/anmelden" state={from ? { from } : undefined}>
            Anmelden
          </Link>
        </p>
      </div>
    </section>
  );
}
