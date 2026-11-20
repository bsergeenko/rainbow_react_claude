import { useApi } from '../hooks/useApi';
import { flattenDesigns } from '../labels';

/** Lädt alle Daten, die für Bestellübersichten im Adminbereich benötigt werden. */
export function useAdminOrderData() {
  const orders = useApi('/orders');
  const users = useApi('/users');
  const products = useApi('/products');
  const designs = useApi('/designs');
  const shipping = useApi('/shipping-options');
  const all = [orders, users, products, designs, shipping];

  return {
    orders,
    users,
    products: products.data,
    designs: flattenDesigns(designs.data),
    shippingOptions: shipping.data,
    loading: all.some((r) => r.loading),
    error: all.map((r) => r.error).find(Boolean) || null,
    retry: () => all.forEach((r) => r.error && r.reload()),
  };
}
