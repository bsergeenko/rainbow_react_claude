import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api';
import { useApi } from '../hooks/useApi';
import { categoryLabel, colorLabel, displayPrice, firstImage, productPath, subcategoryLabel } from '../labels';
import { searchProducts } from '../search';
import { ErrorMessage, Loading } from './Feedback';
import { CloseIcon, SearchIcon } from './Icons';

/** Suchfeld unterhalb der Navigation mit direkt angezeigten Ergebnissen. */
export default function SearchPanel({ onClose }) {
  const [query, setQuery] = useState('');
  const { data: products, loading, error, reload } = useApi('/products');
  const inputRef = useRef(null);
  const inputId = useId();
  const resultsId = useId();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => searchProducts(products || [], query), [products, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="search-panel"
      role="search"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="search-panel__inner">
        <div className="search-panel__bar">
          <label htmlFor={inputId} className="search-panel__label">
            Suche
          </label>
          <div className="search-field">
            <span className="search-field__icon" aria-hidden="true">
              <SearchIcon size={20} />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              className="input search-field__input"
              placeholder="Produkt, Kategorie oder Farbe suchen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-controls={resultsId}
              autoComplete="off"
            />
          </div>
          <button type="button" className="icon-button search-panel__close" onClick={onClose} aria-label="Suche schließen">
            <CloseIcon size={22} />
          </button>
        </div>

        <div id={resultsId} className="search-results" aria-live="polite">
          {hasQuery && loading && <Loading text="Produkte werden geladen …" inline />}
          {hasQuery && error && <ErrorMessage error={error} onRetry={reload} />}
          {hasQuery && !loading && !error && results.length === 0 && (
            <p className="search-results__empty">Keine Produkte gefunden.</p>
          )}
          {hasQuery && !loading && !error && results.length > 0 && (
            <ul className="search-results__list">
              {results.map(({ product, color }) => {
                const image = firstImage(product, color);
                return (
                  <li key={`${product.id}-${color}`}>
                    <Link to={productPath(product.id, color)} className="search-result" onClick={onClose}>
                      <span className="search-result__image">
                        {image && <img src={assetUrl(image)} alt="" loading="lazy" />}
                      </span>
                      <span className="search-result__text">
                        <span className="search-result__name">{product.name}</span>
                        <span className="search-result__meta">
                          {categoryLabel(product.category)}
                          {product.subcategory ? ` · ${subcategoryLabel(product.subcategory)}` : ''} ·{' '}
                          {colorLabel(color)}
                        </span>
                        <span className="search-result__price">{displayPrice(product)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
