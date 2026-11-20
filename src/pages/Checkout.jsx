import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { enrichItem } from '../cartDetails';
import { EmptyState, ErrorMessage, FormAlert, Loading } from '../components/Feedback';
import { CheckboxField, RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import { ItemImage } from '../components/ItemDetails';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useApi } from '../hooks/useApi';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { colorLabel, flattenDesigns, formatPrice, isValidEmail, sizeLabel } from '../labels';

const CUSTOMER_FIELDS = ['firstName', 'lastName', 'email', 'street', 'postalCode', 'city', 'country'];

const REQUIRED_MESSAGES = {
  firstName: 'Bitte gib deinen Vornamen ein.',
  lastName: 'Bitte gib deinen Nachnamen ein.',
  email: 'Bitte gib deine E-Mail-Adresse ein.',
  street: 'Bitte gib Straße und Hausnummer ein.',
  postalCode: 'Bitte gib die Postleitzahl ein.',
  city: 'Bitte gib den Ort ein.',
  country: 'Bitte gib das Land ein.',
};

function validate(values) {
  const errors = {};
  CUSTOMER_FIELDS.forEach((name) => {
    if (!String(values[name] || '').trim()) errors[name] = REQUIRED_MESSAGES[name];
  });
  if (!errors.email && !isValidEmail(values.email)) {
    errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.';
  }
  const cardDigits = values.cardNumber.replace(/\s/g, '');
  if (!cardDigits) errors.cardNumber = 'Bitte gib die Kartennummer ein.';
  else if (!/^\d{16}$/.test(cardDigits)) errors.cardNumber = 'Die Kartennummer muss aus 16 Ziffern bestehen.';
  if (!values.expiry.trim()) errors.expiry = 'Bitte gib das Ablaufdatum ein.';
  else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry.trim()))
    errors.expiry = 'Bitte gib das Ablaufdatum im Format MM/JJ ein, z. B. 08/28.';
  if (!values.cvc.trim()) errors.cvc = 'Bitte gib den Sicherheitscode ein.';
  else if (!/^\d{3}$/.test(values.cvc.trim())) errors.cvc = 'Der Sicherheitscode muss aus 3 Ziffern bestehen.';
  if (!values.shippingMethod) errors.shippingMethod = 'Bitte wähle eine Versandart aus.';
  return errors;
}

