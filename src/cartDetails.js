import { firstImage, TARGET_LABELS, unitPriceFor } from './labels';

/**
 * Ergänzt Warenkorb- bzw. Bestellpositionen um Produktinformationen,
 * Bild, Rückenmotiv und Preis.
 */
export function enrichItem(item, products, designs) {
  const product = (products || []).find((p) => p.id === item.productId) || null;
  const design = item.designId ? (designs || []).find((d) => d.id === item.designId) || null : null;
  const productImage = product ? firstImage(product, item.color) : null;
  const image = productImage || (design ? design.image : null);
  const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : unitPriceFor(product, item.size);
  const quantity = Number(item.quantity) || 1;
  const isCustom = Boolean(item.designId);

  return {
    ...item,
    product,
    design,
    image,
    isCustom,
    name: product ? product.name : 'Unbekanntes Produkt',
    target: product ? TARGET_LABELS[product.category] : null,
    subcategory: product ? product.subcategory : null,
    unitPrice,
    quantity,
    lineTotal: item.itemTotal !== undefined ? Number(item.itemTotal) : unitPrice * quantity,
  };
}
