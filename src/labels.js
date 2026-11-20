// Deutsche Bezeichnungen für API-Werte sowie Formatierungs- und Produkthilfen.

export const CATEGORY_LABELS = {
  women: 'Damen',
  men: 'Herren',
  kids: 'Kinder',
  dogs: 'Hunde',
};

export const CATEGORY_SLUGS = {
  women: 'damen',
  men: 'herren',
  kids: 'kinder',
  dogs: 'hunde',
};

/** Bezeichnung der Zielgruppe in „Dein Design“ („Für wen?“). */
export const TARGET_LABELS = {
  women: 'Damen',
  men: 'Herren',
  kids: 'Kinder',
  dogs: 'Hund',
};

export const SUBCATEGORY_LABELS = {
  girls: 'Mädchen',
  boys: 'Jungen',
};

export const COLOR_LABELS = {
  black: 'Schwarz',
  red: 'Rot',
  blue: 'Blau',
  aquablue: 'Aquablau',
  turquoise: 'Türkis',
  pink: 'Rosa',
  yellow: 'Gelb',
  plum: 'Pflaume',
  green: 'Grün',
  grey: 'Grau',
  magenta: 'Magenta',
  beige: 'Beige',
  brown: 'Braun',
  orange: 'Orange',
  silver: 'Silber',
};

/** Darstellungsfarben für die Farbfelder der Farbauswahl. */
export const COLOR_SWATCHES = {
  black: '#1f1f1f',
  red: '#d62828',
  blue: '#1f5fbf',
  aquablue: '#45b8dc',
  turquoise: '#1fb5a3',
  pink: '#f5a3c7',
  yellow: '#f7d038',
  plum: '#7b3466',
  green: '#2f9e4f',
  grey: '#8a8a8a',
  magenta: '#d0218f',
  beige: '#dcc7a1',
  brown: '#7a4b2a',
  orange: '#f28c28',
  silver: '#c4c4c4',
};

export const ORDER_STATUS_LABELS = {
  new: 'Bestätigt',
  processing: 'In Bearbeitung',
  shipped: 'Versendet',
  delivered: 'Zugestellt',
  cancelled: 'Storniert',
};

export const ROLE_LABELS = {
  user: 'Benutzer',
  admin: 'Administrator',
  main_admin: 'Hauptadministrator',
};

export const PAYMENT_LABELS = {
  card: 'Kartenzahlung',
};

export const DESIGN_GROUP_LABELS = {
  adult: 'Erwachsene',
  kids: 'Kinder',
};

const KIDS_SIZE_LABELS = {
  '2-3': '2–3 Jahre',
  '4-7': '4–7 Jahre',
  '8-12': '8–12 Jahre',
};

export const colorLabel = (color) => COLOR_LABELS[color] || color;
export const categoryLabel = (category) => CATEGORY_LABELS[category] || category;
export const subcategoryLabel = (sub) => SUBCATEGORY_LABELS[sub] || sub;
export const statusLabel = (status) => ORDER_STATUS_LABELS[status] || status;
export const roleLabel = (role) => ROLE_LABELS[role] || role;
export const sizeLabel = (size) => KIDS_SIZE_LABELS[size] || size;
export const paymentLabel = (method) => PAYMENT_LABELS[method] || method;

const priceFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
export const formatPrice = (value) => priceFormatter.format(Number(value) || 0);

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
export const formatDate = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : `${dateFormatter.format(date)} Uhr`;
};

/* ---------- Produkte ---------- */

export const hasSizePrices = (product) =>
  Boolean(product && product.pricesBySize && typeof product.pricesBySize === 'object');

/** Niedrigster Preis aus pricesBySize. */
export const lowestSizePrice = (product) => {
  const values = Object.values(product.pricesBySize || {}).map(Number).filter(Number.isFinite);
  return values.length ? Math.min(...values) : 0;
};

/** Preistext für Übersichten: Kinderprodukte „ab …“, sonst der feste Preis. */
export const displayPrice = (product) =>
  hasSizePrices(product) ? `ab ${formatPrice(lowestSizePrice(product))}` : formatPrice(product.price);

/** Einzelpreis für eine konkrete Größe. */
export const unitPriceFor = (product, size) => {
  if (!product) return 0;
  if (hasSizePrices(product)) return Number(product.pricesBySize[size]) || 0;
  return Number(product.price) || 0;
};

/** Farben eines Produkts, für die Produktbilder vorhanden sind (in Reihenfolge von colors). */
export const colorsWithImages = (product) => {
  const images = product.imagesByColor || {};
  const ordered = (product.colors || []).filter((c) => images[c] && images[c].length > 0);
  const extra = Object.keys(images).filter((c) => !ordered.includes(c) && images[c].length > 0);
  return [...ordered, ...extra];
};

export const firstImage = (product, color) => {
  const list = product && product.imagesByColor && product.imagesByColor[color];
  return list && list.length ? list[0] : null;
};

export const productPath = (productId, color) =>
  `/produkt/${encodeURIComponent(productId)}${color ? `?farbe=${encodeURIComponent(color)}` : ''}`;

/* ---------- Rückenmotive ---------- */

/** Flache Liste aller Motive mit Gruppe und lesbarer Bezeichnung. */
export const flattenDesigns = (designs) => {
  if (!designs) return [];
  return ['adult', 'kids'].flatMap((group) =>
    (designs[group] || []).map((design, index) => {
      const match = /(\d+)\s*$/.exec(design.id || '');
      const number = match ? Number(match[1]) : index + 1;
      return {
        ...design,
        group,
        number,
        label: `Motiv ${number}`,
        fullLabel: `Motiv ${number} (${DESIGN_GROUP_LABELS[group]})`,
      };
    }),
  );
};

/* ---------- Validierung ---------- */

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

export const formatAddress = (address) => {
  if (!address) return [];
  const lines = [];
  if (address.street && address.street.trim()) lines.push(address.street.trim());
  const cityLine = [address.postalCode, address.city].filter((v) => v && v.trim()).join(' ');
  if (cityLine) lines.push(cityLine);
  if (address.country && address.country.trim()) lines.push(address.country.trim());
  return lines;
};
