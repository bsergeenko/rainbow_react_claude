import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { assetUrl } from '../api';
import { ErrorMessage, Loading, NotFoundContent } from '../components/Feedback';
import HeartButton from '../components/HeartButton';
import { ColorPicker, SizePicker } from '../components/Options';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  CATEGORY_SLUGS,
  categoryLabel,
  colorLabel,
  colorsWithImages,
  displayPrice,
  formatPrice,
  hasSizePrices,
  subcategoryLabel,
  unitPriceFor,
} from '../labels';

/** Bildergalerie: erstes Bild groß, weitere über Vorschaubilder auswählbar. */
function Gallery({ images, alt }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__main gallery__main--empty">Kein Bild verfügbar</div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery__main">
        <img src={assetUrl(current)} alt={alt} />
      </div>
      {images.length > 1 && (
        <ul className="gallery__thumbs" aria-label="Weitere Produktbilder">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                className={`gallery__thumb ${index === active ? 'is-selected' : ''}`}
                aria-pressed={index === active}
                aria-label={`Bild ${index + 1} von ${images.length} anzeigen`}
                onClick={() => setActive(index)}
              >
                <img src={assetUrl(image)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, loading, error, reload } = useApi(`/products/${encodeURIComponent(id)}`);
  usePageTitle(product ? product.name : 'Produkt');

  if (loading) return <Loading text="Produkt wird geladen …" />;
  if (error && error.status === 404) return <NotFoundContent />;
  if (error) {
    return (
      <div className="page container">
        <ErrorMessage error={error} title="Das Produkt konnte nicht geladen werden." onRetry={reload} />
      </div>
    );
  }
  if (!product) return null;
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const toast = useToast();

  const availableColors = colorsWithImages(product);
  const requested = searchParams.get('farbe');
  const color = availableColors.includes(requested) ? requested : availableColors[0] || null;

  const [size, setSize] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [adding, setAdding] = useState(false);

  const images = (color && product.imagesByColor[color]) || [];
  const isKids = hasSizePrices(product);
  const priceText = isKids && size ? formatPrice(unitPriceFor(product, size)) : displayPrice(product);

  const selectColor = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set('farbe', next);
    setSearchParams(params, { replace: true });
  };

  const handleAdd = async () => {
    if (!color) return;
    if (!size) {
      setSizeError('Bitte wähle eine Größe aus.');
      return;
    }
    setAdding(true);
    try {
      await addItem({ productId: product.id, color, size, quantity: 1 });
      toast.show('Das Produkt wurde in den Warenkorb gelegt.');
    } catch (err) {
      toast.show(err.message || 'Das Produkt konnte nicht in den Warenkorb gelegt werden.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const categoryPath = `/${CATEGORY_SLUGS[product.category] || ''}`;

  return (
    <article className="page container product-detail">
      <nav className="breadcrumb" aria-label="Brotkrümelnavigation">
        <Link to={categoryPath}>{categoryLabel(product.category)}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail__layout">
        <Gallery key={color} images={images} alt={`${product.name} in ${colorLabel(color)}`} />

        <div className="product-detail__info">
          <div className="product-detail__heading">
            <div>
              <p className="eyebrow">
                {categoryLabel(product.category)}
                {product.subcategory ? ` · ${subcategoryLabel(product.subcategory)}` : ''}
              </p>
              <h1>{product.name}</h1>
            </div>
            {color && <HeartButton productId={product.id} color={color} productName={product.name} />}
          </div>

          <p className="product-detail__price" aria-live="polite">
            {priceText}
          </p>

          <p className="product-detail__description">{product.description}</p>

          {availableColors.length > 0 && (
            <ColorPicker colors={availableColors} value={color} onChange={selectColor} />
          )}

          <SizePicker
            sizes={product.sizes || []}
            value={size}
            onChange={(next) => {
              setSize(next);
              setSizeError('');
            }}
            error={sizeError}
          />

          <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={adding || !color}>
            {adding ? 'Wird hinzugefügt …' : 'In den Warenkorb'}
          </button>

          {product.customizable && (
            <div className="product-detail__custom">
              <p>Gestalte diesen Mantel mit deinem Lieblingsmotiv.</p>
              <Link to="/dein-design" className="btn btn--secondary">
                Dein Design
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
