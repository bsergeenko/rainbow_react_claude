import { Link, Navigate, useLocation } from 'react-router-dom';
import { ErrorMessage, Loading } from '../components/Feedback';
import { CheckIcon } from '../components/Icons';
import OrderDetails from '../components/OrderDetails';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { flattenDesigns, formatDate, statusLabel } from '../labels';

export default function OrderConfirmation() {
  usePageTitle('Bestellbestätigung');
  const location = useLocation();
  const { user } = useAuth();
  const order = location.state && location.state.order;
  const products = useApi(order ? '/products' : null);
  const designs = useApi(order ? '/designs' : null);
  const shipping = useApi(order ? '/shipping-options' : null);

  if (!order) return <Navigate to="/" replace />;

  const loading = products.loading || designs.loading || shipping.loading;
  const error = products.error || designs.error || shipping.error;

  return (
    <section className="page container container--medium confirmation">
      <div className="confirmation__header">
        <span className="confirmation__icon" aria-hidden="true">
          <CheckIcon size={32} />
        </span>
        <h1>Vielen Dank für deine Bestellung!</h1>
        <p>Deine Bestellung ist bei uns eingegangen.</p>
        <p className="confirmation__number">
          Bestellnummer: <strong>{order.id}</strong>
        </p>
        <p className="muted">
          Bestellt am {formatDate(order.createdAt)} · Status: {statusLabel(order.status)}
        </p>
      </div>

      <h2 className="section__subtitle">Zusammenfassung</h2>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage error={error} />}
      {!loading && !error && (
        <OrderDetails
          order={order}
          products={products.data}
          designs={flattenDesigns(designs.data)}
          shippingOptions={shipping.data}
        />
      )}

      <div className="button-row button-row--center">
        <Link to="/" className="btn btn--primary">
          Weiter einkaufen
        </Link>
        {user && (
          <Link to="/konto#meine-bestellungen" className="btn btn--secondary">
            Meine Bestellungen
          </Link>
        )}
      </div>
    </section>
  );
}
