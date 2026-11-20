import { useState } from 'react';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { OptionGroup } from '../components/Options';
import ProductCard from '../components/ProductCard';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { CATEGORY_LABELS, colorsWithImages } from '../labels';

const KIDS_FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'girls', label: 'Mädchen' },
  { value: 'boys', label: 'Jungen' },
];

/** Produktübersicht einer Kategorie; jede Farbvariante mit Bild erhält eine eigene Karte. */
export default function CategoryPage({ category }) {
  const title = CATEGORY_LABELS[category];
  usePageTitle(title);
  const { data: products, loading, error, reload } = useApi('/products');
  const [filter, setFilter] = useState('all');

  const cards = (products || [])
    .filter((p) => p.category === category)
    .filter((p) => category !== 'kids' || filter === 'all' || p.subcategory === filter)
    .flatMap((product) => {
      const colors = colorsWithImages(product);
      const variants = colors.length ? colors : (product.colors || []).slice(0, 1);
      return variants.map((color) => ({ product, color }));
    });

  return (
    <section className="page container">
      <header className="page__header">
        <h1>{title}</h1>
      </header>

      {category === 'kids' && (
        <div className="filter-bar">
          <OptionGroup
            legend="Kinderprodukte filtern"
            hideLegend
            options={KIDS_FILTERS}
            value={filter}
            onChange={setFilter}
            variant="segment"
          />
        </div>
      )}

      {loading && <Loading text="Produkte werden geladen …" />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {!loading && !error && cards.length === 0 && (
        <EmptyState text="In dieser Kategorie sind derzeit keine Produkte vorhanden." />
      )}
      {!loading && !error && cards.length > 0 && (
        <ul className="product-grid">
          {cards.map(({ product, color }) => (
            <li key={`${product.id}-${color}`}>
              <ProductCard product={product} color={color} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
