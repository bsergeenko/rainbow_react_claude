import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatAddress } from '../labels';
import AdminOrderItem from './AdminOrderItem';
import { useAdminOrderData } from './useOrderContext';

export default function AdminUsers() {
  usePageTitle('Benutzer – Adminbereich');
  const data = useAdminOrderData();
  const users = data.users.data || [];
  const orders = [...(data.orders.data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const updateOrder = (updated) =>
    data.orders.setData((list) => list.map((o) => (o.id === updated.id ? updated : o)));

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <h1>Benutzer</h1>
      </header>
      {data.loading && <Loading text="Benutzer werden geladen …" />}
      {!data.loading && data.error && <ErrorMessage error={data.error} onRetry={data.retry} />}
      {!data.loading && !data.error && users.length === 0 && (
        <EmptyState text="Es sind derzeit keine Benutzer registriert." />
      )}
      {!data.loading && !data.error && users.length > 0 && (
        <ul className="admin-list">
          {users.map((user) => {
            const userOrders = orders.filter((o) => o.userId === user.id);
            const addressLines = formatAddress(user.address);
            return (
              <li key={user.id} className="admin-card">
                <h2 className="admin-card__title">
                  {user.firstName} {user.lastName}
                </h2>
                <dl className="data-list data-list--inline">
                  <div>
                    <dt>Vorname</dt>
                    <dd>{user.firstName}</dd>
                  </div>
                  <div>
                    <dt>Nachname</dt>
                    <dd>{user.lastName}</dd>
                  </div>
                  <div>
                    <dt>E-Mail-Adresse</dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div>
                    <dt>Gespeicherte Adresse</dt>
                    <dd>
                      {addressLines.length > 0
                        ? addressLines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))
                        : 'Keine Adresse gespeichert'}
                    </dd>
                  </div>
                </dl>
                <h3 className="admin-card__subtitle">Bestellungen</h3>
                {userOrders.length === 0 ? (
                  <p className="muted">Für diesen Benutzer sind keine Bestellungen vorhanden.</p>
                ) : (
                  <ul className="order-list">
                    {userOrders.map((order) => (
                      <AdminOrderItem
                        key={order.id}
                        order={order}
                        users={users}
                        products={data.products}
                        designs={data.designs}
                        shippingOptions={data.shippingOptions}
                        showCustomer={false}
                        onUpdated={updateOrder}
                      />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
