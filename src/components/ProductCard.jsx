import { Link } from 'react-router-dom';
import { assetUrl } from '../api';
import { colorLabel, displayPrice, firstImage, productPath, subcategoryLabel } from '../labels';
import HeartButton from './HeartButton';

/** Produktkarte für eine Farbvariante eines Produkts. */
export default function ProductCard({ product, color }) {
  const image = firstImage(product, color);
  const to = productPath(product.id, color);

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={to} className="product-card__image-link" tabIndex={-1} aria-hidden="true">
          {image ? (
            <img src={assetUrl(image)} alt="" loading="lazy" className="product-card__image" />
          ) : (
            <span className="product-card__no-image">Kein Bild verfügbar</span>
          )}
        </Link>
        <HeartButton productId={product.id} color={color} productName={product.name} className="product-card__heart" />
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">
          <Link to={to}>{product.name}</Link>
        </h3>
        <p className="product-card__meta">
          {product.subcategory && <span>{subcategoryLabel(product.subcategory)} · </span>}
          <span>Farbe: {colorLabel(color)}</span>
        </p>
        <p className="product-card__price">{displayPrice(product)}</p>
      </div>
    </article>
  );
}
