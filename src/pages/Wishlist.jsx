import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { assetUrl } from '../api';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import HeartButton from '../components/HeartButton';
import { useWishlist } from '../context/WishlistContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { categoryLabel, colorLabel, displayPrice, firstImage, productPath, subcategoryLabel } from '../labels';

export default function Wishlist() {
  usePageTitle('Wunschliste');
  const location = useLocation();
  const { items, loading, error, reload } = useWishlist();
  const fromAccount = Boolean(location.state && location.state.fromAccount);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <section className="page container">
      {fromAccount && (
        <Link to="/konto" className="link-back">
          ← Zurück zum Benutzerkonto
        </Link>
      )}
      <header className="page__header">
        <h1>Wunschliste</h1>
      </header>

      {loading && <Loading text="Wunschliste wird geladen …" />}
      {!loading && error && <ErrorMessage error={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState text="Deine Wunschliste ist leer.">
          <Link to="/" className="btn btn--primary">
            Produkte entdecken
          </Link>
        </EmptyState>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="product-grid">
          {items.map((entry) => {
            const product = entry.product;
            const image = firstImage(product, entry.color);
            const to = productPath(entry.productId, entry.color);
            return (
              <li key={entry.itemId}>
                <article className="product-card">
                  <div className="product-card__media">
                    <Link to={to} className="product-card__image-link" tabIndex={-1} aria-hidden="true">
                      {image ? (
                        <img src={assetUrl(image)} alt="" loading="lazy" className="product-card__image" />
                      ) : (
                        <span className="product-card__no-image">Kein Bild verfügbar</span>
                      )}
                    </Link>
                    <HeartButton
                      productId={entry.productId}
                      color={entry.color}
                      productName={product.name}
                      className="product-card__heart"
                    />
                  </div>
                  <div className="product-card__body">
                    <h2 className="product-card__title">
                      <Link to={to}>{product.name}</Link>
                    </h2>
                    <p className="product-card__meta">
                      {categoryLabel(product.category)}
                      {product.subcategory ? ` · ${subcategoryLabel(product.subcategory)}` : ''} · Farbe:{' '}
                      {colorLabel(entry.color)}
                    </p>
                    <p className="product-card__price">{displayPrice(product)}</p>
                    <Link to={to} className="btn btn--secondary btn--small">
                      Größe wählen
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
