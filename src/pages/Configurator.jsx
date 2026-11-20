import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assetUrl } from '../api';
import { ErrorMessage, Loading } from '../components/Feedback';
import { TextField } from '../components/FormFields';
import { ColorPicker, OptionGroup, SizePicker } from '../components/Options';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  colorLabel,
  firstImage,
  flattenDesigns,
  formatPrice,
  hasSizePrices,
  lowestSizePrice,
  sizeLabel,
  SUBCATEGORY_LABELS,
  TARGET_LABELS,
  unitPriceFor,
} from '../labels';

const CATALOG_FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'adult', label: 'Erwachsene' },
  { value: 'kids', label: 'Kinder' },
];

const TARGET_OPTIONS = ['women', 'men', 'kids', 'dogs'].map((value) => ({ value, label: TARGET_LABELS[value] }));
const KIDS_OPTIONS = ['girls', 'boys'].map((value) => ({ value, label: SUBCATEGORY_LABELS[value] }));

const NO_PREVIEW_TEXT =
  'Für diese Farbe ist kein Vorschaubild vorhanden. Der Mantel kann trotzdem in dieser Farbe bestellt werden.';

export default function Configurator() {
  usePageTitle('Dein Design');
  const products = useApi('/products');
  const colors = useApi('/custom-colors');
  const designsApi = useApi('/designs');

  const loading = products.loading || colors.loading || designsApi.loading;
  const error = products.error || colors.error || designsApi.error;

  const reloadAll = () => {
    if (products.error) products.reload();
    if (colors.error) colors.reload();
    if (designsApi.error) designsApi.reload();
  };

  return (
    <section className="page container configurator">
      <header className="page__header">
        <h1>Dein Design</h1>
      </header>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage error={error} onRetry={reloadAll} />}
      {!loading && !error && (
        <ConfiguratorContent
          products={products.data || []}
          customColors={colors.data || []}
          designs={flattenDesigns(designsApi.data)}
        />
      )}
    </section>
  );
}