/** Kartennummer in Vierergruppen formatieren (nur Ziffern, maximal 16). */
const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export default function Checkout() {
  usePageTitle('Kasse');
  const { user, refresh: refreshUser } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const products = useApi('/products');
  const designs = useApi('/designs');
  const shipping = useApi('/shipping-options');
  const formRef = useRef(null);

  const address = (user && user.address) || {};
  const form = useForm(
    {
      firstName: user ? user.firstName || '' : '',
      lastName: user ? user.lastName || '' : '',
      email: user ? user.email || '' : '',
      street: address.street || '',
      postalCode: address.postalCode || '',
      city: address.city || '',
      country: address.country || '',
      cardNumber: '',
      expiry: '',
      cvc: '',
      shippingMethod: '',
    },
    validate,
  );
  const [saveAddress, setSaveAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { reload } = cart;
  useEffect(() => {
    reload();
  }, [reload]);

  const loading = cart.loading || products.loading || designs.loading || shipping.loading;
  const error = cart.error || products.error || designs.error || shipping.error;

  const designList = flattenDesigns(designs.data);
  const items = cart.items.map((item) => enrichItem(item, products.data, designList));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingOptions = shipping.data || [];
  const selectedShipping = shippingOptions.find((o) => o.id === form.values.shippingMethod) || null;
  const total = subtotal + (selectedShipping ? Number(selectedShipping.price) : 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!form.trySubmit()) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const v = form.values;
    const customer = {};
    CUSTOMER_FIELDS.forEach((name) => {
      customer[name] = v[name].trim();
    });
    const body = {
      customer,
      shippingMethod: v.shippingMethod,
      paymentMethod: 'card',
      items: cart.items.map((item) => ({
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        designId: item.designId ?? null,
        pocketRequest: item.pocketRequest || '',
      })),
    };
    if (user) body.saveAddress = saveAddress;

    setSubmitting(true);
    try {
      const order = await api('/orders', { method: 'POST', body });
      navigate('/bestellung-abgeschlossen', { replace: true, state: { order } });
      cart.refresh();
      if (user && saveAddress) refreshUser();
    } catch (err) {
      setSubmitError(err.message || 'Die Bestellung konnte nicht abgeschlossen werden.');
      setSubmitting(false);
    }
  };

  const retry = () => {
    if (cart.error) cart.reload();
    if (products.error) products.reload();
    if (designs.error) designs.reload();
    if (shipping.error) shipping.reload();
  };

  if (loading) return <Loading text="Checkout wird geladen …" />;

  return (
    <section className="page container checkout-page">
      <header className="page__header">
        <h1>Kasse</h1>
      </header>

      {error && <ErrorMessage error={error} onRetry={retry} />}

      {!error && items.length === 0 && (
        <EmptyState text="Dein Warenkorb ist leer.">
          <Link to="/" className="btn btn--primary">
            Weiter einkaufen
          </Link>
        </EmptyState>
      )}

      {!error && items.length > 0 && (
        <form ref={formRef} className="checkout-layout" onSubmit={handleSubmit} noValidate>
          <div className="checkout-main">
            <RequiredNote />

            <fieldset className="form-section">
              <legend>Kundendaten</legend>
              <div className="form-grid">
                <TextField label="Vorname" required autoComplete="given-name" {...form.field('firstName')} error={form.fieldError('firstName')} />
                <TextField label="Nachname" required autoComplete="family-name" {...form.field('lastName')} error={form.fieldError('lastName')} />
                <TextField
                  label="E-Mail-Adresse"
                  required
                  type="email"
                  autoComplete="email"
                  className="form-grid__full"
                  {...form.field('email')}
                  error={form.fieldError('email')}
                />
                <TextField
                  label="Straße und Hausnummer"
                  required
                  autoComplete="street-address"
                  className="form-grid__full"
                  {...form.field('street')}
                  error={form.fieldError('street')}
                />
                <TextField label="Postleitzahl" required autoComplete="postal-code" {...form.field('postalCode')} error={form.fieldError('postalCode')} />
                <TextField label="Ort" required autoComplete="address-level2" {...form.field('city')} error={form.fieldError('city')} />
                <TextField
                  label="Land"
                  required
                  autoComplete="country-name"
                  className="form-grid__full"
                  {...form.field('country')}
                  error={form.fieldError('country')}
                />
              </div>
              {user && (
                <CheckboxField
                  label="Diese Adresse in meinem Konto speichern"
                  checked={saveAddress}
                  onChange={setSaveAddress}
                />
              )}
            </fieldset>

            <fieldset className={`form-section ${form.fieldError('shippingMethod') ? 'option-group--invalid' : ''}`}>
              <legend>
                Versandart<span className="required-mark" aria-hidden="true"> *</span>
              </legend>
              <div className="radio-cards">
                {shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`radio-card ${form.values.shippingMethod === option.id ? 'is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={option.id}
                      checked={form.values.shippingMethod === option.id}
                      onChange={() => form.setValue('shippingMethod', option.id)}
                      aria-invalid={form.fieldError('shippingMethod') ? 'true' : undefined}
                    />
                    <span className="radio-card__label">{option.name}</span>
                    <span className="radio-card__price">{formatPrice(option.price)}</span>
                  </label>
                ))}
              </div>
              {form.fieldError('shippingMethod') && <p className="field__error">{form.fieldError('shippingMethod')}</p>}
            </fieldset>

            <fieldset className="form-section">
              <legend>Zahlung</legend>
              <p className="payment-method">
                <strong>Zahlungsmethode:</strong> Kartenzahlung
              </p>
              <div className="form-grid">
                <TextField
                  label="Kartennummer"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  className="form-grid__full"
                  {...form.field('cardNumber')}
                  onChange={(event) => form.setValue('cardNumber', formatCardNumber(event.target.value))}
                  maxLength={19}
                  error={form.fieldError('cardNumber')}
                />
                <TextField
                  label="Ablaufdatum (MM/JJ)"
                  required
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/JJ"
                  maxLength={5}
                  {...form.field('expiry')}
                  error={form.fieldError('expiry')}
                />
                <TextField
                  label="Sicherheitscode"
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={3}
                  {...form.field('cvc')}
                  error={form.fieldError('cvc')}
                />
              </div>
              <p className="muted">Deine Kartendaten werden nur geprüft und nicht gespeichert.</p>
            </fieldset>
          </div>

          <aside className="checkout-summary" aria-labelledby="bestelluebersicht-titel">
            <h2 id="bestelluebersicht-titel">Bestellübersicht</h2>
            <ul className="summary-items">
              {items.map((item) => (
                <li key={item.itemId} className="summary-item">
                  <ItemImage item={item} />
                  <div>
                    <p className="summary-item__name">
                      {item.name}
                      {item.isCustom && <span className="badge">Dein Design</span>}
                    </p>
                    <p className="muted">
                      {colorLabel(item.color)} · {sizeLabel(item.size)}
                      {item.design ? ` · ${item.design.fullLabel}` : ''}
                    </p>
                    <p className="muted">
                      Menge: {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <p className="summary-item__total">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="totals">
              <div className="totals__row">
                <dt>Zwischensumme</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="totals__row">
                <dt>Versandkosten</dt>
                <dd>{selectedShipping ? formatPrice(selectedShipping.price) : 'Bitte Versandart wählen'}</dd>
              </div>
              <div className="totals__row totals__row--strong">
                <dt>Gesamtpreis</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <FormAlert message={submitError} />
            {form.submitted && !form.isValid && (
              <p className="field__error">Bitte überprüfe deine Eingaben.</p>
            )}
            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Bestellung wird gesendet …' : 'Zahlungspflichtig bestellen'}
            </button>
            <Link to="/warenkorb" className="link-back">
              Zurück zum Warenkorb
            </Link>
          </aside>
        </form>
      )}
    </section>
  );
}
