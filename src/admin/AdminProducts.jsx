import { useRef, useState } from 'react';
import { api, assetUrl } from '../api';
import { EmptyState, ErrorMessage, FormAlert, Loading } from '../components/Feedback';
import { RequiredNote, TextField } from '../components/FormFields';
import { focusFirstInvalid } from '../formUtils';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  categoryLabel,
  colorLabel,
  colorsWithImages,
  firstImage,
  formatPrice,
  hasSizePrices,
  sizeLabel,
  subcategoryLabel,
} from '../labels';

const priceError = (value) => {
  const text = String(value).trim().replace(',', '.');
  if (!text) return 'Bitte gib einen Preis ein.';
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return 'Bitte gib einen gültigen Preis ein (z. B. 49,90).';
  return null;
};
const toNumber = (value) => Number(String(value).trim().replace(',', '.'));

function ProductEditForm({ product, onCancel, onSaved }) {
  const toast = useToast();
  const isKids = hasSizePrices(product) || product.category === 'kids';
  const sizes = product.sizes || [];
  const [values, setValues] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price !== undefined ? String(product.price).replace('.', ',') : '',
    sizePrices: Object.fromEntries(
      sizes.map((size) => [size, String((product.pricesBySize || {})[size] ?? '').replace('.', ',')]),
    ),
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const errors = {};
  if (!values.name.trim()) errors.name = 'Bitte gib einen Produktnamen ein.';
  if (!values.description.trim()) errors.description = 'Bitte gib eine Beschreibung ein.';
  if (isKids) {
    sizes.forEach((size) => {
      const e = priceError(values.sizePrices[size]);
      if (e) errors[`size-${size}`] = e;
    });
  } else {
    const e = priceError(values.price);
    if (e) errors.price = e;
  }
  const show = (key) => (submitted || touched[key] ? errors[key] : undefined);
  const touch = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setError('');
    if (Object.keys(errors).length) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const body = { name: values.name.trim(), description: values.description.trim() };
    if (isKids) {
      body.pricesBySize = Object.fromEntries(sizes.map((size) => [size, toNumber(values.sizePrices[size])]));
    } else {
      body.price = toNumber(values.price);
    }
    setSaving(true);
    try {
      const updated = await api(`/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body });
      onSaved({ ...product, ...updated, imagesByColor: product.imagesByColor });
      toast.show('Das Produkt wurde gespeichert.');
    } catch (err) {
      setError(err.message || 'Das Produkt konnte nicht gespeichert werden.');
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-stack admin-edit-form">
      <RequiredNote />
      <TextField
        label="Produktname"
        required
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        onBlur={() => touch('name')}
        error={show('name')}
      />
      <TextField
        label="Beschreibung"
        required
        multiline
        rows={4}
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        onBlur={() => touch('description')}
        error={show('description')}
      />
      {isKids ? (
        <fieldset className="form-section">
          <legend>Preise nach Größe (in €)</legend>
          <div className="form-grid form-grid--3">
            {sizes.map((size) => (
              <TextField
                key={size}
                label={`Preis ${sizeLabel(size)}`}
                required
                inputMode="decimal"
                value={values.sizePrices[size]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, sizePrices: { ...v.sizePrices, [size]: e.target.value } }))
                }
                onBlur={() => touch(`size-${size}`)}
                error={show(`size-${size}`)}
              />
            ))}
          </div>
        </fieldset>
      ) : (
        <TextField
          label="Preis (in €)"
          required
          inputMode="decimal"
          value={values.price}
          onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
          onBlur={() => touch('price')}
          error={show('price')}
        />
      )}
      <FormAlert message={error} />
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Wird gespeichert …' : 'Speichern'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={saving}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function priceSummary(product) {
  if (hasSizePrices(product)) {
    return (product.sizes || Object.keys(product.pricesBySize))
      .map((size) => `${sizeLabel(size)}: ${formatPrice(product.pricesBySize[size])}`)
      .join(' · ');
  }
  return formatPrice(product.price);
}

export default function AdminProducts() {
  usePageTitle('Produkte – Adminbereich');
  const { data: products, loading, error, reload, setData } = useApi('/products');
  const [editingId, setEditingId] = useState(null);

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <h1>Produkte</h1>
      </header>
      {loading && <Loading text="Produkte werden geladen …" />}
      {!loading && error && <ErrorMessage error={error} onRetry={reload} />}
      {!loading && !error && products.length === 0 && <EmptyState text="Es sind keine Produkte vorhanden." />}
      {!loading && !error && products.length > 0 && (
        <ul className="admin-list">
          {products.map((product) => {
            const colors = colorsWithImages(product);
            const image = colors.length ? firstImage(product, colors[0]) : null;
            const editing = editingId === product.id;
            return (
              <li key={product.id} className="admin-card">
                <div className="admin-product">
                  <span className="admin-product__image">
                    {image ? <img src={assetUrl(image)} alt="" loading="lazy" /> : <span>Kein Bild</span>}
                  </span>
                  <div className="admin-product__info">
                    <h2 className="admin-card__title">{product.name}</h2>
                    <p className="muted">
                      {categoryLabel(product.category)}
                      {product.subcategory ? ` · ${subcategoryLabel(product.subcategory)}` : ''}
                      {product.customizable ? ' · Für „Dein Design“ verfügbar' : ''}
                    </p>
                    <p className="admin-product__description">{product.description}</p>
                    <p>
                      <strong>Preis:</strong> {priceSummary(product)}
                    </p>
                    <p className="muted">
                      Farben: {(product.colors || []).map(colorLabel).join(', ')}
                    </p>
                  </div>
                  {!editing && (
                    <button
                      type="button"
                      className="btn btn--secondary btn--small admin-product__edit"
                      onClick={() => setEditingId(product.id)}
                      aria-label={`${product.name} (${categoryLabel(product.category)}${product.subcategory ? `, ${subcategoryLabel(product.subcategory)}` : ''}) bearbeiten`}
                    >
                      Bearbeiten
                    </button>
                  )}
                </div>
                {editing && (
                  <ProductEditForm
                    product={product}
                    onCancel={() => setEditingId(null)}
                    onSaved={(updated) => {
                      setData((list) => list.map((p) => (p.id === updated.id ? updated : p)));
                      setEditingId(null);
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
