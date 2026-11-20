import { useRef, useState } from 'react';
import { api } from '../api';
import { FormAlert } from '../components/Feedback';
import { SocialLinks } from '../components/Footer';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { isValidEmail } from '../labels';

const EMPTY = { name: '', email: '', subject: '', message: '' };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Bitte gib deinen Namen ein.';
  if (!values.email.trim()) errors.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (!isValidEmail(values.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.';
  if (!values.subject.trim()) errors.subject = 'Bitte gib einen Betreff ein.';
  if (!values.message.trim()) errors.message = 'Bitte gib eine Nachricht ein.';
  return errors;
}

export default function Contact() {
  usePageTitle('Kontakt');
  const { user } = useAuth();
  const toast = useToast();
  const formRef = useRef(null);
  const form = useForm(
    user ? { ...EMPTY, name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), email: user.email || '' } : EMPTY,
    validate,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setSubmitting(true);
    try {
      await api('/contact', {
        method: 'POST',
        body: {
          name: form.values.name.trim(),
          email: form.values.email.trim(),
          subject: form.values.subject.trim(),
          message: form.values.message.trim(),
        },
      });
      form.reset(EMPTY);
      toast.show('Vielen Dank für deine Nachricht.');
    } catch (err) {
      setError(err.message || 'Die Nachricht konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page container contact-page">
      <header className="page__header">
        <h1>Kontakt</h1>
        <p className="muted">Du hast Fragen zu unseren Regenmänteln oder zu deinem Design? Schreib uns!</p>
      </header>
      <div className="contact-layout">
        <div className="card">
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack">
            <RequiredNote />
            <div className="form-grid">
              <TextField label="Name" required autoComplete="name" {...form.field('name')} error={form.fieldError('name')} />
              <TextField
                label="E-Mail-Adresse"
                type="email"
                required
                autoComplete="email"
                {...form.field('email')}
                error={form.fieldError('email')}
              />
              <TextField
                label="Betreff"
                required
                className="form-grid__full"
                {...form.field('subject')}
                error={form.fieldError('subject')}
              />
              <TextField
                label="Nachricht"
                required
                multiline
                rows={6}
                className="form-grid__full"
                {...form.field('message')}
                error={form.fieldError('message')}
              />
            </div>
            <FormAlert message={error} />
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Wird gesendet …' : 'Nachricht senden'}
            </button>
          </form>
        </div>
        <aside className="card contact-aside">
          <h2>Social Media</h2>
          <p className="muted">Folge Rainbow.design auf Instagram und Facebook.</p>
          <SocialLinks className="social-links--stacked" />
        </aside>
      </div>
    </section>
  );
}
