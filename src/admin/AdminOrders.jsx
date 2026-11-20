import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { usePageTitle } from '../hooks/usePageTitle';
import AdminOrderItem from './AdminOrderItem';
import { useAdminOrderData } from './useOrderContext';

export default function AdminOrders() {
  usePageTitle('Bestellungen – Adminbereich');
  const data = useAdminOrderData();
  const orders = [...(data.orders.data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const updateOrder = (updated) =>
    data.orders.setData((list) => list.map((o) => (o.id === updated.id ? updated : o)));

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <h1>Bestellungen</h1>
      </header>
      {data.loading && <Loading text="Bestellungen werden geladen …" />}
      {!data.loading && data.error && <ErrorMessage error={data.error} onRetry={data.retry} />}
      {!data.loading && !data.error && orders.length === 0 && <EmptyState text="Es sind keine Bestellungen vorhanden." />}
      {!data.loading && !data.error && orders.length > 0 && (
        <ul className="order-list">
          {orders.map((order) => (
            <AdminOrderItem
              key={order.id}
              order={order}
              users={data.users.data}
              products={data.products}
              designs={data.designs}
              shippingOptions={data.shippingOptions}
              onUpdated={updateOrder}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