function ConfiguratorContent({ products, customColors, designs }) {
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const toast = useToast();

  // Vorauswahl eines Motivs nur beim Einstieg über die Startseite (?motiv=…).
  const initialDesign = designs.find((d) => d.id === searchParams.get('motiv'));
  const [designId, setDesignId] = useState(initialDesign ? initialDesign.id : null);
  const [choosingMotif, setChoosingMotif] = useState(!initialDesign);
  const [catalogFilter, setCatalogFilter] = useState('all');

  const [target, setTarget] = useState(null);
  const [kidsType, setKidsType] = useState(null);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [pocket, setPocket] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [adding, setAdding] = useState(false);

  const design = designs.find((d) => d.id === designId) || null;

  const product =
    target && (target !== 'kids' || kidsType)
      ? products.find(
          (p) => p.customizable && p.category === target && (target !== 'kids' || p.subcategory === kidsType),
        ) || null
      : null;

  const sizes = product ? product.sizes || [] : [];
  const isKids = target === 'kids';
  const price = product ? (hasSizePrices(product) ? (size ? unitPriceFor(product, size) : null) : product.price) : null;
  const preview = product && color ? firstImage(product, color) : null;

  const errors = {
    target: !target ? 'Bitte wähle aus, für wen der Mantel ist.' : null,
    kidsType: isKids && !kidsType ? 'Bitte wähle Mädchen oder Jungen aus.' : null,
    color: !color ? 'Bitte wähle eine Farbe aus.' : null,
    size: !size ? 'Bitte wähle eine Größe aus.' : null,
    product: target && (!isKids || kidsType) && !product ? 'Für diese Auswahl ist derzeit kein Produkt verfügbar.' : null,
  };
  const showError = (key) => (attempted ? errors[key] : null);

  const chooseTarget = (value) => {
    setTarget(value);
    if (value !== 'kids') setKidsType(null);
    // Größen unterscheiden sich zwischen Kinder- und Erwachsenenprodukten.
    const nextProduct = products.find(
      (p) => p.customizable && p.category === value && (value !== 'kids' || p.subcategory === kidsType),
    );
    if (!nextProduct || !(nextProduct.sizes || []).includes(size)) setSize(null);
  };

  const pickDesign = (id) => {
    setDesignId(id);
    setChoosingMotif(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = async () => {
    setAttempted(true);
    if (!design || Object.values(errors).some(Boolean) || !product) return;
    setAdding(true);
    try {
      await addItem({
        productId: product.id,
        color,
        size,
        designId: design.id,
        pocketRequest: pocket.trim(),
        quantity: 1,
      });
      toast.show('Dein Design wurde in den Warenkorb gelegt.');
    } catch (err) {
      toast.show(err.message || 'Dein Design konnte nicht in den Warenkorb gelegt werden.', 'error');
    } finally {
      setAdding(false);
    }
  };

  /* ---------- Motivkatalog ---------- */
  if (choosingMotif || !design) {
    const visible = designs.filter((d) => catalogFilter === 'all' || d.group === catalogFilter);
    return (
      <div className="motif-catalog">
        <p className="intro-text">
          Wähle zuerst ein Rückenmotiv aus. Anschließend konfigurierst du deinen Mantel für Damen, Herren, Kinder oder
          Hund.
        </p>
        <div className="filter-bar">
          <OptionGroup
            legend="Motive filtern"
            hideLegend
            options={CATALOG_FILTERS}
            value={catalogFilter}
            onChange={setCatalogFilter}
            variant="segment"
          />
          {design && (
            <button type="button" className="btn btn--secondary" onClick={() => setChoosingMotif(false)}>
              Zurück zur Konfiguration
            </button>
          )}
        </div>
        <ul className="motif-grid">
          {visible.map((d) => {
            const selected = d.id === designId;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  className={`motif-card ${selected ? 'is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => pickDesign(d.id)}
                >
                  <span className="motif-card__image">
                    <img src={assetUrl(d.image)} alt="" loading="lazy" />
                  </span>
                  <span className="motif-card__label">{d.fullLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ---------- Konfiguration ---------- */
  return (
    <div className="config-layout">
      <aside className="config-motif" aria-label="Ausgewähltes Rückenmotiv">
        <p className="config-motif__label">Dein Rückenmotiv</p>
        <div className="config-motif__image">
          <img src={assetUrl(design.image)} alt={`Ausgewähltes Rückenmotiv: ${design.fullLabel}`} />
        </div>
        <p className="config-motif__name">{design.fullLabel}</p>
        <button type="button" className="btn btn--secondary btn--block" onClick={() => setChoosingMotif(true)}>
          Motiv ändern
        </button>
      </aside>

      <div className="config-steps">
        <OptionGroup
          legend="Für wen?"
          options={TARGET_OPTIONS}
          value={target}
          onChange={chooseTarget}
          error={showError('target')}
        />

        {isKids && (
          <OptionGroup
            legend="Mädchen oder Jungen?"
            options={KIDS_OPTIONS}
            value={kidsType}
            onChange={setKidsType}
            error={showError('kidsType')}
          />
        )}

        <ColorPicker colors={customColors} value={color} onChange={setColor} error={showError('color')} />

        <div className="config-preview" aria-live="polite">
          {!product || !color ? (
            <p className="config-preview__hint">
              Wähle „Für wen?“ und eine Farbe, um die Vorschau deines Mantels zu sehen.
            </p>
          ) : preview ? (
            <img
              src={assetUrl(preview)}
              alt={`Vorschau: ${product.name} für ${TARGET_LABELS[target]} in ${colorLabel(color)}`}
            />
          ) : (
            <p className="config-preview__hint config-preview__hint--notice">{NO_PREVIEW_TEXT}</p>
          )}
        </div>

        {product ? (
          <SizePicker sizes={sizes} value={size} onChange={setSize} error={showError('size')} />
        ) : (
          <fieldset className="option-group">
            <legend className="option-group__legend">Größe</legend>
            <p className="muted">Die Größen werden nach der Auswahl „Für wen?“ angezeigt.</p>
            {showError('size') && <p className="field__error">{errors.size}</p>}
          </fieldset>
        )}

        <TextField
            label="Taschendesign (optional)"
            hint="Die Taschen werden von der Designerin passend zu Mantelfarbe und Rückenmotiv gestaltet."
            multiline
            rows={3}
            value={pocket}
            onChange={(event) => setPocket(event.target.value)}
            placeholder="Beschreibe deinen Wunsch für die Taschen"
            maxLength={500}
          />

        <section className="summary-box" aria-labelledby="zusammenfassung-titel">
          <h2 id="zusammenfassung-titel">Zusammenfassung</h2>
          <dl className="summary-list">
            <div>
              <dt>Für wen?</dt>
              <dd>{target ? TARGET_LABELS[target] : 'Noch nicht ausgewählt'}</dd>
            </div>
            {isKids && (
              <div>
                <dt>Mädchen oder Jungen</dt>
                <dd>{kidsType ? SUBCATEGORY_LABELS[kidsType] : 'Noch nicht ausgewählt'}</dd>
              </div>
            )}
            <div>
              <dt>Farbe</dt>
              <dd>{color ? colorLabel(color) : 'Noch nicht ausgewählt'}</dd>
            </div>
            <div>
              <dt>Größe</dt>
              <dd>{size ? sizeLabel(size) : 'Noch nicht ausgewählt'}</dd>
            </div>
            <div>
              <dt>Rückenmotiv</dt>
              <dd className="summary-list__motif">
                <img src={assetUrl(design.image)} alt="" />
                {design.fullLabel}
              </dd>
            </div>
            <div>
              <dt>Taschenwunsch</dt>
              <dd className="pre-wrap">{pocket.trim() ? pocket.trim() : 'Keine Angabe'}</dd>
            </div>
            <div className="summary-list__total">
              <dt>Preis</dt>
              <dd>
                {price !== null
                  ? formatPrice(price)
                  : product && hasSizePrices(product)
                    ? `ab ${formatPrice(lowestSizePrice(product))}`
                    : 'Abhängig von deiner Auswahl'}
              </dd>
            </div>
          </dl>
          {attempted && errors.product && <p className="field__error">{errors.product}</p>}
          {attempted && Object.values(errors).some(Boolean) && (
            <p className="field__error" role="alert">
              Bitte vervollständige deine Auswahl.
            </p>
          )}
          <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={adding}>
            {adding ? 'Wird hinzugefügt …' : 'In den Warenkorb'}
          </button>
        </section>
      </div>
    </div>
  );
}
