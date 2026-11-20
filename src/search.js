import { CATEGORY_LABELS, COLOR_LABELS, colorsWithImages } from './labels';

// Suchbegriffe je Kategorie (deutsche Bezeichnung und gängige Synonyme).
const CATEGORY_TERMS = {
  women: ['damen', 'dame', 'frau', 'frauen'],
  men: ['herren', 'herr', 'mann', 'männer'],
  kids: ['kinder', 'kind', 'kids'],
  dogs: ['hunde', 'hund'],
};

const SUBCATEGORY_TERMS = {
  girls: ['mädchen'],
  boys: ['jungen', 'junge', 'jungs'],
};

// Zusätzliche deutsche Farbbezeichnungen.
const COLOR_EXTRA_TERMS = {
  pink: ['pink'],
  plum: ['lila'],
  grey: ['grau'],
};

const normalize = (text) => String(text || '').toLocaleLowerCase('de-DE').trim();

/** Vergleich in beide Richtungen, z. B. „roter“ ↔ „rot“ oder „man“ ↔ „mann“. */
function termMatches(term, word) {
  if (term.includes(word)) return true;
  return term.length >= 3 && word.startsWith(term);
}

function productTerms(product) {
  const terms = [normalize(product.name), ...normalize(product.name).split(/\s+/)];
  terms.push(normalize(CATEGORY_LABELS[product.category]));
  terms.push(...(CATEGORY_TERMS[product.category] || []));
  if (product.category === 'kids') {
    // „Mädchen“ und „Jungen“ gehören zur Kategorie Kinder; bei Kinderprodukten
    // wird über die Unterkategorie gezielt gefiltert.
    terms.push(...(SUBCATEGORY_TERMS[product.subcategory] || []));
  }
  return terms.filter(Boolean);
}

function colorTerms(color) {
  return [normalize(COLOR_LABELS[color]), ...(COLOR_EXTRA_TERMS[color] || [])].filter(Boolean);
}

/**
 * Durchsucht die Produkte nach Produktname, Kategorie (inkl. Synonymen) und Farbe.
 * Ergebnis: Liste von { product, color }. Bei einem Treffer über die Farbe wird
 * die passende Farbvariante geliefert.
 */
export function searchProducts(products, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length || !Array.isArray(products)) return [];

  const results = [];
  products.forEach((product) => {
    const pTerms = productTerms(product);
    const matchesProduct = (word) => pTerms.some((term) => termMatches(term, word));
    const variants = colorsWithImages(product);
    const colors = variants.length ? variants : product.colors || [];

    const matching = colors.filter((color) => {
      const cTerms = colorTerms(color);
      return words.every((word) => matchesProduct(word) || cTerms.some((term) => termMatches(term, word)));
    });
    if (!matching.length) return;

    const colorDriven = words.some((word) => !matchesProduct(word));
    const selected = colorDriven ? matching : [matching[0]];
    selected.forEach((color) => results.push({ product, color }));
  });
  return results;
}
